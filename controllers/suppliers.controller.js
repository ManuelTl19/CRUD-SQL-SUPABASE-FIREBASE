// Controlador: coordina la logica del recurso, acceso a datos y respuestas HTTP.
const db = require("../config/db");
const suppliersModel = require("../modelos/suppliers.model");
const { sendDbError } = require("./_dbErrors");
const { createTicketPdf } = require("./_pdfBuilder");

function toMoney(value) {
  const amount = Number(value || 0);
  return Number.isFinite(amount) ? amount.toFixed(2) : "0.00";
}

function aggregateRequestItems(items) {
  const grouped = new Map();

  items.forEach((entry) => {
    const current = grouped.get(entry.productId) || {
      productId: entry.productId,
      quantity: 0,
      description: "",
    };

    current.quantity += Number(entry.quantity || 0);
    if (entry.description) {
      current.description = current.description
        ? `${current.description}; ${entry.description}`
        : entry.description;
    }

    grouped.set(entry.productId, current);
  });

  return Array.from(grouped.values());
}

// Flujo general del controlador Suppliers:
// 1) Recibe req/res desde la ruta.
// 2) Valida parametros y/o body segun la operacion.
// 3) Para CREATE/UPDATE usa suppliersModel como lista blanca de campos permitidos.
// 4) Ejecuta SQL parametrizado con db.query para evitar inyeccion.
// 5) Devuelve respuesta HTTP (200/201/404/400/409/500).
// 6) Ante errores SQL delega en sendDbError para un manejo uniforme.

// Obtener todos
exports.getAll = async (req, res) => {
  try {
    const [rows] = await db.query("SELECT * FROM suppliers");
    res.json(rows);
  } catch (error) {
    sendDbError(res, error);
  }
};

// Obtener por ID
exports.getById = async (req, res) => {
  try {
    const [rows] = await db.query(
      "SELECT * FROM suppliers WHERE SupplierID = ?",
      [req.params.id]
    );
    if (rows.length === 0) {
      return res.status(404).json({ message: "Proveedor no encontrado" });
    }
    res.json(rows[0]);
  } catch (error) {
    sendDbError(res, error);
  }
};

// Crear
exports.create = async (req, res) => {
  try {
    // CREATE: filtra el body antes de insertar para no persistir campos inesperados.
    const payload = suppliersModel.createData(req.body);
    const [result] = await db.query(
      "INSERT INTO suppliers SET ?",
      payload
    );
    res.status(201).json({ message: "Proveedor creado", id: result.insertId });
  } catch (error) {
    sendDbError(res, error, {
      onReferenced: "No se puede eliminar el proveedor porque tiene productos asociados",
    });
  }
};

// Actualizar
exports.update = async (req, res) => {
  try {
    // UPDATE: misma lista blanca del modelo para mantener consistencia de datos.
    const payload = suppliersModel.updateData(req.body);
    const [result] = await db.query(
      "UPDATE suppliers SET ? WHERE SupplierID = ?",
      [payload, req.params.id]
    );
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Proveedor no encontrado" });
    }
    res.json({ message: "Proveedor actualizado" });
  } catch (error) {
    sendDbError(res, error);
  }
};

// Eliminar
exports.remove = async (req, res) => {
  try {
    const [result] = await db.query(
      "DELETE FROM suppliers WHERE SupplierID = ?",
      [req.params.id]
    );
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Proveedor no encontrado" });
    }
    res.json({ message: "Proveedor eliminado" });
  } catch (error) {
    sendDbError(res, error);
  }
};

// GET /suppliers/:id/purchase-request-pdf
exports.getPurchaseRequestPdf = async (req, res) => {
  // Flujo PDF de compra:
  // A) Validar SupplierID.
  // B) Confirmar que el proveedor exista.
  // C) Obtener productos: personalizados (body.items) o automaticos (stock bajo).
  // D) Armar detalle de lineas y total estimado.
  // E) Generar PDF y devolverlo como attachment.
  const supplierId = Number(req.params.id);

  if (!Number.isInteger(supplierId) || supplierId <= 0) {
    return res.status(400).json({ message: "ID de proveedor invalido" });
  }

  const connection = await db.getConnection();

  try {
    await connection.beginTransaction();

    const [supplierRows] = await connection.query(
      "SELECT SupplierID, CompanyName, ContactName FROM suppliers WHERE SupplierID = ?",
      [supplierId]
    );

    if (supplierRows.length === 0) {
      return res.status(404).json({ message: "Proveedor no encontrado" });
    }

    const supplier = supplierRows[0];

    const requesterName = String(req.body?.requesterName || "Compras").trim() || "Compras";
    const requesterArea = String(req.body?.requesterArea || "Area de Compras").trim() || "Area de Compras";
    const neededDate = String(req.body?.neededDate || "No especificada").trim() || "No especificada";
    const notes = String(req.body?.notes || "").trim();
    const requestItems = Array.isArray(req.body?.items) ? req.body.items : [];

    let sourceProducts = [];
    let normalizedRequestItems = [];

    if (requestItems.length > 0) {
      // Caso manual: el cliente define productos/cantidades en el body.
      normalizedRequestItems = requestItems
        .map((entry) => ({
          productId: Number(entry?.productId),
          quantity: Number(entry?.quantity),
          description: String(entry?.description || "").trim(),
        }))
        .filter((entry) => Number.isInteger(entry.productId) && entry.productId > 0)
        .filter((entry) => Number.isFinite(entry.quantity) && entry.quantity > 0);

      if (normalizedRequestItems.length === 0) {
        return res.status(400).json({ message: "Debes enviar al menos un producto valido" });
      }

      const uniqueProductIds = Array.from(new Set(normalizedRequestItems.map((entry) => entry.productId)));
      const [rows] = await connection.query(
        `SELECT ProductID, ProductName, SupplierID,
                COALESCE(stock, UnitsInStock, 0) AS stock,
                COALESCE(UnitsInStock, 0) AS UnitsInStock,
                COALESCE(UnitPrice, 0) AS UnitPrice,
                Discontinued
         FROM products
         WHERE SupplierID = ?
           AND ProductID IN (?)
           AND Discontinued = 0
         ORDER BY ProductName`,
        [supplierId, uniqueProductIds]
      );

      if (rows.length !== uniqueProductIds.length) {
        return res.status(400).json({
          message: "Uno o mas productos no pertenecen al proveedor o estan descontinuados",
        });
      }

      sourceProducts = rows;
    } else {
      // Caso automatico: se proponen productos con stock bajo del proveedor.
      const [products] = await connection.query(
        `SELECT ProductID, ProductName, COALESCE(stock, UnitsInStock, 0) AS stock,
                COALESCE(UnitsInStock, 0) AS UnitsInStock,
                COALESCE(ReorderLevel, 10) AS ReorderLevel,
                COALESCE(UnitPrice, 0) AS UnitPrice
         FROM products
         WHERE SupplierID = ?
           AND Discontinued = 0
           AND COALESCE(stock, UnitsInStock, 0) < 10
         ORDER BY ProductName`,
        [supplierId]
      );
      sourceProducts = products;
      normalizedRequestItems = products.map((item) => {
        const stock = Number(item.stock || 0);
        const reorder = Number(item.ReorderLevel || 10);
        return {
          productId: Number(item.ProductID),
          quantity: Math.max(reorder - stock, 10 - stock, 1),
          description: "",
        };
      });
    }

    const aggregatedItems = aggregateRequestItems(normalizedRequestItems);

    let estimatedTotal = 0;
    const items = [];

    if (sourceProducts.length === 0) {
      items.push({
        name: "Sin productos con stock bajo",
        qty: "0",
        price: "0.00",
        total: "0.00",
      });
    } else {
      const productMap = new Map(sourceProducts.map((item) => [Number(item.ProductID), item]));
      const stockCursorMap = new Map(
        sourceProducts.map((item) => [Number(item.ProductID), Number(item.stock || 0)])
      );

      for (const entry of aggregatedItems) {
        const product = productMap.get(entry.productId);
        if (!product) {
          continue;
        }

        const currentStock = Number(product.stock || 0);
        const currentUnitsInStock = Number(product.UnitsInStock || 0);
        const requestedQty = Number(entry.quantity || 0);
        const nextStock = currentStock + requestedQty;
        const nextUnitsInStock = currentUnitsInStock + requestedQty;

        await connection.query(
          `UPDATE products
           SET stock = ?, UnitsInStock = ?, isLowStock = ?
           WHERE ProductID = ?`,
          [nextStock, nextUnitsInStock, nextStock < 10 ? 1 : 0, entry.productId]
        );

        product.stock = nextStock;
        product.UnitsInStock = nextUnitsInStock;
      }

      normalizedRequestItems.forEach((requestItem) => {
        const product = productMap.get(requestItem.productId);
        if (!product) {
          return;
        }

        const quantity = Number(requestItem.quantity || 0);
        const lineTotal = quantity * Number(product.UnitPrice || 0);
        const descriptionSuffix = requestItem.description
          ? ` - ${requestItem.description}`
          : "";
        const stockBeforeLine = Number(stockCursorMap.get(requestItem.productId) || 0);
        const stockAfterLine = stockBeforeLine + quantity;
        stockCursorMap.set(requestItem.productId, stockAfterLine);

        estimatedTotal += lineTotal;

        items.push({
          name: `${product.ProductName}${descriptionSuffix} (Stock: ${stockBeforeLine} -> ${stockAfterLine})`,
          qty: String(quantity),
          price: toMoney(product.UnitPrice),
          total: toMoney(lineTotal),
        });
      });
    }

    await connection.commit();

    const pdfBuffer = await createTicketPdf({
      layout: "supplier-invoice",
      title: "SOLICITUD DE COMPRA",
      brandName: "Northwind",
      brandSubtitle: "Abastecimiento",
      invoice: {
        supplierName: supplier.CompanyName,
        contactName: supplier.ContactName || "N/A",
        folio: `SC-${supplierId}-${Date.now().toString().slice(-6)}`,
        requestDate: new Date().toISOString(),
        requesterName,
        requesterArea,
        neededDate,
        notes,
      },
      items,
      totals: [
        { label: "Subtotal", value: toMoney(estimatedTotal) },
        { label: "Total solicitado", value: toMoney(estimatedTotal), bold: true },
      ],
      footerThanks: "Gracias por su atencion y pronta respuesta.",
      footerCompany: "Northwind Suministros",
    });

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename=solicitud-compra-proveedor-${supplierId}.pdf`
    );
    // Respuesta binaria del PDF para descarga directa desde navegador/cliente.
    return res.send(pdfBuffer);
  } catch (error) {
    await connection.rollback();
    return sendDbError(res, error);
  } finally {
    connection.release();
  }
};
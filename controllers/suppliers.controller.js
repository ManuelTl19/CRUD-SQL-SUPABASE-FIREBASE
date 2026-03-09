const db = require("../config/db");
const suppliersModel = require("../modelos/suppliers.model");
const { sendDbError } = require("./_dbErrors");
const { createTicketPdf } = require("./_pdfBuilder");

function toMoney(value) {
  const amount = Number(value || 0);
  return Number.isFinite(amount) ? amount.toFixed(2) : "0.00";
}

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
  const supplierId = Number(req.params.id);

  if (!Number.isInteger(supplierId) || supplierId <= 0) {
    return res.status(400).json({ message: "ID de proveedor invalido" });
  }

  try {
    const [supplierRows] = await db.query(
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
      const [rows] = await db.query(
        `SELECT ProductID, ProductName, SupplierID,
                COALESCE(stock, UnitsInStock, 0) AS stock,
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
      const [products] = await db.query(
        `SELECT ProductID, ProductName, COALESCE(stock, UnitsInStock, 0) AS stock,
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

        estimatedTotal += lineTotal;

        items.push({
          name: `${product.ProductName}${descriptionSuffix}`,
          qty: String(quantity),
          price: toMoney(product.UnitPrice),
          total: toMoney(lineTotal),
        });
      });
    }

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
    return res.send(pdfBuffer);
  } catch (error) {
    return sendDbError(res, error);
  }
};
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

    const supplier = supplierRows[0];

    const requesterName = String(req.body?.requesterName || "Compras").trim() || "Compras";
    const requesterArea = String(req.body?.requesterArea || "Area de Compras").trim() || "Area de Compras";
    const neededDate = String(req.body?.neededDate || "No especificada").trim() || "No especificada";
    const notes = String(req.body?.notes || "").trim();

    let estimatedTotal = 0;
    const items = [];

    if (products.length === 0) {
      items.push({
        name: "Sin productos con stock bajo",
        qty: "0",
        price: "0.00",
        total: "0.00",
      });
    } else {
      products.forEach((item) => {
        const stock = Number(item.stock || 0);
        const reorder = Number(item.ReorderLevel || 10);
        const suggestedQty = Math.max(reorder - stock, 10 - stock, 1);
        const lineTotal = suggestedQty * Number(item.UnitPrice || 0);
        estimatedTotal += lineTotal;

        items.push({
          name: `${item.ProductName} (stock ${stock})`,
          qty: String(suggestedQty),
          price: toMoney(item.UnitPrice),
          total: toMoney(lineTotal),
        });
      });
    }

    const footer = [];
    if (notes) {
      footer.push(`Notas: ${notes}`);
    }
    footer.push("Favor de confirmar fecha de entrega.");

    const pdfBuffer = createTicketPdf({
      title: "SOLICITUD DE COMPRA",
      subtitle: "Northwind - Abastecimiento",
      meta: [
        { label: "Proveedor", value: supplier.CompanyName },
        { label: "Contacto", value: supplier.ContactName || "N/A" },
        { label: "Solicita", value: requesterName },
        { label: "Area", value: requesterArea },
        { label: "Fecha solicitud", value: new Date().toISOString() },
        { label: "Fecha requerida", value: neededDate },
      ],
      items,
      totals: [
        { label: "Monto estimado", value: toMoney(estimatedTotal), bold: true },
      ],
      footer,
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
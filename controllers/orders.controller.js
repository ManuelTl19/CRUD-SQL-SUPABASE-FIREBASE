const db = require("../config/db");
const ordersModel = require("../modelos/orders.model");
const { sendDbError } = require("./_dbErrors");
const { createTicketPdf } = require("./_pdfBuilder");

function toMoney(value) {
  const amount = Number(value || 0);
  return Number.isFinite(amount) ? amount.toFixed(2) : "0.00";
}

async function confirmSaleInTransaction(connection, orderId) {
  const [orderRows] = await connection.query(
    "SELECT OrderID, status FROM orders WHERE OrderID = ?",
    [orderId]
  );

  if (orderRows.length === 0) {
    return { notFound: true };
  }

  const currentStatus = String(orderRows[0].status || "pendiente").toLowerCase();
  if (currentStatus === "vendido") {
    return { alreadySold: true };
  }

  const [detailRows] = await connection.query(
    `SELECT od.ProductID, od.Quantity, p.ProductName, COALESCE(p.stock, p.UnitsInStock, 0) AS StockActual,
            COALESCE(p.UnitsInStock, 0) AS UnitsInStock
     FROM order_details od
     INNER JOIN products p ON p.ProductID = od.ProductID
     WHERE od.OrderID = ?`,
    [orderId]
  );

  if (detailRows.length === 0) {
    return { noDetails: true };
  }

  const shortages = detailRows
    .filter((item) => Number(item.StockActual || 0) < Number(item.Quantity || 0))
    .map((item) => ({
      ProductID: item.ProductID,
      ProductName: item.ProductName,
      stock: Number(item.StockActual || 0),
      required: Number(item.Quantity || 0),
    }));

  if (shortages.length > 0) {
    return { shortages };
  }

  for (const item of detailRows) {
    const quantity = Number(item.Quantity || 0);
    const nextStock = Number(item.StockActual || 0) - quantity;
    const nextUnitsInStock = Number(item.UnitsInStock || 0) - quantity;
    const safeUnitsInStock = nextUnitsInStock < 0 ? 0 : nextUnitsInStock;

    await connection.query(
      `UPDATE products
       SET stock = ?,
           UnitsInStock = ?,
           isLowStock = ?
       WHERE ProductID = ?`,
      [nextStock, safeUnitsInStock, nextStock < 10 ? 1 : 0, item.ProductID]
    );
  }

  await connection.query(
    "UPDATE orders SET status = 'vendido', ShippedDate = COALESCE(ShippedDate, NOW()) WHERE OrderID = ?",
    [orderId]
  );

  return {
    orderId,
    items: detailRows.map((item) => ({
      ProductID: item.ProductID,
      ProductName: item.ProductName,
      quantity: Number(item.Quantity || 0),
    })),
  };
}

// GET ALL
exports.getAllOrders = async (req, res) => {
  try {
    const [rows] = await db.query("SELECT * FROM orders");
    res.json(rows);
  } catch (error) {
    sendDbError(res, error);
  }
};

// GET BY ID
exports.getOrderById = async (req, res) => {
  try {
    const [rows] = await db.query(
      "SELECT * FROM orders WHERE OrderID = ?",
      [req.params.id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ message: "Orden no encontrada" });
    }

    res.json(rows[0]);
  } catch (error) {
    sendDbError(res, error);
  }
};

// CREATE
exports.createOrder = async (req, res) => {
  try {
    const payload = ordersModel.createData(req.body);

    const [result] = await db.query(
      "INSERT INTO orders SET ?",
      payload
    );

    res.status(201).json(result);
  } catch (error) {
    sendDbError(res, error, {
      onReferenced: "No se puede eliminar la orden porque tiene detalles asociados",
    });
  }
};

// UPDATE
exports.updateOrder = async (req, res) => {
  const connection = await db.getConnection();

  try {
    const payload = ordersModel.updateData(req.body);
    const requestedStatus = payload.status ? String(payload.status).toLowerCase() : null;

    if (requestedStatus === "vendido") {
      delete payload.status;
    }

    await connection.beginTransaction();

    let result = { affectedRows: 1 };
    if (Object.keys(payload).length > 0) {
      const [updateResult] = await connection.query(
        "UPDATE orders SET ? WHERE OrderID = ?",
        [payload, req.params.id]
      );
      result = updateResult;
    } else {
      const [existing] = await connection.query(
        "SELECT OrderID FROM orders WHERE OrderID = ?",
        [req.params.id]
      );
      if (existing.length === 0) {
        result = { affectedRows: 0 };
      }
    }

    if (result.affectedRows === 0) {
      await connection.rollback();
      return res.status(404).json({ message: "Orden no encontrada" });
    }

    if (requestedStatus === "vendido") {
      const saleResult = await confirmSaleInTransaction(connection, req.params.id);

      if (saleResult.notFound) {
        await connection.rollback();
        return res.status(404).json({ message: "Orden no encontrada" });
      }

      if (saleResult.noDetails) {
        await connection.rollback();
        return res.status(400).json({ message: "La orden no tiene detalles" });
      }

      if (saleResult.shortages) {
        await connection.rollback();
        return res.status(409).json({
          message: "No hay stock suficiente para confirmar venta",
          shortages: saleResult.shortages,
        });
      }
    }

    await connection.commit();
    return res.json({ message: "Orden actualizada" });
  } catch (error) {
    await connection.rollback();
    return sendDbError(res, error);
  } finally {
    connection.release();
  }
};

// DELETE
exports.deleteOrder = async (req, res) => {
  try {
    const [result] = await db.query(
      "DELETE FROM orders WHERE OrderID = ?",
      [req.params.id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Orden no encontrada" });
    }

    res.json(result);
  } catch (error) {
    sendDbError(res, error);
  }
};

// POST /orders/:id/confirm-sale
exports.confirmSale = async (req, res) => {
  const orderId = Number(req.params.id);

  if (!Number.isInteger(orderId) || orderId <= 0) {
    return res.status(400).json({ message: "ID de pedido invalido" });
  }

  const connection = await db.getConnection();

  try {
    await connection.beginTransaction();
    const saleResult = await confirmSaleInTransaction(connection, orderId);

    if (saleResult.notFound) {
      await connection.rollback();
      return res.status(404).json({ message: "Orden no encontrada" });
    }

    if (saleResult.alreadySold) {
      await connection.rollback();
      return res.json({ message: "La orden ya estaba vendida" });
    }

    if (saleResult.noDetails) {
      await connection.rollback();
      return res.status(400).json({ message: "La orden no tiene detalles" });
    }

    if (saleResult.shortages) {
      await connection.rollback();
      return res.status(409).json({
        message: "No hay stock suficiente para confirmar venta",
        shortages: saleResult.shortages,
      });
    }

    await connection.commit();

    return res.json({
      message: "Venta confirmada y stock actualizado",
      orderId,
      items: saleResult.items,
    });
  } catch (error) {
    await connection.rollback();
    return sendDbError(res, error);
  } finally {
    connection.release();
  }
};

// GET /orders/:id/sale-note-pdf
exports.getSaleNotePdf = async (req, res) => {
  const orderId = Number(req.params.id);

  if (!Number.isInteger(orderId) || orderId <= 0) {
    return res.status(400).json({ message: "ID de pedido invalido" });
  }

  try {
    const [orderRows] = await db.query(
      `SELECT o.OrderID, o.OrderDate, o.status,
              c.CompanyName AS CustomerName
       FROM orders o
       LEFT JOIN customers c ON c.CustomerID = o.CustomerID
       WHERE o.OrderID = ?`,
      [orderId]
    );

    if (orderRows.length === 0) {
      return res.status(404).json({ message: "Orden no encontrada" });
    }

    const [detailRows] = await db.query(
      `SELECT od.ProductID, p.ProductName, od.Quantity, od.UnitPrice, od.Discount
       FROM order_details od
       LEFT JOIN products p ON p.ProductID = od.ProductID
       WHERE od.OrderID = ?`,
      [orderId]
    );

    const order = orderRows[0];
    let total = 0;
    const items = [];
    if (detailRows.length === 0) {
      items.push({
        name: "Sin productos",
        qty: "0",
        price: "0.00",
        total: "0.00",
      });
    } else {
      detailRows.forEach((item) => {
        const quantity = Number(item.Quantity || 0);
        const unitPrice = Number(item.UnitPrice || 0);
        const discount = Number(item.Discount || 0);
        const lineTotal = quantity * unitPrice * (1 - discount);
        total += lineTotal;

        items.push({
          name: item.ProductName || `Producto ${item.ProductID}`,
          qty: String(quantity),
          price: toMoney(unitPrice),
          total: toMoney(lineTotal),
        });
      });
    }

    const pdfBuffer = createTicketPdf({
      title: "NOTA DE VENTA",
      subtitle: "Northwind - Punto de Venta",
      meta: [
        { label: "Pedido", value: order.OrderID },
        { label: "Cliente", value: order.CustomerName || "N/A" },
        { label: "Fecha", value: order.OrderDate || new Date().toISOString() },
        { label: "Estado", value: order.status || "pendiente" },
      ],
      items,
      totals: [
        { label: "TOTAL", value: toMoney(total), bold: true },
      ],
      footer: [
        "Gracias por su compra",
        "Documento generado automaticamente",
      ],
    });

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename=nota-venta-${orderId}.pdf`);
    return res.send(pdfBuffer);
  } catch (error) {
    return sendDbError(res, error);
  }
};
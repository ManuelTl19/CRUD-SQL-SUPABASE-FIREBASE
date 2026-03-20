// Modelo de payload: centraliza campos permitidos para operaciones create/update.
const { buildPayload } = require("./_base.model");

const CREATE_FIELDS = ["OrderID", "ProductID", "UnitPrice", "Quantity", "Discount"];
const UPDATE_FIELDS = ["UnitPrice", "Quantity", "Discount"];

module.exports = {
  table: "order_details",
  idFields: ["OrderID", "ProductID"],
  createFields: CREATE_FIELDS,
  updateFields: UPDATE_FIELDS,
  createData: (data) => buildPayload(data, CREATE_FIELDS),
  updateData: (data) => buildPayload(data, UPDATE_FIELDS),
};

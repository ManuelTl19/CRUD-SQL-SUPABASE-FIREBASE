const { buildPayload } = require("./_base.model");

const CREATE_FIELDS = [
  "ProductID",
  "ProductName",
  "SupplierID",
  "CategoryID",
  "QuantityPerUnit",
  "UnitPrice",
  "UnitsInStock",
  "UnitsOnOrder",
  "ReorderLevel",
  "Discontinued",
];
const UPDATE_FIELDS = CREATE_FIELDS.filter((field) => field !== "ProductID");

module.exports = {
  table: "products",
  idFields: ["ProductID"],
  createFields: CREATE_FIELDS,
  updateFields: UPDATE_FIELDS,
  createData: (data) => buildPayload(data, CREATE_FIELDS),
  updateData: (data) => buildPayload(data, UPDATE_FIELDS),
};

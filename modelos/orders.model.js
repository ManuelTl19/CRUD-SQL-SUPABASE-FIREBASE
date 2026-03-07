const { buildPayload } = require("./_base.model");

const CREATE_FIELDS = [
  "OrderID",
  "CustomerID",
  "EmployeeID",
  "OrderDate",
  "RequiredDate",
  "ShippedDate",
  "ShipVia",
  "Freight",
  "ShipName",
  "ShipAddress",
  "ShipCity",
  "ShipRegion",
  "ShipPostalCode",
  "ShipCountry",
  "status",
];
const UPDATE_FIELDS = CREATE_FIELDS.filter((field) => field !== "OrderID");

module.exports = {
  table: "orders",
  idFields: ["OrderID"],
  createFields: CREATE_FIELDS,
  updateFields: UPDATE_FIELDS,
  createData: (data) => buildPayload(data, CREATE_FIELDS),
  updateData: (data) => buildPayload(data, UPDATE_FIELDS),
};

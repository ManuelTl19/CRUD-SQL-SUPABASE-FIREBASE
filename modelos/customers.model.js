const { buildPayload } = require("./_base.model");

const CREATE_FIELDS = [
  "CustomerID",
  "CompanyName",
  "ContactName",
  "ContactTitle",
  "Address",
  "City",
  "Region",
  "PostalCode",
  "Country",
  "Phone",
  "Fax",
];
const UPDATE_FIELDS = CREATE_FIELDS.filter((field) => field !== "CustomerID");

module.exports = {
  table: "customers",
  idFields: ["CustomerID"],
  createFields: CREATE_FIELDS,
  updateFields: UPDATE_FIELDS,
  createData: (data) => buildPayload(data, CREATE_FIELDS),
  updateData: (data) => buildPayload(data, UPDATE_FIELDS),
};

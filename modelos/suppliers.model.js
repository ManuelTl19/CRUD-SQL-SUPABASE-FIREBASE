// Modelo de payload: centraliza campos permitidos para operaciones create/update.
const { buildPayload } = require("./_base.model");

const CREATE_FIELDS = [
  "SupplierID",
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
  "HomePage",
];
const UPDATE_FIELDS = CREATE_FIELDS.filter((field) => field !== "SupplierID");

module.exports = {
  table: "suppliers",
  idFields: ["SupplierID"],
  createFields: CREATE_FIELDS,
  updateFields: UPDATE_FIELDS,
  createData: (data) => buildPayload(data, CREATE_FIELDS),
  updateData: (data) => buildPayload(data, UPDATE_FIELDS),
};

// Modelo de payload: centraliza campos permitidos para operaciones create/update.
const { buildPayload } = require("./_base.model");

const CREATE_FIELDS = [
  "EmployeeID",
  "LastName",
  "FirstName",
  "Title",
  "TitleOfCourtesy",
  "BirthDate",
  "HireDate",
  "Address",
  "City",
  "Region",
  "PostalCode",
  "Country",
  "HomePhone",
  "Extension",
  "Photo",
  "Notes",
  "ReportsTo",
  "PhotoPath",
];
const UPDATE_FIELDS = CREATE_FIELDS.filter((field) => field !== "EmployeeID");

module.exports = {
  table: "employees",
  idFields: ["EmployeeID"],
  createFields: CREATE_FIELDS,
  updateFields: UPDATE_FIELDS,
  createData: (data) => buildPayload(data, CREATE_FIELDS),
  updateData: (data) => buildPayload(data, UPDATE_FIELDS),
};

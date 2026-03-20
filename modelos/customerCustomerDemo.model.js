// Modelo de payload: centraliza campos permitidos para operaciones create/update.
const { buildPayload } = require("./_base.model");

const CREATE_FIELDS = ["CustomerID", "CustomerTypeID"];

module.exports = {
  table: "customercustomerdemo",
  idFields: ["CustomerID", "CustomerTypeID"],
  createFields: CREATE_FIELDS,
  updateFields: [],
  createData: (data) => buildPayload(data, CREATE_FIELDS),
  updateData: () => ({}),
};

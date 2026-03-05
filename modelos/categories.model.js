const { buildPayload } = require("./_base.model");

const CREATE_FIELDS = ["CategoryID", "CategoryName", "Description", "Picture"];
const UPDATE_FIELDS = ["CategoryName", "Description", "Picture"];

module.exports = {
  table: "categories",
  idFields: ["CategoryID"],
  createFields: CREATE_FIELDS,
  updateFields: UPDATE_FIELDS,
  createData: (data) => buildPayload(data, CREATE_FIELDS),
  updateData: (data) => buildPayload(data, UPDATE_FIELDS),
};

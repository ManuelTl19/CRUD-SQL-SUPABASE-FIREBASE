const { buildPayload } = require("./_base.model");

const CREATE_FIELDS = ["ShipperID", "CompanyName", "Phone"];
const UPDATE_FIELDS = ["CompanyName", "Phone"];

module.exports = {
  table: "shippers",
  idFields: ["ShipperID"],
  createFields: CREATE_FIELDS,
  updateFields: UPDATE_FIELDS,
  createData: (data) => buildPayload(data, CREATE_FIELDS),
  updateData: (data) => buildPayload(data, UPDATE_FIELDS),
};

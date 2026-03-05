const { buildPayload } = require("./_base.model");

const CREATE_FIELDS = ["CustomerTypeID", "CustomerDesc"];
const UPDATE_FIELDS = ["CustomerDesc"];

module.exports = {
  table: "customerdemographics",
  idFields: ["CustomerTypeID"],
  createFields: CREATE_FIELDS,
  updateFields: UPDATE_FIELDS,
  createData: (data) => buildPayload(data, CREATE_FIELDS),
  updateData: (data) => buildPayload(data, UPDATE_FIELDS),
};

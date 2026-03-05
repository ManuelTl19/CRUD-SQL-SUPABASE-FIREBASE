const { buildPayload } = require("./_base.model");

const CREATE_FIELDS = ["RegionID", "RegionDescription"];
const UPDATE_FIELDS = ["RegionDescription"];

module.exports = {
  table: "region",
  idFields: ["RegionID"],
  createFields: CREATE_FIELDS,
  updateFields: UPDATE_FIELDS,
  createData: (data) => buildPayload(data, CREATE_FIELDS),
  updateData: (data) => buildPayload(data, UPDATE_FIELDS),
};

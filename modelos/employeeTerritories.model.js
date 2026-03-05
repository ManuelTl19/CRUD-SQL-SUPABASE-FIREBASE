const { buildPayload } = require("./_base.model");

const CREATE_FIELDS = ["EmployeeID", "TerritoryID"];

module.exports = {
  table: "employeeterritories",
  idFields: ["EmployeeID", "TerritoryID"],
  createFields: CREATE_FIELDS,
  updateFields: [],
  createData: (data) => buildPayload(data, CREATE_FIELDS),
  updateData: () => ({}),
};

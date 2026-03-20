// Configuracion de infraestructura para la API (DB, OpenAPI, registro y bootstrap).
const categoriesModel = require("../modelos/categories.model");
const suppliersModel = require("../modelos/suppliers.model");
const shippersModel = require("../modelos/shippers.model");
const regionModel = require("../modelos/region.model");
const customerDemographicsModel = require("../modelos/customerdemographics.model");
const productsModel = require("../modelos/products.model");
const territoriesModel = require("../modelos/territories.model");
const customersModel = require("../modelos/customers.model");
const employeesModel = require("../modelos/employees.model");
const ordersModel = require("../modelos/orders.model");
const orderDetailsModel = require("../modelos/order_details.model");
const customerCustomerDemoModel = require("../modelos/customerCustomerDemo.model");
const employeeTerritoriesModel = require("../modelos/employeeTerritories.model");

const registry = {
  categories: categoriesModel,
  suppliers: suppliersModel,
  shippers: shippersModel,
  region: regionModel,
  customerdemographics: customerDemographicsModel,
  products: productsModel,
  territories: territoriesModel,
  customers: customersModel,
  employees: employeesModel,
  orders: ordersModel,
  "order-details": orderDetailsModel,
  "customer-customer-demo": customerCustomerDemoModel,
  "employee-territories": employeeTerritoriesModel,
};

module.exports = { registry };

// Rutas API: define endpoints del recurso y delega en su controlador.
const express = require("express");
const { registry } = require("../config/resourceRegistry");
const { createCrudController, toParamName } = require("../controllers/firebaseCrud.controller");

const router = express.Router();

Object.entries(registry).forEach(([resourceKey, model]) => {
  const controller = createCrudController(resourceKey);
  const idParams = model.idFields.map((idField) => `:${toParamName(idField)}`).join("/");
  const withIdsPath = `/api-firebase/${resourceKey}/${idParams}`;

  router.get(`/api-firebase/${resourceKey}`, controller.list);
  router.get(withIdsPath, controller.getById);
  router.post(`/api-firebase/${resourceKey}`, controller.create);
  router.put(withIdsPath, controller.update);
  router.delete(withIdsPath, controller.remove);
});

module.exports = router;

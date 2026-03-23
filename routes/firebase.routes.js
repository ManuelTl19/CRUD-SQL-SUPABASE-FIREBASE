// Rutas API: define endpoints del recurso y delega en su controlador.
const express = require("express");
const { registry } = require("../config/resourceRegistry");
const { createCrudController, toParamName } = require("../controllers/firebaseCrud.controller");

const router = express.Router();

const providerPrefixes = ["/api-firebase", "/api-supabase"];

Object.entries(registry).forEach(([resourceKey, model]) => {
  const controller = createCrudController(resourceKey);
  const idParams = model.idFields.map((idField) => `:${toParamName(idField)}`).join("/");

  providerPrefixes.forEach((prefix) => {
    const withIdsPath = `${prefix}/${resourceKey}/${idParams}`;

    router.get(`${prefix}/${resourceKey}`, controller.list);
    router.get(withIdsPath, controller.getById);
    router.post(`${prefix}/${resourceKey}`, controller.create);
    router.put(withIdsPath, controller.update);
    router.delete(withIdsPath, controller.remove);
  });
});

module.exports = router;

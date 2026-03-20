// Controlador: coordina la logica del recurso, acceso a datos y respuestas HTTP.
const { registry } = require("../config/resourceRegistry");
const firebaseGateway = require("../services/firebaseGateway");

function toParamName(idField) {
  const cleaned = String(idField || "id").replace(/_/g, "");
  const withoutSuffix = cleaned.replace(/ID$/i, "");
  const base = withoutSuffix || cleaned;
  return `${base.charAt(0).toLowerCase()}${base.slice(1)}Id`;
}

function collectIdValues(model, req) {
  return model.idFields.map((idField) => {
    const paramName = toParamName(idField);
    const value = req.params[paramName];
    return value;
  });
}

function validateIdValues(idValues) {
  return idValues.every((value) => value !== undefined && value !== null && String(value).trim() !== "");
}

function getModelOr404(resourceKey, res) {
  const model = registry[resourceKey];
  if (!model) {
    res.status(404).json({ message: "Recurso no soportado en firebase" });
    return null;
  }
  return model;
}

function createCrudController(resourceKey) {
  return {
    list: async (req, res) => {
      const model = getModelOr404(resourceKey, res);
      if (!model) return;

      try {
        const rows = await firebaseGateway.list(resourceKey);
        res.json(rows);
      } catch (error) {
        res.status(500).json({ message: error.message || "Error firebase" });
      }
    },

    getById: async (req, res) => {
      const model = getModelOr404(resourceKey, res);
      if (!model) return;

      const idValues = collectIdValues(model, req);
      if (!validateIdValues(idValues)) {
        return res.status(400).json({ message: "IDs invalidos" });
      }

      try {
        const row = await firebaseGateway.getById(resourceKey, model, idValues);
        if (!row) {
          return res.status(404).json({ message: "Registro no encontrado" });
        }
        return res.json(row);
      } catch (error) {
        return res.status(500).json({ message: error.message || "Error firebase" });
      }
    },

    create: async (req, res) => {
      const model = getModelOr404(resourceKey, res);
      if (!model) return;

      const payload = typeof model.createData === "function" ? model.createData(req.body || {}) : { ...(req.body || {}) };

      try {
        const result = await firebaseGateway.create(resourceKey, model, payload);
        if (result.duplicated) {
          return res.status(409).json({ message: "Registro ya existe" });
        }
        return res.status(201).json(result.doc);
      } catch (error) {
        return res.status(400).json({ message: error.message || "No se pudo crear" });
      }
    },

    update: async (req, res) => {
      const model = getModelOr404(resourceKey, res);
      if (!model) return;

      const idValues = collectIdValues(model, req);
      if (!validateIdValues(idValues)) {
        return res.status(400).json({ message: "IDs invalidos" });
      }

      const payload = typeof model.updateData === "function" ? model.updateData(req.body || {}) : { ...(req.body || {}) };

      try {
        const result = await firebaseGateway.update(resourceKey, model, idValues, payload);
        if (!result.found) {
          return res.status(404).json({ message: "Registro no encontrado" });
        }
        return res.json({ message: "Registro actualizado", row: result.doc });
      } catch (error) {
        return res.status(400).json({ message: error.message || "No se pudo actualizar" });
      }
    },

    remove: async (req, res) => {
      const model = getModelOr404(resourceKey, res);
      if (!model) return;

      const idValues = collectIdValues(model, req);
      if (!validateIdValues(idValues)) {
        return res.status(400).json({ message: "IDs invalidos" });
      }

      try {
        const result = await firebaseGateway.remove(resourceKey, model, idValues);
        if (!result.found) {
          return res.status(404).json({ message: "Registro no encontrado" });
        }
        return res.json({ message: "Registro eliminado" });
      } catch (error) {
        return res.status(500).json({ message: error.message || "No se pudo eliminar" });
      }
    },
  };
}

module.exports = {
  createCrudController,
  toParamName,
};

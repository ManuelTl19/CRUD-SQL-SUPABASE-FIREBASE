const sendDbError = (res, error, options = {}) => {
  if (error?.code === "ER_ROW_IS_REFERENCED_2") {
    return res.status(409).json({
      message:
        options.onReferenced ||
        "No se puede eliminar o actualizar porque el registro esta relacionado con otros datos",
    });
  }

  if (error?.code === "ER_NO_REFERENCED_ROW_2") {
    return res.status(409).json({
      message:
        options.onMissingReference ||
        "El registro relacionado no existe o no cumple la integridad referencial",
    });
  }

  if (error?.code === "ER_DUP_ENTRY") {
    return res.status(409).json({
      message: options.onDuplicate || "Ya existe un registro con esos datos",
    });
  }

  return res.status(500).json({ error: error.message });
};

module.exports = {
  sendDbError,
};

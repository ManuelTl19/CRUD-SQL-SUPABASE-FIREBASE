const hasValue = (value) => {
  if (value === undefined || value === null) {
    return false;
  }
  if (typeof value === "string") {
    return value.trim() !== "";
  }
  return true;
};

const buildPayload = (input, allowedFields) => {
  const payload = {};

  for (const field of allowedFields) {
    if (hasValue(input?.[field])) {
      payload[field] = input[field];
    }
  }

  return payload;
};

module.exports = {
  buildPayload,
};

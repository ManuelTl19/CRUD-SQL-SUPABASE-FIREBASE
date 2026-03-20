// Servicio de integracion: encapsula acceso a servicios externos.
const path = require("path");
const fs = require("fs/promises");

const DATA_FILE = path.join(__dirname, "..", "data", "business", "firebase.json");

const writeQueue = [];
let writing = false;

async function runWriteQueue() {
  if (writing) return;
  writing = true;

  while (writeQueue.length > 0) {
    const task = writeQueue.shift();
    try {
      await task();
    } catch (error) {
      // Swallow to keep queue processing; caller already receives failure.
    }
  }

  writing = false;
}

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function normalizeStore(raw) {
  const safe = raw && typeof raw === "object" ? raw : {};
  const resources = safe.resources && typeof safe.resources === "object" ? safe.resources : {};
  const counters = safe.counters && typeof safe.counters === "object" ? safe.counters : {};

  return {
    provider: "firebase",
    counters,
    resources,
  };
}

async function readStore() {
  try {
    const content = await fs.readFile(DATA_FILE, "utf8");
    return normalizeStore(JSON.parse(content));
  } catch (error) {
    if (error && error.code === "ENOENT") {
      return normalizeStore(null);
    }
    throw error;
  }
}

async function writeStore(nextStore) {
  const serialized = JSON.stringify(nextStore, null, 2);

  await new Promise((resolve, reject) => {
    writeQueue.push(async () => {
      try {
        await fs.writeFile(DATA_FILE, serialized, "utf8");
        resolve();
      } catch (error) {
        reject(error);
      }
    });

    runWriteQueue().catch(reject);
  });
}

function buildDocId(model, payload) {
  return model.idFields.map((field) => String(payload[field]).trim()).join("__");
}

function matchesId(model, doc, idValues) {
  return model.idFields.every((field, index) => String(doc[field]) === String(idValues[index]));
}

function ensureResourceContainer(store, resourceKey) {
  if (!Array.isArray(store.resources[resourceKey])) {
    store.resources[resourceKey] = [];
  }
  return store.resources[resourceKey];
}

function ensureCounter(store, resourceKey) {
  if (!Number.isInteger(store.counters[resourceKey]) || store.counters[resourceKey] < 1) {
    store.counters[resourceKey] = 1;
  }
}

async function list(resourceKey) {
  const store = await readStore();
  return clone(store.resources[resourceKey] || []);
}

async function getById(resourceKey, model, idValues) {
  const items = await list(resourceKey);
  return items.find((item) => matchesId(model, item, idValues)) || null;
}

async function create(resourceKey, model, payload) {
  const store = await readStore();
  const bucket = ensureResourceContainer(store, resourceKey);

  const missingIdField = model.idFields.find((field) => {
    const value = payload[field];
    return value === undefined || value === null || String(value).trim() === "";
  });

  if (missingIdField) {
    ensureCounter(store, resourceKey);
    if (model.idFields.length === 1) {
      payload[missingIdField] = store.counters[resourceKey];
      store.counters[resourceKey] += 1;
    } else {
      throw new Error(`Falta campo ID obligatorio: ${missingIdField}`);
    }
  }

  const existing = bucket.find((item) => matchesId(model, item, model.idFields.map((field) => payload[field])));
  if (existing) {
    return { duplicated: true };
  }

  const doc = {
    ...payload,
    id: buildDocId(model, payload),
    sourceDb: "firebase",
    updatedAt: new Date().toISOString(),
  };

  bucket.push(doc);
  await writeStore(store);

  return { duplicated: false, doc: clone(doc) };
}

async function update(resourceKey, model, idValues, payload) {
  const store = await readStore();
  const bucket = ensureResourceContainer(store, resourceKey);

  const index = bucket.findIndex((item) => matchesId(model, item, idValues));
  if (index < 0) {
    return { found: false };
  }

  const current = bucket[index];
  const next = {
    ...current,
    ...payload,
    updatedAt: new Date().toISOString(),
    sourceDb: "firebase",
  };

  bucket[index] = next;
  await writeStore(store);

  return { found: true, doc: clone(next) };
}

async function remove(resourceKey, model, idValues) {
  const store = await readStore();
  const bucket = ensureResourceContainer(store, resourceKey);

  const index = bucket.findIndex((item) => matchesId(model, item, idValues));
  if (index < 0) {
    return { found: false };
  }

  const [deleted] = bucket.splice(index, 1);
  await writeStore(store);

  return { found: true, deleted: clone(deleted) };
}

module.exports = {
  list,
  getById,
  create,
  update,
  remove,
};

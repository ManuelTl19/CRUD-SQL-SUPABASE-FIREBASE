// Servicio frontend: centraliza comunicacion HTTP y acceso a fuentes de datos.
const STORAGE_KEY = "active-data-source";
const DEFAULT_SOURCE = "mysql";

function sanitize(value) {
  return value === "supabase" ? "supabase" : "mysql";
}

export function getDataSource() {
  const raw = localStorage.getItem(STORAGE_KEY);
  return sanitize(raw || DEFAULT_SOURCE);
}

export function setDataSource(source) {
  const next = sanitize(source);
  localStorage.setItem(STORAGE_KEY, next);
  return next;
}

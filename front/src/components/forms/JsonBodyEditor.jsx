// Componente UI: bloque reutilizable de presentacion para la interfaz React.
export function JsonBodyEditor({ value, onChange }) {
  return (
    <label className="body-label">
      Body JSON
      <textarea value={value} onChange={(event) => onChange(event.target.value)} rows={14} />
    </label>
  )
}

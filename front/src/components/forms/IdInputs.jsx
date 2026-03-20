// Componente UI: bloque reutilizable de presentacion para la interfaz React.
export function IdInputs({ idKeys, idValues, onChange }) {
  return (
    <div className="id-grid">
      {idKeys.map((idKey) => (
        <label key={idKey}>
          {idKey}
          <input
            type="text"
            value={idValues[idKey] || ''}
            onChange={(event) => onChange(idKey, event.target.value)}
            placeholder={`Valor para ${idKey}`}
          />
        </label>
      ))}
    </div>
  )
}

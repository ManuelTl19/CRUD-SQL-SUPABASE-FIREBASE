// Componente UI: bloque reutilizable de presentacion para la interfaz React.
import { Panel } from '../common/Panel'
import { TableProperties } from 'lucide-react'

export function DataTablePanel({ rows, columns, onRowClick }) {
  return (
    <Panel title={`Datos Operativos (${rows.length})`} icon={TableProperties}>
      {rows.length === 0 ? (
        <p className="hint">Sin registros cargados. Presiona “Sincronizar Lista” para consultar la API.</p>
      ) : (
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                {columns.map((col) => (
                  <th key={col}>{col}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row, index) => (
                <tr key={index} onClick={() => onRowClick(row)}>
                  {columns.map((col) => (
                    <td key={col}>{String(row?.[col] ?? '')}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Panel>
  )
}

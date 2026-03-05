import { prettifyJson } from '../../utils/format'
import { Panel } from '../common/Panel'
import { TerminalSquare } from 'lucide-react'

export function ResultPanel({ result, error }) {
  return (
    <Panel title="Respuesta del Servidor" icon={TerminalSquare}>
      {error ? <pre className="error-box">{error}</pre> : null}
      {result ? <pre>{prettifyJson(result)}</pre> : <p className="hint">Sin resultado todavía.</p>}
    </Panel>
  )
}

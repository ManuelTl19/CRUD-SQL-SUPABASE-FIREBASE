// Componente UI: bloque reutilizable de presentacion para la interfaz React.
import { Panel } from '../common/Panel'
import { CrudActions } from '../forms/CrudActions'
import { IdInputs } from '../forms/IdInputs'
import { JsonBodyEditor } from '../forms/JsonBodyEditor'
import { SlidersHorizontal } from 'lucide-react'

export function ActionsPanel({
  resource,
  idValues,
  onIdChange,
  bodyText,
  onBodyChange,
  loading,
  onGetById,
  onCreate,
  onUpdate,
  onDelete,
}) {
  return (
    <Panel title="Centro de Operaciones" icon={SlidersHorizontal} className="controls">
      <IdInputs idKeys={resource.idKeys} idValues={idValues} onChange={onIdChange} />
      <JsonBodyEditor value={bodyText} onChange={onBodyChange} />
      <CrudActions
        loading={loading}
        canUpdate={resource.canUpdate}
        onGetById={onGetById}
        onCreate={onCreate}
        onUpdate={onUpdate}
        onDelete={onDelete}
      />
    </Panel>
  )
}

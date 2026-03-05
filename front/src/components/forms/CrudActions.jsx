import { Eye, Plus, Save, Trash2 } from 'lucide-react'

export function CrudActions({
  loading,
  canUpdate,
  onGetById,
  onCreate,
  onUpdate,
  onDelete,
}) {
  return (
    <div className="actions">
      <button className="btn btn-secondary" onClick={onGetById} disabled={loading}>
        <Eye size={16} />
        Get By ID
      </button>
      <button className="btn btn-success" onClick={onCreate} disabled={loading}>
        <Plus size={16} />
        Crear
      </button>
      <button className="btn btn-primary" onClick={onUpdate} disabled={loading || !canUpdate}>
        <Save size={16} />
        Actualizar
      </button>
      <button className="btn btn-danger" onClick={onDelete} disabled={loading}>
        <Trash2 size={16} />
        Eliminar
      </button>
    </div>
  )
}

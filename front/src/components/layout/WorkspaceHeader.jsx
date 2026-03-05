import { RefreshCw, Sparkles } from 'lucide-react'

export function WorkspaceHeader({ currentResourceLabel, onRefresh, loading }) {
  return (
    <header className="header card">
      <div className="header-title-wrap">
        <div className="header-badge">
          <Sparkles size={16} />
          <span>Dashboard Empresarial</span>
        </div>
        <h1>Sistema CRUD Profesional</h1>
        <p className="header-subtitle">
          Módulo activo: <strong>{currentResourceLabel}</strong>
        </p>
      </div>
      <button className="btn btn-primary" onClick={onRefresh} disabled={loading}>
        <RefreshCw size={16} />
        {loading ? 'Cargando...' : 'Sincronizar Lista'}
      </button>
    </header>
  )
}

// Componente UI: bloque reutilizable de presentacion para la interfaz React.
import { Boxes, ChevronRight, ServerCog } from 'lucide-react'
import { NavLink } from 'react-router-dom'

export function ResourceSidebar({ resources, apiBaseUrl }) {
  return (
    <aside className="sidebar">
      <div className="brand-card">
        <div className="brand-icon">
          <ServerCog size={20} />
        </div>
        <div>
          <h2>Northwind Dual Console</h2>
          <p>{apiBaseUrl} | MySQL / Supabase</p>
        </div>
      </div>

      <div className="sidebar-section-title">
        <Boxes size={14} />
        <span>Recursos</span>
      </div>

      <div className="resource-list">
        {resources.map((entry) => (
          <NavLink
            key={entry.key}
            to={`/resource/${entry.key}`}
            className={({ isActive }) => (isActive ? 'resource-btn active' : 'resource-btn')}
          >
            <span>{entry.label}</span>
            <ChevronRight size={14} />
          </NavLink>
        ))}
      </div>
    </aside>
  )
}

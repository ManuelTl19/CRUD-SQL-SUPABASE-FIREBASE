// Componente UI: bloque reutilizable de presentacion para la interfaz React.
import { Database, Layers3, Rows3, ShieldCheck } from 'lucide-react'

export function StatsCards({ resourcesCount, rowsCount, currentResource, canUpdate }) {
  const cards = [
    {
      key: 'resources',
      label: 'Recursos disponibles',
      value: resourcesCount,
      icon: Layers3,
      tone: 'blue',
    },
    {
      key: 'rows',
      label: 'Registros cargados',
      value: rowsCount,
      icon: Rows3,
      tone: 'violet',
    },
    {
      key: 'resource',
      label: 'Módulo activo',
      value: currentResource,
      icon: Database,
      tone: 'emerald',
    },
    {
      key: 'ops',
      label: 'Operación UPDATE',
      value: canUpdate ? 'Habilitada' : 'No disponible',
      icon: ShieldCheck,
      tone: canUpdate ? 'emerald' : 'amber',
    },
  ]

  return (
    <section className="stats-grid">
      {cards.map((card) => {
        const Icon = card.icon
        return (
          <article key={card.key} className={`stat-card tone-${card.tone}`}>
            <div>
              <p className="stat-label">{card.label}</p>
              <h4 className="stat-value">{card.value}</h4>
            </div>
            <div className="stat-icon-wrap">
              <Icon size={18} />
            </div>
          </article>
        )
      })}
    </section>
  )
}

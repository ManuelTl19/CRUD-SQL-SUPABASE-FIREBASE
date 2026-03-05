export function Panel({ title, icon: Icon, className = '', children }) {
  return (
    <section className={`panel card ${className}`.trim()}>
      {title ? (
        <div className="panel-header">
          <div className="panel-title">
            {Icon ? (
              <span className="panel-icon">
                <Icon size={16} />
              </span>
            ) : null}
            <h3>{title}</h3>
          </div>
        </div>
      ) : null}
      {children}
    </section>
  )
}

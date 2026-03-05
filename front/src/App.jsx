import { API_BASE_URL } from './config/env'
import { Navigate, Route, Routes } from 'react-router-dom'
import { RESOURCES } from './config/resources'
import { ResourceSidebar } from './components/layout/ResourceSidebar'
import { ResourceCardsPage } from './pages/ResourceCardsPage'

function App() {
  return (
    <div className="page">
      <ResourceSidebar resources={RESOURCES} apiBaseUrl={API_BASE_URL} />

      <Routes>
        <Route path="/" element={<Navigate to={`/resource/${RESOURCES[0].key}`} replace />} />
        <Route path="/resource/:resourceKey" element={<ResourceCardsPage />} />
      </Routes>
    </div>
  )
}

export default App

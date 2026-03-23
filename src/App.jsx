import { useState } from 'react';
import './App.css'; 

import CustomersPage from "./pages/CustomersPage";
import ProductsPage from "./pages/ProductsPage";
import OrderDetailsPage from "./pages/OrderDetailsPage";
import CategoriesPage from "./pages/CategoriesPage";
import SuppliersPage from "./pages/SuppliersPage";
import ShippersPage from "./pages/ShippersPage";
import OrdersPage from "./pages/OrdersPage";
import EmployeesPage from "./pages/EmployeesPage";
import RegionsPage from "./pages/RegionPage";
import TerritoriesPage from "./pages/TerritoriesPage";
import EmpTerritoriesPage from "./pages/EmployeeTerritoriesPage";
import DemographicsPage from "./pages/CustomerDemographicsPage";
import CustomerDemoPage from "./pages/CustomerCustomerDemoPage";

function App() {
  const [activeTab, setActiveTab] = useState('home');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const menuItems = [
    { id: 'customers', name: 'Clientes'  },
    { id: 'products', name: 'Productos' },
    { id: 'details', name: 'Detalles de Órdenes'},
    { id: 'categories', name: 'Categorías' },
    { id: 'suppliers', name: 'Proveedores' },
    { id: 'shippers', name: 'Transportistas'},
    { id: 'orders', name: 'Pedidos' },
    { id: 'employees', name: 'Empleados'},
    { id: 'regions', name: 'Regiones'},
    { id: 'territories', name: 'Territorios' },
    { id: 'emp_territories', name: 'Territorios d Empleados/'},
    { id: 'demographics', name: 'Demografías' },
    { id: 'customer_demo', name: 'Clientesdemo del c' },
  ];

  const renderContent = () => {
    switch(activeTab) {
      case 'customers': return <CustomersPage />;
      case 'products': return <ProductsPage />;
      case 'details': return <OrderDetailsPage />;
      case 'categories': return <CategoriesPage />;
      case 'suppliers': return <SuppliersPage />;
      case 'shippers': return <ShippersPage />;
      case 'orders': return <OrdersPage />;
      case 'employees': return <EmployeesPage />;
      case 'regions': return <RegionsPage />;
      case 'territories': return <TerritoriesPage />;
      case 'emp_territories': return <EmpTerritoriesPage />;
      case 'demographics': return <DemographicsPage />;
      case 'customer_demo': return <CustomerDemoPage />;
      default: return (
        <div className="home-hero">
          <h1>🚀 Northwind ERP Console</h1>
          <p>Gestión completa de base de datos en Supabase con estilo moderno y oscuro</p>
          <div className="stats-grid">
            <div className="stat-card">
              <h3>Módulos Disponibles</h3>
              <div className="stat-value">{menuItems.length}</div>
            </div>
            <div className="stat-card">
              <h3>Base de Datos</h3>
              <div className="stat-value">Supabase</div>
            </div>
            <div className="stat-card">
              <h3>Versión</h3>
              <div className="stat-value">2.0</div>
            </div>
          </div>
        </div>
      );
    }
  };

  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };

  return (
    <>
      <div className="dashboard-layout">
        <aside className={`sidebar ${mobileMenuOpen ? 'open' : ''}`}>
          <div className="sidebar-header" onClick={() => setActiveTab('home')}>
            <h2>Northwind</h2>
          </div>
          <nav className="sidebar-nav">
            {menuItems.map((item) => (
              <button 
                key={item.id}
                className={`sidebar-link ${activeTab === item.id ? 'active' : ''}`}
                onClick={() => {
                  setActiveTab(item.id);
                  if (window.innerWidth <= 768) {
                    setMobileMenuOpen(false);
                  }
                }}
              >
                <span>{item.icon}</span>
                <span>{item.name}</span>
              </button>
            ))}
          </nav>
        </aside>

        <main className="main-content">
          {renderContent()}
        </main>
      </div>
      
      <button className="mobile-toggle" onClick={toggleMobileMenu}>
        ☰
      </button>
    </>
  );
}

export default App;
import { NavLink, Outlet } from 'react-router-dom'
import { FileText, LayoutDashboard, Package, Settings, Users } from 'lucide-react'

const LINKS = [
  { to: '/', label: 'Tableau de bord', icon: LayoutDashboard, end: true },
  { to: '/factures', label: 'Factures', icon: FileText },
  { to: '/clients', label: 'Clients', icon: Users },
  { to: '/articles', label: 'Articles', icon: Package },
]

export default function Layout() {
  return (
    <div className="app">
      <aside className="sidebar">
        <div className="brand">
          <span className="brand-mark">f</span>
          <span>fFacturagen</span>
        </div>
        <nav className="nav">
          {LINKS.map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}
            >
              <Icon size={17} strokeWidth={1.9} />
              {label}
            </NavLink>
          ))}
        </nav>
        <div className="sidebar-foot">
          <NavLink
            to="/parametres"
            className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
          >
            <Settings size={17} />
            Paramètres
          </NavLink>
        </div>
      </aside>
      <main className="content">
        <Outlet />
      </main>
    </div>
  )
}

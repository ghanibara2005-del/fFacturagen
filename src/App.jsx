import { Navigate, Route, Routes } from 'react-router-dom'
import Layout from './components/Layout.jsx'
import Dashboard from './pages/Dashboard.jsx'
import Invoices from './pages/Invoices.jsx'
import InvoiceEditor from './pages/InvoiceEditor.jsx'
import InvoiceDetail from './pages/InvoiceDetail.jsx'
import Clients from './pages/Clients.jsx'
import Products from './pages/Products.jsx'
import Settings from './pages/Settings.jsx'

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<Dashboard />} />
        <Route path="/factures" element={<Invoices />} />
        <Route path="/factures/nouvelle" element={<InvoiceEditor />} />
        <Route path="/factures/:id" element={<InvoiceDetail />} />
        <Route path="/factures/:id/modifier" element={<InvoiceEditor />} />
        <Route path="/clients" element={<Clients />} />
        <Route path="/articles" element={<Products />} />
        <Route path="/parametres" element={<Settings />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  )
}

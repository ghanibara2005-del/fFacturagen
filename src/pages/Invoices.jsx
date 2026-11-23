import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { FilePlus2, Pencil, Trash2 } from 'lucide-react'
import PageHead from '../components/PageHead.jsx'
import ErrorNote from '../components/ErrorNote.jsx'
import StatusBadge from '../components/StatusBadge.jsx'
import { api } from '../lib/api.js'
import { formatDate, formatMoney } from '../lib/format.js'

export default function Invoices() {
  const [invoices, setInvoices] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    api.invoices
      .list()
      .then(setInvoices)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false))
  }, [])

  const remove = async (invoice) => {
    if (!window.confirm(`Supprimer la facture ${invoice.number} ?`)) return
    try {
      await api.invoices.remove(invoice.id)
      setInvoices((list) => list.filter((item) => item.id !== invoice.id))
    } catch (err) {
      setError(err.message)
    }
  }

  return (
    <>
      <PageHead
        title="Factures"
        subtitle={loading ? 'Chargement…' : `${invoices.length} facture(s)`}
        actions={
          <Link className="btn btn-primary" to="/factures/nouvelle">
            <FilePlus2 size={16} /> Nouvelle facture
          </Link>
        }
      />

      <ErrorNote message={error} />

      <section className="card">
        {!loading && invoices.length === 0 && (
          <div className="empty">
            <p>Vous n’avez pas encore de facture.</p>
            <Link className="btn btn-ghost" to="/factures/nouvelle">
              Créer une facture
            </Link>
          </div>
        )}

        {invoices.length > 0 && (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Numéro</th>
                  <th>Client</th>
                  <th>Date</th>
                  <th>Échéance</th>
                  <th>Statut</th>
                  <th className="num">Total TTC</th>
                  <th className="num">Actions</th>
                </tr>
              </thead>
              <tbody>
                {invoices.map((invoice) => (
                  <tr key={invoice.id}>
                    <td>
                      <Link className="row-link" to={`/factures/${invoice.id}`}>
                        {invoice.number}
                      </Link>
                    </td>
                    <td>
                      <div className="cell-title">{invoice.client_name || '—'}</div>
                      {invoice.client_company && <div className="cell-sub">{invoice.client_company}</div>}
                    </td>
                    <td>{formatDate(invoice.issue_date)}</td>
                    <td>{formatDate(invoice.due_date)}</td>
                    <td>
                      <StatusBadge status={invoice.status} />
                    </td>
                    <td className="num strong">{formatMoney(invoice.total_ttc)}</td>
                    <td className="num">
                      <div className="row-actions">
                        <Link
                          className="icon-btn"
                          to={`/factures/${invoice.id}/modifier`}
                          title="Modifier"
                          aria-label={`Modifier ${invoice.number}`}
                        >
                          <Pencil size={16} />
                        </Link>
                        <button
                          type="button"
                          className="icon-btn danger"
                          onClick={() => remove(invoice)}
                          title="Supprimer"
                          aria-label={`Supprimer ${invoice.number}`}
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </>
  )
}

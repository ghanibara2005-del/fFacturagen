import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowUpRight, FilePlus2 } from 'lucide-react'
import PageHead from '../components/PageHead.jsx'
import ErrorNote from '../components/ErrorNote.jsx'
import StatusBadge from '../components/StatusBadge.jsx'
import { api } from '../lib/api.js'
import { formatDate, formatMoney } from '../lib/format.js'

function Stat({ label, value, note, tone = '' }) {
  return (
    <div className={`card stat ${tone ? `stat-${tone}` : ''}`}>
      <div className="stat-label">{label}</div>
      <div className="stat-value">{value}</div>
      {note && <div className="stat-note">{note}</div>}
    </div>
  )
}

export default function Dashboard() {
  const [stats, setStats] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => {
    api
      .stats()
      .then(setStats)
      .catch((err) => setError(err.message))
  }, [])

  return (
    <>
      <PageHead
        title="Tableau de bord"
        subtitle="Vue d’ensemble de votre facturation"
        actions={
          <Link className="btn btn-primary" to="/factures/nouvelle">
            <FilePlus2 size={16} /> Nouvelle facture
          </Link>
        }
      />

      <ErrorNote message={error} />

      <div className="stat-grid">
        <Stat
          label="Encaissé"
          value={stats ? formatMoney(stats.paid) : '—'}
          note="Factures payées"
          tone="green"
        />
        <Stat
          label="En attente"
          value={stats ? formatMoney(stats.pending) : '—'}
          note="Factures envoyées"
          tone="amber"
        />
        <Stat
          label="Brouillons"
          value={stats ? String(stats.drafts) : '—'}
          note={stats ? `${formatMoney(stats.drafts_total)} en préparation` : ''}
        />
        <Stat label="Clients" value={stats ? String(stats.clients) : '—'} note="Fiches clients" />
      </div>

      <section className="card">
        <header className="card-head">
          <h2>Dernières factures</h2>
          <Link to="/factures" className="link">
            Tout voir <ArrowUpRight size={14} />
          </Link>
        </header>

        {stats && stats.recent.length === 0 && (
          <div className="empty">
            <p>Aucune facture pour le moment.</p>
            <Link className="btn btn-ghost" to="/factures/nouvelle">
              Créer la première facture
            </Link>
          </div>
        )}

        {stats && stats.recent.length > 0 && (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Numéro</th>
                  <th>Client</th>
                  <th>Date</th>
                  <th>Statut</th>
                  <th className="num">Total TTC</th>
                </tr>
              </thead>
              <tbody>
                {stats.recent.map((invoice) => (
                  <tr key={invoice.id}>
                    <td>
                      <Link className="row-link" to={`/factures/${invoice.id}`}>
                        {invoice.number}
                      </Link>
                    </td>
                    <td>{invoice.client_name || '—'}</td>
                    <td>{formatDate(invoice.issue_date)}</td>
                    <td>
                      <StatusBadge status={invoice.status} />
                    </td>
                    <td className="num strong">{formatMoney(invoice.total_ttc)}</td>
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

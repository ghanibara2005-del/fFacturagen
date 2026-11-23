import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, Pencil, Printer, Trash2 } from 'lucide-react'
import ErrorNote from '../components/ErrorNote.jsx'
import { api } from '../lib/api.js'
import { formatDate, formatMoney, formatNumber } from '../lib/format.js'
import { loadCompany } from '../lib/company.js'

export default function InvoiceDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [invoice, setInvoice] = useState(null)
  const [company] = useState(() => loadCompany())
  const [error, setError] = useState('')

  useEffect(() => {
    api.invoices
      .get(id)
      .then(setInvoice)
      .catch((err) => setError(err.message))
  }, [id])

  const changeStatus = async (event) => {
    try {
      setInvoice(await api.invoices.setStatus(id, event.target.value))
    } catch (err) {
      setError(err.message)
    }
  }

  const remove = async () => {
    if (!invoice || !window.confirm(`Supprimer la facture ${invoice.number} ?`)) return
    try {
      await api.invoices.remove(id)
      navigate('/factures')
    } catch (err) {
      setError(err.message)
    }
  }

  if (!invoice) {
    return (
      <div>
        <Link className="btn btn-ghost" to="/factures">
          <ArrowLeft size={16} /> Retour aux factures
        </Link>
        <ErrorNote message={error} />
        {!error && <div className="loading">Chargement…</div>}
      </div>
    )
  }

  return (
    <div className="invoice-page">
      <div className="invoice-toolbar no-print">
        <Link className="btn btn-ghost" to="/factures">
          <ArrowLeft size={16} /> Factures
        </Link>
        <div className="toolbar-right">
          <select
            className="input input-inline"
            value={invoice.status}
            onChange={changeStatus}
            aria-label="Statut de la facture"
          >
            <option value="draft">Brouillon</option>
            <option value="sent">Envoyée</option>
            <option value="paid">Payée</option>
          </select>
          <Link className="btn btn-ghost" to={`/factures/${invoice.id}/modifier`}>
            <Pencil size={16} /> Modifier
          </Link>
          <button type="button" className="btn btn-ghost" onClick={() => window.print()}>
            <Printer size={16} /> Imprimer
          </button>
          <button type="button" className="btn btn-danger" onClick={remove}>
            <Trash2 size={16} /> Supprimer
          </button>
        </div>
      </div>

      <ErrorNote message={error} />

      <article className="invoice-sheet">
        <header className="sheet-head">
          <div>
            <div className="sheet-brand">{company.name || 'Mon entreprise'}</div>
            <div className="sheet-company">
              {company.address && <div>{company.address}</div>}
              {company.phone && <div>{company.phone}</div>}
              {company.email && <div>{company.email}</div>}
              {(company.nif || company.rc) && (
                <div>
                  {company.nif && <>NIF : {company.nif}</>}
                  {company.nif && company.rc && ' · '}
                  {company.rc && <>RC : {company.rc}</>}
                </div>
              )}
            </div>
          </div>
          <div className="sheet-meta">
            <div className="sheet-title">Facture</div>
            <div className="sheet-number">{invoice.number}</div>
          </div>
        </header>

        <section className="sheet-parties">
          <div>
            <div className="sheet-label">Facturé à</div>
            <div className="sheet-client">{invoice.client_company || invoice.client_name || '—'}</div>
            {invoice.client_company && invoice.client_name && <div>{invoice.client_name}</div>}
            {invoice.client_address && <div className="sheet-soft">{invoice.client_address}</div>}
            {invoice.client_phone && <div className="sheet-soft">{invoice.client_phone}</div>}
            {invoice.client_email && <div className="sheet-soft">{invoice.client_email}</div>}
            {invoice.client_nif && <div className="sheet-soft">NIF : {invoice.client_nif}</div>}
          </div>
          <div className="sheet-dates">
            <div>
              <span className="sheet-soft">Date</span>
              <strong>{formatDate(invoice.issue_date)}</strong>
            </div>
            <div>
              <span className="sheet-soft">Échéance</span>
              <strong>{formatDate(invoice.due_date)}</strong>
            </div>
          </div>
        </section>

        <table className="sheet-table">
          <thead>
            <tr>
              <th>Désignation</th>
              <th className="num">Qté</th>
              <th className="num">Prix unit. HT</th>
              <th className="num">TVA</th>
              <th className="num">Total HT</th>
            </tr>
          </thead>
          <tbody>
            {invoice.items.map((item) => (
              <tr key={item.id}>
                <td>{item.description}</td>
                <td className="num">{formatNumber(item.quantity)}</td>
                <td className="num">{formatMoney(item.unit_price)}</td>
                <td className="num">{formatNumber(item.tva_rate)} %</td>
                <td className="num">{formatMoney(item.quantity * item.unit_price)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="totals">
          <div className="totals-row">
            <span>Total HT</span>
            <span>{formatMoney(invoice.total_ht)}</span>
          </div>
          <div className="totals-row">
            <span>TVA</span>
            <span>{formatMoney(invoice.total_tva)}</span>
          </div>
          <div className="totals-row total">
            <span>Total TTC</span>
            <span>{formatMoney(invoice.total_ttc)}</span>
          </div>
        </div>

        {invoice.notes && (
          <div className="sheet-notes">
            <h3>Notes</h3>
            <p>{invoice.notes}</p>
          </div>
        )}

        <footer className="sheet-footer">
          {[company.address, company.phone, company.email].filter(Boolean).join(' · ')}
          {(company.nif || company.rc) && (
            <div>
              {company.nif && `NIF : ${company.nif}`}
              {company.nif && company.rc && ' · '}
              {company.rc && `RC : ${company.rc}`}
            </div>
          )}
          {company.footer && <div>{company.footer}</div>}
        </footer>
      </article>
    </div>
  )
}

import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { Plus, Trash2 } from 'lucide-react'
import PageHead from '../components/PageHead.jsx'
import ErrorNote from '../components/ErrorNote.jsx'
import { api } from '../lib/api.js'
import { computeTotals, formatMoney, today } from '../lib/format.js'

const blankItem = () => ({ description: '', quantity: '1', unit_price: '', tva_rate: '19' })

export default function InvoiceEditor() {
  const { id } = useParams()
  const editing = Boolean(id)
  const navigate = useNavigate()

  const [clients, setClients] = useState([])
  const [products, setProducts] = useState([])
  const [form, setForm] = useState({
    client_id: '',
    issue_date: today(),
    due_date: '',
    status: 'draft',
    notes: '',
  })
  const [items, setItems] = useState([blankItem()])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    let cancelled = false

    async function load() {
      try {
        const [clientList, productList] = await Promise.all([api.clients.list(), api.products.list()])
        if (cancelled) return
        setClients(clientList)
        setProducts(productList)

        if (editing) {
          const invoice = await api.invoices.get(id)
          if (cancelled) return
          setForm({
            client_id: String(invoice.client_id ?? ''),
            issue_date: String(invoice.issue_date).slice(0, 10),
            due_date: invoice.due_date ? String(invoice.due_date).slice(0, 10) : '',
            status: invoice.status,
            notes: invoice.notes || '',
          })
          setItems(
            invoice.items.map((item) => ({
              description: item.description,
              quantity: String(item.quantity),
              unit_price: String(item.unit_price),
              tva_rate: String(item.tva_rate),
            }))
          )
        }
      } catch (err) {
        if (!cancelled) setError(err.message)
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    load()
    return () => {
      cancelled = true
    }
  }, [editing, id])

  const totals = useMemo(() => computeTotals(items), [items])

  const updateItem = (index, patch) => {
    setItems((list) => list.map((item, i) => (i === index ? { ...item, ...patch } : item)))
  }

  const removeItem = (index) => {
    setItems((list) => (list.length === 1 ? list : list.filter((_, i) => i !== index)))
  }

  const addFromProduct = (productId) => {
    const product = products.find((item) => String(item.id) === productId)
    if (!product) return
    setItems((list) => [
      ...list,
      {
        description: product.name,
        quantity: '1',
        unit_price: String(product.price),
        tva_rate: String(product.tva_rate),
      },
    ])
  }

  const submit = async (event) => {
    event.preventDefault()
    setError('')
    if (!form.client_id) {
      setError('Sélectionnez un client pour la facture')
      return
    }
    setSaving(true)
    try {
      const payload = {
        ...form,
        client_id: Number(form.client_id),
        due_date: form.due_date || null,
        items: items.map((item) => ({
          description: item.description,
          quantity: Number(item.quantity) || 0,
          unit_price: Number(item.unit_price) || 0,
          tva_rate: Number(item.tva_rate) || 0,
        })),
      }
      const saved = editing ? await api.invoices.update(id, payload) : await api.invoices.create(payload)
      navigate(`/factures/${saved.id}`)
    } catch (err) {
      setError(err.message)
      setSaving(false)
    }
  }

  if (loading) {
    return <div className="loading">Chargement…</div>
  }

  return (
    <>
      <PageHead
        title={editing ? 'Modifier la facture' : 'Nouvelle facture'}
        subtitle="Renseignez le client et les lignes de la facture"
        actions={
          <Link className="btn btn-ghost" to={editing ? `/factures/${id}` : '/factures'}>
            Annuler
          </Link>
        }
      />

      <ErrorNote message={error} />

      <form className="editor" onSubmit={submit}>
        <section className="card pad">
          <div className="form-grid">
            <div className="field">
              <label htmlFor="client">Client</label>
              <select
                id="client"
                className="input"
                value={form.client_id}
                onChange={(e) => setForm({ ...form, client_id: e.target.value })}
              >
                <option value="">Sélectionner un client…</option>
                {clients.map((client) => (
                  <option key={client.id} value={client.id}>
                    {client.company ? `${client.name} — ${client.company}` : client.name}
                  </option>
                ))}
              </select>
              {clients.length === 0 && (
                <span className="hint">
                  Aucun client pour le moment. <Link to="/clients">Ajoutez un client</Link>.
                </span>
              )}
            </div>

            <div className="field">
              <label htmlFor="status">Statut</label>
              <select
                id="status"
                className="input"
                value={form.status}
                onChange={(e) => setForm({ ...form, status: e.target.value })}
              >
                <option value="draft">Brouillon</option>
                <option value="sent">Envoyée</option>
                <option value="paid">Payée</option>
              </select>
            </div>

            <div className="field">
              <label htmlFor="issue_date">Date de facture</label>
              <input
                id="issue_date"
                type="date"
                className="input"
                value={form.issue_date}
                onChange={(e) => setForm({ ...form, issue_date: e.target.value })}
              />
            </div>

            <div className="field">
              <label htmlFor="due_date">Échéance</label>
              <input
                id="due_date"
                type="date"
                className="input"
                value={form.due_date}
                onChange={(e) => setForm({ ...form, due_date: e.target.value })}
              />
            </div>
          </div>
        </section>

        <section className="card">
          <header className="card-head">
            <h2>Lignes de facture</h2>
            {products.length > 0 && (
              <select
                className="input input-inline"
                value=""
                aria-label="Ajouter depuis un article"
                onChange={(e) => addFromProduct(e.target.value)}
              >
                <option value="">Ajouter depuis un article…</option>
                {products.map((product) => (
                  <option key={product.id} value={product.id}>
                    {product.name}
                  </option>
                ))}
              </select>
            )}
          </header>

          <div className="items">
            <div className="item-row item-head">
              <span>Désignation</span>
              <span>Qté</span>
              <span>Prix unit. HT</span>
              <span>TVA %</span>
              <span className="num">Total HT</span>
              <span />
            </div>

            {items.map((item, index) => (
              <div className="item-row" key={index}>
                <input
                  className="input"
                  placeholder="Désignation"
                  value={item.description}
                  onChange={(e) => updateItem(index, { description: e.target.value })}
                  aria-label="Désignation"
                />
                <input
                  className="input"
                  type="number"
                  min="0"
                  step="0.01"
                  value={item.quantity}
                  onChange={(e) => updateItem(index, { quantity: e.target.value })}
                  aria-label="Quantité"
                />
                <input
                  className="input"
                  type="number"
                  min="0"
                  step="0.01"
                  value={item.unit_price}
                  onChange={(e) => updateItem(index, { unit_price: e.target.value })}
                  aria-label="Prix unitaire"
                />
                <input
                  className="input"
                  type="number"
                  min="0"
                  step="0.01"
                  value={item.tva_rate}
                  onChange={(e) => updateItem(index, { tva_rate: e.target.value })}
                  aria-label="Taux de TVA"
                />
                <div className="item-total num">
                  {formatMoney((Number(item.quantity) || 0) * (Number(item.unit_price) || 0))}
                </div>
                <button
                  type="button"
                  className="icon-btn danger"
                  onClick={() => removeItem(index)}
                  aria-label="Supprimer la ligne"
                  disabled={items.length === 1}
                >
                  <Trash2 size={16} />
                </button>
              </div>
            ))}
          </div>
          <div className="items-foot">
            <button type="button" className="btn btn-ghost" onClick={() => setItems((list) => [...list, blankItem()])}>
              <Plus size={16} /> Ajouter une ligne
            </button>
          </div>
        </section>

        <section className="card pad">
          <div className="editor-foot">
            <div className="field">
              <label htmlFor="notes">Notes</label>
              <textarea
                id="notes"
                className="input"
                rows={3}
                value={form.notes}
                placeholder="Conditions de paiement, remerciements…"
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
              />
            </div>

            <div className="totals">
              <div className="totals-row">
                <span>Total HT</span>
                <span>{formatMoney(totals.total_ht)}</span>
              </div>
              <div className="totals-row">
                <span>TVA</span>
                <span>{formatMoney(totals.total_tva)}</span>
              </div>
              <div className="totals-row total">
                <span>Total TTC</span>
                <span>{formatMoney(totals.total_ttc)}</span>
              </div>
            </div>
          </div>

          <div className="form-actions">
            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? 'Enregistrement…' : editing ? 'Enregistrer les modifications' : 'Créer la facture'}
            </button>
          </div>
        </section>
      </form>
    </>
  )
}

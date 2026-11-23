import { useEffect, useState } from 'react'
import { Pencil, Trash2 } from 'lucide-react'
import PageHead from '../components/PageHead.jsx'
import ErrorNote from '../components/ErrorNote.jsx'
import Modal from '../components/Modal.jsx'
import { api } from '../lib/api.js'
import { formatMoney, formatNumber } from '../lib/format.js'

const EMPTY = { name: '', description: '', unit: 'unité', price: '', tva_rate: '19' }

export default function Products() {
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [form, setForm] = useState(null)

  useEffect(() => {
    api.products
      .list()
      .then(setProducts)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false))
  }, [])

  const openNew = () => {
    setError('')
    setForm({ ...EMPTY, id: null })
  }

  const openEdit = (product) => {
    setError('')
    setForm({
      id: product.id,
      name: product.name,
      description: product.description || '',
      unit: product.unit || 'unité',
      price: String(product.price),
      tva_rate: String(product.tva_rate),
    })
  }

  const save = async (event) => {
    event.preventDefault()
    setError('')
    try {
      const { id } = form
      const payload = {
        name: form.name,
        description: form.description,
        unit: form.unit,
        price: Number(form.price) || 0,
        tva_rate: Number(form.tva_rate) || 0,
      }
      if (id) {
        const updated = await api.products.update(id, payload)
        setProducts((list) => list.map((item) => (item.id === id ? updated : item)))
      } else {
        const created = await api.products.create(payload)
        setProducts((list) => [...list, created].sort((a, b) => a.name.localeCompare(b.name)))
      }
      setForm(null)
    } catch (err) {
      setError(err.message)
    }
  }

  const remove = async (product) => {
    if (!window.confirm(`Supprimer « ${product.name} » ?`)) return
    try {
      await api.products.remove(product.id)
      setProducts((list) => list.filter((item) => item.id !== product.id))
    } catch (err) {
      setError(err.message)
    }
  }

  return (
    <>
      <PageHead
        title="Articles"
        subtitle={loading ? 'Chargement…' : `${products.length} article(s)`}
        actions={
          <button type="button" className="btn btn-primary" onClick={openNew}>
            Nouvel article
          </button>
        }
      />

      <ErrorNote message={error} />

      <section className="card">
        {!loading && products.length === 0 && (
          <div className="empty">
            <p>Enregistrez vos prestations pour les ajouter en un clic sur vos factures.</p>
          </div>
        )}

        {products.length > 0 && (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Désignation</th>
                  <th>Unité</th>
                  <th className="num">Prix HT</th>
                  <th className="num">TVA</th>
                  <th className="num">Actions</th>
                </tr>
              </thead>
              <tbody>
                {products.map((product) => (
                  <tr key={product.id}>
                    <td>
                      <div className="cell-title">{product.name}</div>
                      {product.description && <div className="cell-sub">{product.description}</div>}
                    </td>
                    <td className="cell-sub">{product.unit}</td>
                    <td className="num strong">{formatMoney(product.price)}</td>
                    <td className="num">{formatNumber(product.tva_rate)} %</td>
                    <td className="num">
                      <div className="row-actions">
                        <button
                          type="button"
                          className="icon-btn"
                          onClick={() => openEdit(product)}
                          title="Modifier"
                          aria-label={`Modifier ${product.name}`}
                        >
                          <Pencil size={16} />
                        </button>
                        <button
                          type="button"
                          className="icon-btn danger"
                          onClick={() => remove(product)}
                          title="Supprimer"
                          aria-label={`Supprimer ${product.name}`}
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

      {form && (
        <Modal
          title={form.id ? 'Modifier l’article' : 'Nouvel article'}
          onClose={() => setForm(null)}
          footer={
            <>
              <button type="button" className="btn btn-ghost" onClick={() => setForm(null)}>
                Annuler
              </button>
              <button type="submit" form="product-form" className="btn btn-primary">
                Enregistrer
              </button>
            </>
          }
        >
          <form id="product-form" className="form-grid" onSubmit={save}>
            <div className="field full">
              <label htmlFor="product-name">Désignation</label>
              <input
                id="product-name"
                className="input"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                required
              />
            </div>
            <div className="field full">
              <label htmlFor="product-description">Description</label>
              <input
                id="product-description"
                className="input"
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
              />
            </div>
            <div className="field">
              <label htmlFor="product-unit">Unité</label>
              <input
                id="product-unit"
                className="input"
                value={form.unit}
                onChange={(e) => setForm({ ...form, unit: e.target.value })}
              />
            </div>
            <div className="field">
              <label htmlFor="product-price">Prix unitaire HT (DA)</label>
              <input
                id="product-price"
                type="number"
                min="0"
                step="0.01"
                className="input"
                value={form.price}
                onChange={(e) => setForm({ ...form, price: e.target.value })}
                required
              />
            </div>
            <div className="field">
              <label htmlFor="product-tva">TVA (%)</label>
              <input
                id="product-tva"
                type="number"
                min="0"
                step="0.01"
                className="input"
                value={form.tva_rate}
                onChange={(e) => setForm({ ...form, tva_rate: e.target.value })}
              />
            </div>
          </form>
        </Modal>
      )}
    </>
  )
}

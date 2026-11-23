import { useEffect, useState } from 'react'
import { Pencil, Plus, Trash2 } from 'lucide-react'
import PageHead from '../components/PageHead.jsx'
import ErrorNote from '../components/ErrorNote.jsx'
import Modal from '../components/Modal.jsx'
import { api } from '../lib/api.js'
import { validateClient } from '../../shared/clientValidation.js'

const EMPTY = { name: '', company: '', email: '', phone: '', address: '', nif: '', rc: '' }

export default function Clients() {
  const [clients, setClients] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [form, setForm] = useState(null)
  const [saving, setSaving] = useState(false)
  const [fieldErrors, setFieldErrors] = useState({})

  useEffect(() => {
    api.clients
      .list()
      .then(setClients)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false))
  }, [])

  const openNew = () => {
    setError('')
    setFieldErrors({})
    setForm({ ...EMPTY, id: null })
  }
  const openEdit = (client) => {
    setError('')
    setFieldErrors({})
    setForm({
      id: client.id,
      name: client.name,
      company: client.company || '',
      email: client.email || '',
      phone: client.phone || '',
      address: client.address || '',
      nif: client.nif || '',
      rc: client.rc || '',
    })
  }

  const update = (field, value) => {
    setForm((current) => ({ ...current, [field]: value }))
    setFieldErrors((current) => (current[field] ? { ...current, [field]: '' } : current))
  }

  const save = async (event) => {
    event.preventDefault()
    setError('')
    const errors = validateClient(form)
    setFieldErrors(errors)
    if (Object.keys(errors).length > 0) return
    try {
      const { id, ...data } = form
      if (id) {
        const updated = await api.clients.update(id, data)
        setClients((list) => list.map((client) => (client.id === id ? { ...client, ...updated } : client)))
      } else {
        const created = await api.clients.create(data)
        setClients((list) => [...list, { ...created, invoice_count: 0 }].sort((a, b) => a.name.localeCompare(b.name)))
      }
      setForm(null)
    } catch (err) {
      setError(err.message)
    }
  }

  const remove = async (client) => {
    if (!window.confirm(`Supprimer le client « ${client.name} » ?`)) return
    try {
      await api.clients.remove(client.id)
      setClients((list) => list.filter((item) => item.id !== client.id))
    } catch (err) {
      setError(err.message)
    }
  }

  return (
    <>
      <PageHead
        title="Clients"
        subtitle={loading ? 'Chargement…' : `${clients.length} client(s)`}
        actions={
          <button type="button" className="btn btn-primary" onClick={openNew}>
            Nouveau client
          </button>
        }
      />

      <ErrorNote message={error} />

      <section className="card">
        {!loading && clients.length === 0 && (
          <div className="empty">
            <p>Ajoutez votre premier client pour commencer à facturer.</p>
          </div>
        )}

        {clients.length > 0 && (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Nom</th>
                  <th>Contact</th>
                  <th>Adresse</th>
                  <th className="num">Factures</th>
                  <th className="num">Actions</th>
                </tr>
              </thead>
              <tbody>
                {clients.map((client) => (
                  <tr key={client.id}>
                    <td>
                      <div className="cell-title">{client.name}</div>
                      {client.company && <div className="cell-sub">{client.company}</div>}
                    </td>
                    <td>
                      <div className="cell-title">{client.phone || '—'}</div>
                      {client.email && <div className="cell-sub">{client.email}</div>}
                    </td>
                    <td className="cell-sub">{client.address || '—'}</td>
                    <td className="num">{client.invoice_count ?? 0}</td>
                    <td className="num">
                      <div className="row-actions">
                        <button
                          type="button"
                          className="icon-btn"
                          onClick={() => openEdit(client)}
                          title="Modifier"
                          aria-label={`Modifier ${client.name}`}
                        >
                          <Pencil size={16} />
                        </button>
                        <button
                          type="button"
                          className="icon-btn danger"
                          onClick={() => remove(client)}
                          title="Supprimer"
                          aria-label={`Supprimer ${client.name}`}
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
          title={form.id ? 'Modifier le client' : 'Nouveau client'}
          onClose={() => setForm(null)}
          footer={
            <>
              <button type="button" className="btn btn-ghost" onClick={() => setForm(null)}>
                Annuler
              </button>
              <button type="submit" form="client-form" className="btn btn-primary">
                Enregistrer
              </button>
            </>
          }
        >
          <form id="client-form" className="form-grid" onSubmit={save} noValidate>
            <div className="field">
              <label htmlFor="client-name">Nom</label>
              <input
                id="client-name"
                className={`input${fieldErrors.name ? ' invalid' : ''}`}
                value={form.name}
                onChange={(e) => update('name', e.target.value)}
                aria-invalid={Boolean(fieldErrors.name)}
                required
              />
              {fieldErrors.name && <span className="field-error">{fieldErrors.name}</span>}
            </div>
            <div className="field">
              <label htmlFor="client-company">Société</label>
              <input
                id="client-company"
                className="input"
                value={form.company}
                onChange={(e) => setForm({ ...form, company: e.target.value })}
              />
            </div>
            <div className="field">
              <label htmlFor="client-email">E-mail</label>
              <input
                id="client-email"
                type="email"
                className={`input${fieldErrors.email ? ' invalid' : ''}`}
                value={form.email}
                onChange={(e) => update('email', e.target.value)}
                aria-invalid={Boolean(fieldErrors.email)}
              />
              {fieldErrors.email && <span className="field-error">{fieldErrors.email}</span>}
            </div>
            <div className="field">
              <label htmlFor="client-phone">Téléphone</label>
              <input
                id="client-phone"
                className="input"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
              />
            </div>
            <div className="field full">
              <label htmlFor="client-address">Adresse</label>
              <input
                id="client-address"
                className="input"
                value={form.address}
                onChange={(e) => setForm({ ...form, address: e.target.value })}
              />
            </div>
            <div className="field">
              <label htmlFor="client-nif">NIF</label>
              <input
                id="client-nif"
                className={`input${fieldErrors.nif ? ' invalid' : ''}`}
                value={form.nif}
                onChange={(e) => update('nif', e.target.value)}
                aria-invalid={Boolean(fieldErrors.nif)}
                inputMode="numeric"
              />
              {fieldErrors.nif && <span className="field-error">{fieldErrors.nif}</span>}
            </div>
            <div className="field">
              <label htmlFor="client-rc">RC</label>
              <input
                id="client-rc"
                className="input"
                value={form.rc}
                onChange={(e) => setForm({ ...form, rc: e.target.value })}
              />
            </div>
          </form>
        </Modal>
      )}
    </>
  )
}

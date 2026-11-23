import { useState } from 'react'
import PageHead from '../components/PageHead.jsx'
import { loadCompany, saveCompany } from '../lib/company.js'

export default function Settings() {
  const [form, setForm] = useState(() => loadCompany())
  const [saved, setSaved] = useState(false)

  const submit = (event) => {
    event.preventDefault()
    saveCompany(form)
    setSaved(true)
    window.setTimeout(() => setSaved(false), 2500)
  }

  const set = (key) => (event) => setForm({ ...form, [key]: event.target.value })

  return (
    <>
      <PageHead title="Paramètres" subtitle="Informations affichées sur vos factures" />

      <form className="card pad" onSubmit={submit}>
        <div className="form-grid">
          <div className="field">
            <label htmlFor="company-name">Nom de l’entreprise</label>
            <input id="company-name" className="input" value={form.name} onChange={set('name')} />
          </div>
          <div className="field">
            <label htmlFor="company-phone">Téléphone</label>
            <input id="company-phone" className="input" value={form.phone} onChange={set('phone')} />
          </div>
          <div className="field full">
            <label htmlFor="company-address">Adresse</label>
            <input id="company-address" className="input" value={form.address} onChange={set('address')} />
          </div>
          <div className="field">
            <label htmlFor="company-email">E-mail</label>
            <input
              id="company-email"
              type="email"
              className="input"
              value={form.email}
              onChange={set('email')}
            />
          </div>
          <div className="field">
            <label htmlFor="company-nif">NIF</label>
            <input id="company-nif" className="input" value={form.nif} onChange={set('nif')} />
          </div>
          <div className="field">
            <label htmlFor="company-rc">RC</label>
            <input id="company-rc" className="input" value={form.rc} onChange={set('rc')} />
          </div>
          <div className="field full">
            <label htmlFor="company-footer">Pied de facture</label>
            <input id="company-footer" className="input" value={form.footer} onChange={set('footer')} />
          </div>
        </div>

        <div className="form-actions">
          <button type="submit" className="btn btn-primary">
            Enregistrer
          </button>
          {saved && <span className="saved-note">Enregistré</span>}
        </div>

        <p className="hint">Ces informations restent enregistrées dans ce navigateur.</p>
      </form>
    </>
  )
}

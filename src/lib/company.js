const STORAGE_KEY = 'ffacturagen.company'

export const defaultCompany = {
  name: 'Mon entreprise',
  address: '',
  phone: '',
  email: '',
  nif: '',
  rc: '',
  footer: 'Merci pour votre confiance.',
}

export function loadCompany() {
  try {
    const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}')
    return { ...defaultCompany, ...stored }
  } catch {
    return { ...defaultCompany }
  }
}

export function saveCompany(company) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(company))
}

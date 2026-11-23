// Règles de validation des clients, partagées entre le formulaire (src) et l'API (server).
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/
const NIF_RE = /^\d{15}$/

// L'e-mail est nettoyé et le NIF est stocké sans espaces.
export function normalizeClient(data) {
  return {
    email: String(data?.email ?? '').trim(),
    nif: String(data?.nif ?? '').replace(/\s+/g, ''),
  }
}

// Retourne un objet { champ: message } ; vide si tout est valide.
export function validateClient(data) {
  const errors = {}
  if (!String(data?.name ?? '').trim()) {
    errors.name = 'Le nom du client est obligatoire.'
  }
  const { email, nif } = normalizeClient(data)
  if (email && !EMAIL_RE.test(email)) {
    errors.email = 'Adresse e-mail invalide (ex. contact@exemple.dz).'
  }
  if (nif && !NIF_RE.test(nif)) {
    errors.nif = 'Le NIF doit comporter exactement 15 chiffres.'
  }
  return errors
}

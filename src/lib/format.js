const moneyFormatter = new Intl.NumberFormat('fr-DZ', {
  style: 'currency',
  currency: 'DZD',
  maximumFractionDigits: 2,
})

const numberFormatter = new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 2 })

export const formatMoney = (value) => moneyFormatter.format(Number(value) || 0)

export const formatNumber = (value) => numberFormatter.format(Number(value) || 0)

export const formatDate = (value) => {
  if (!value) return '—'
  const date = new Date(String(value).slice(0, 10))
  if (Number.isNaN(date.getTime())) return '—'
  return date.toLocaleDateString('fr-FR')
}

export const today = () => new Date().toISOString().slice(0, 10)

export const STATUS_LABELS = {
  draft: 'Brouillon',
  sent: 'Envoyée',
  paid: 'Payée',
}

export function computeTotals(items) {
  const round = (n) => Math.round(n * 100) / 100
  let ht = 0
  let tva = 0
  for (const item of items) {
    const line = (Number(item.quantity) || 0) * (Number(item.unit_price) || 0)
    ht += line
    tva += line * ((Number(item.tva_rate) || 0) / 100)
  }
  ht = round(ht)
  tva = round(tva)
  return { total_ht: ht, total_tva: tva, total_ttc: round(ht + tva) }
}

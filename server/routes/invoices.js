import { Router } from 'express'
import { pool } from '../db.js'
import { ah, httpError } from '../http.js'

const router = Router()
const STATUSES = ['draft', 'sent', 'paid']
const round = (value) => Math.round(value * 100) / 100

function normalizeItems(items) {
  if (!Array.isArray(items) || items.length === 0) {
    throw httpError(400, 'Ajoutez au moins une ligne à la facture')
  }
  return items.map((item, index) => {
    const description = String(item?.description ?? '').trim()
    const quantity = Number(item?.quantity)
    const unitPrice = Number(item?.unit_price)
    const tvaRate = Number(item?.tva_rate)
    if (!description) throw httpError(400, 'Chaque ligne doit avoir une désignation')
    if (!Number.isFinite(quantity) || quantity <= 0) throw httpError(400, 'Quantité invalide')
    if (!Number.isFinite(unitPrice) || unitPrice < 0) throw httpError(400, 'Prix unitaire invalide')
    if (!Number.isFinite(tvaRate) || tvaRate < 0) throw httpError(400, 'Taux de TVA invalide')
    return {
      description,
      quantity,
      unit_price: unitPrice,
      tva_rate: tvaRate,
      position: index,
    }
  })
}

function totals(items) {
  let totalHt = 0
  let totalTva = 0
  for (const item of items) {
    const line = item.quantity * item.unit_price
    totalHt += line
    totalTva += line * (item.tva_rate / 100)
  }
  totalHt = round(totalHt)
  totalTva = round(totalTva)
  return { total_ht: totalHt, total_tva: totalTva, total_ttc: round(totalHt + totalTva) }
}

function parsePayload(body) {
  const clientId = Number(body?.client_id)
  if (!Number.isInteger(clientId) || clientId <= 0) throw httpError(400, 'Sélectionnez un client')

  const issueDate = String(body?.issue_date ?? '').slice(0, 10)
  if (!/^\d{4}-\d{2}-\d{2}$/.test(issueDate)) throw httpError(400, 'Date de facture invalide')

  const issueRaw = String(body.issue_date ?? '').slice(0, 10)
  if (!/^\d{4}-\d{2}-\d{2}$/.test(issueRaw)) throw httpError(400, 'Date de facture invalide')

  const dueRaw = String(body.due_date ?? '').slice(0, 10)
  const dueDate = /^\d{4}-\d{2}-\d{2}$/.test(dueRaw) ? dueRaw : null

  const status = String(body.status ?? 'draft')
  if (!STATUSES.includes(status)) throw httpError(400, 'Statut invalide')

  const items = normalizeItems(body.items)
  return {
    client_id: clientId,
    issue_date: issueRaw,
    due_date: dueDate,
    status,
    notes: String(body.notes ?? '').trim(),
    items,
    ...totals(items),
  }
}

async function findInvoice(id) {
  const { rows } = await pool.query(
    `select i.*,
            c.name as client_name, c.company as client_company, c.email as client_email,
            c.phone as client_phone, c.address as client_address, c.nif as client_nif, c.rc as client_rc
     from invoices i
     left join clients c on c.id = i.client_id
     where i.id = $1`,
    [id]
  )
  if (!rows[0]) return null
  const { rows: items } = await pool.query(
    'select id, description, quantity, unit_price, tva_rate, position from invoice_items where invoice_id = $1 order by position, id',
    [id]
  )
  return { ...rows[0], items }
}

async function insertItems(db, invoiceId, items) {
  for (const item of items) {
    await db.query(
      `insert into invoice_items (invoice_id, description, quantity, unit_price, tva_rate, position)
       values ($1,$2,$3,$4,$5,$6)`,
      [invoiceId, item.description, item.quantity, item.unit_price, item.tva_rate, item.position]
    )
  }
}

async function nextNumber(db, issueDate) {
  const year = String(issueDate).slice(0, 4) || String(new Date().getFullYear())
  const { rows } = await db.query(
    `select coalesce(max(nullif(split_part(number, '-', 3), '')::int), 0) as n
     from invoices where number like $1`,
    [`FAC-${year}-%`]
  )
  return `FAC-${year}-${String(rows[0].n + 1).padStart(4, '0')}`
}

async function assertClient(clientId) {
  const { rows } = await pool.query('select id from clients where id = $1', [clientId])
  if (!rows[0]) throw httpError(400, 'Client introuvable')
}

router.get(
  '/',
  ah(async (req, res) => {
    const { rows } = await pool.query(`
      select i.id, i.number, i.issue_date, i.due_date, i.status,
             i.total_ht, i.total_tva, i.total_ttc,
             c.name as client_name, c.company as client_company
      from invoices i
      left join clients c on c.id = i.client_id
      order by i.issue_date desc, i.id desc`)
    res.json(rows)
  })
)

router.get(
  '/:id',
  ah(async (req, res) => {
    const invoice = await findInvoice(req.params.id)
    if (!invoice) throw httpError(404, 'Facture introuvable')
    res.json(invoice)
  })
)

router.post(
  '/',
  ah(async (req, res) => {
    const data = parsePayload(req.body)
    const db = await pool.connect()
    try {
      await db.query('begin')
      const number = await nextNumber(db, data.issue_date)
      const { rows } = await db.query(
        `insert into invoices (number, client_id, issue_date, due_date, status, notes, total_ht, total_tva, total_ttc)
         values ($1,$2,$3,$4,$5,$6,$7,$8,$9) returning id`,
        [
          number,
          data.client_id,
          data.issue_date,
          data.due_date,
          data.status,
          data.notes,
          data.total_ht,
          data.total_tva,
          data.total_ttc,
        ]
      )
      await insertItems(db, rows[0].id, data.items)
      await db.query('commit')
      res.status(201).json(await findInvoice(rows[0].id))
    } catch (error) {
      await db.query('rollback')
      throw error
    } finally {
      db.release()
    }
  })
)

router.put(
  '/:id',
  ah(async (req, res) => {
    const data = parsePayload(req.body)
    const db = await pool.connect()
    try {
      await db.query('begin')
      const { rows } = await db.query(
        `update invoices
         set client_id=$1, issue_date=$2, due_date=$3, status=$4, notes=$5,
             total_ht=$6, total_tva=$7, total_ttc=$8
         where id=$9 returning id`,
        [
          data.client_id,
          data.issue_date,
          data.due_date,
          data.status,
          data.notes,
          data.total_ht,
          data.total_tva,
          data.total_ttc,
          req.params.id,
        ]
      )
      if (!rows[0]) throw httpError(404, 'Facture introuvable')
      await db.query('delete from invoice_items where invoice_id = $1', [req.params.id])
      await insertItems(db, req.params.id, data.items)
      await db.query('commit')
      res.json(await findInvoice(req.params.id))
    } catch (error) {
      await db.query('rollback')
      throw error
    } finally {
      db.release()
    }
  })
)

router.patch(
  '/:id/status',
  ah(async (req, res) => {
    const status = String(req.body?.status ?? '')
    if (!STATUSES.includes(status)) throw httpError(400, 'Statut invalide')
    const { rows } = await pool.query('update invoices set status=$1 where id=$2 returning id', [
      status,
      req.params.id,
    ])
    if (!rows[0]) throw httpError(404, 'Facture introuvable')
    res.json(await findInvoice(req.params.id))
  })
)

router.delete(
  '/:id',
  ah(async (req, res) => {
    await pool.query('delete from invoices where id = $1', [req.params.id])
    res.status(204).end()
  })
)

export default router

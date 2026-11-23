import { Router } from 'express'
import { pool } from '../db.js'
import { ah, httpError } from '../http.js'
import { CLIENT_FIELDS, clientPayload, validateClient } from '../../shared/clientValidation.js'

const router = Router()

function pick(body) {
  const data = clientPayload(body)
  const message = Object.values(validateClient(data))[0]
  if (message) throw httpError(400, message)
  return data
}

router.get(
  '/',
  ah(async (req, res) => {
    const { rows } = await pool.query(`
      select c.*, count(i.id)::int as invoice_count
      from clients c
      left join invoices i on i.client_id = c.id
      group by c.id
      order by c.name asc`)
    res.json(rows)
  })
)

router.post(
  '/',
  ah(async (req, res) => {
    const data = pick(req.body)
    const { rows } = await pool.query(
      `insert into clients (name, company, email, phone, address, nif, rc)
       values ($1,$2,$3,$4,$5,$6,$7) returning *`,
      CLIENT_FIELDS.map((field) => data[field])
    )
    res.status(201).json(rows[0])
  })
)

router.put(
  '/:id',
  ah(async (req, res) => {
    const data = pick(req.body)
    const { rows } = await pool.query(
      `update clients set name=$1, company=$2, email=$3, phone=$4, address=$5, nif=$6, rc=$7
       where id=$8 returning *`,
      [...CLIENT_FIELDS.map((field) => data[field]), req.params.id]
    )
    if (!rows[0]) throw httpError(404, 'Client introuvable')
    res.json(rows[0])
  })
)

router.delete(
  '/:id',
  ah(async (req, res) => {
    const { rows } = await pool.query('select count(*)::int as n from invoices where client_id = $1', [
      req.params.id,
    ])
    if (rows[0].n > 0) throw httpError(409, 'Ce client a des factures : supprimez-les d’abord')
    await pool.query('delete from clients where id = $1', [req.params.id])
    res.status(204).end()
  })
)

export default router

import { Router } from 'express'
import { pool } from '../db.js'
import { ah, httpError } from '../http.js'

const router = Router()

function pick(body) {
  const name = String(body?.name ?? '').trim()
  const price = Number(body?.price)
  const tvaRate = Number(body?.tva_rate)
  if (!name) throw httpError(400, 'La désignation est obligatoire')
  if (!Number.isFinite(price) || price < 0) throw httpError(400, 'Prix invalide')
  if (!Number.isFinite(tvaRate) || tvaRate < 0) throw httpError(400, 'Taux de TVA invalide')
  return {
    name,
    description: String(req.body?.description ?? '').trim(),
    unit: String(req.body?.unit ?? '').trim() || 'unité',
    price,
    tva_rate: tvaRate,
  }
}

router.get(
  '/',
  ah(async (req, res) => {
    const { rows } = await pool.query('select * from products order by name asc')
    res.json(rows)
  })
)

router.post(
  '/',
  ah(async (req, res) => {
    const data = pick(req.body)
    const { rows } = await pool.query(
      `insert into products (name, description, unit, price, tva_rate)
       values ($1,$2,$3,$4,$5) returning *`,
      [data.name, data.description, data.unit, data.price, data.tva_rate]
    )
    res.status(201).json(rows[0])
  })
)

router.put(
  '/:id',
  ah(async (req, res) => {
    const data = pick(req.body)
    const { rows } = await pool.query(
      `update products set name=$1, description=$2, unit=$3, price=$4, tva_rate=$5
       where id=$6 returning *`,
      [data.name, data.description, data.unit, data.price, data.tva_rate, req.params.id]
    )
    if (!rows[0]) throw httpError(404, 'Article introuvable')
    res.json(rows[0])
  })
)

router.delete(
  '/:id',
  ah(async (req, res) => {
    await pool.query('delete from products where id = $1', [req.params.id])
    res.status(204).end()
  })
)

export default router

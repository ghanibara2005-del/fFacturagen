import { Router } from 'express'
import { pool } from '../db.js'
import { ah } from '../http.js'

const router = Router()

router.get(
  '/',
  ah(async (req, res) => {
    const { rows } = await pool.query(`
      select
        coalesce(sum(total_ttc) filter (where status = 'paid'), 0) as paid,
        coalesce(sum(total_ttc) filter (where status = 'sent'), 0) as pending,
        coalesce(sum(total_ttc) filter (where status = 'draft'), 0) as drafts_total,
        count(*) filter (where status = 'draft')::int as drafts,
        count(*)::int as invoices
      from invoices`)

    const { rows: clientRows } = await pool.query('select count(*)::int as n from clients')

    const { rows: recent } = await pool.query(`
      select i.id, i.number, i.issue_date, i.status, i.total_ttc, c.name as client_name
      from invoices i
      left join clients c on c.id = i.client_id
      order by i.created_at desc, i.id desc
      limit 5`)

    res.json({ ...rows[0], clients: clientRows[0].n, recent })
  })
)

export default router

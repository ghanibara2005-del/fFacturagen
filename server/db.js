import pg from 'pg'

const { Pool } = pg

// numeric/bigint come back as strings by default; the UI wants numbers.
pg.types.setTypeParser(1700, (value) => (value === null ? null : Number(value)))
pg.types.setTypeParser(20, (value) => (value === null ? null : Number(value)))

export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 10,
})

const SCHEMA = `
create table if not exists clients (
  id serial primary key,
  name text not null,
  company text default '',
  email text default '',
  phone text default '',
  address text default '',
  nif text default '',
  rc text default '',
  created_at timestamptz not null default now()
);

create table if not exists products (
  id serial primary key,
  name text not null,
  description text default '',
  unit text default 'unité',
  price numeric(12,2) not null default 0,
  tva_rate numeric(5,2) not null default 19,
  created_at timestamptz not null default now()
);

create table if not exists invoices (
  id serial primary key,
  number text not null unique,
  client_id integer references clients(id) on delete restrict,
  issue_date date not null default current_date,
  due_date date,
  status text not null default 'draft',
  notes text default '',
  total_ht numeric(12,2) not null default 0,
  total_tva numeric(12,2) not null default 0,
  total_ttc numeric(12,2) not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists invoice_items (
  id serial primary key,
  invoice_id integer not null references invoices(id) on delete cascade,
  description text not null,
  quantity numeric(12,2) not null default 1,
  unit_price numeric(12,2) not null default 0,
  tva_rate numeric(5,2) not null default 19,
  position integer not null default 0
);

create index if not exists invoice_items_invoice_idx on invoice_items (invoice_id);
`

async function seed() {
  const { rows } = await pool.query('select count(*)::int as n from clients')
  if (rows[0].n > 0) return

  const clients = [
    ['Atlas Distribution', 'Atlas Distribution SARL', 'contact@atlas-distribution.dz', '0551 22 33 44', '12 rue Didouche Mourad, Alger', '000216012345678', '16/00-1234567B00'],
    ['Nadia Benali', '', 'nadia.benali@example.dz', '0661 55 66 77', 'Résidence El Feth, Bt B, Oran', '', ''],
  ]
  const clientIds = []
  for (const c of clients) {
    const { rows: inserted } = await pool.query(
      `insert into clients (name, company, email, phone, address, nif, rc)
       values ($1,$2,$3,$4,$5,$6,$7) returning id`,
      c
    )
    clientIds.push(inserted[0].id)
  }

  const products = [
    ['Développement site vitrine', 'Site vitrine responsive, 5 pages', 'forfait', 120000, 19],
    ['Maintenance mensuelle', 'Maintenance et mises à jour mensuelles', 'mois', 15000, 19],
    ['Création de logo', 'Logo vectoriel + déclinaisons', 'unité', 25000, 19],
    ['Journée de conseil', 'Accompagnement sur site', 'jour', 18000, 19],
  ]
  for (const p of products) {
    await pool.query(
      `insert into products (name, description, unit, price, tva_rate) values ($1,$2,$3,$4,$5)`,
      p
    )
  }

  const invoiceItems = [
    { description: 'Création de site vitrine', quantity: 1, unit_price: 150000, tva_rate: 19 },
    { description: 'Maintenance mensuelle', quantity: 2, unit_price: 18000, tva_rate: 19 },
  ]
  const round = (n) => Math.round(n * 100) / 100
  const totalHt = round(invoiceItems.reduce((sum, i) => sum + i.quantity * i.unit_price, 0))
  const totalTva = round(
    invoiceItems.reduce((sum, i) => sum + i.quantity * i.unit_price * (i.tva_rate / 100), 0)
  )
  const { rows: invoiceRows } = await pool.query(
    `insert into invoices (number, client_id, issue_date, due_date, status, notes, total_ht, total_tva, total_ttc)
     values ($1,$2,current_date,current_date + interval '30 days','sent',$3,$4,$5,$6) returning id`,
    [
      `FAC-${new Date().getFullYear()}-0001`,
      clientIds[0],
      'Merci pour votre confiance.',
      totalHt,
      totalTva,
      round(totalHt + totalTva),
    ]
  )
  const invoiceId = invoiceRows[0].id
  for (const [index, item] of invoiceItems.entries()) {
    await pool.query(
      `insert into invoice_items (invoice_id, description, quantity, unit_price, tva_rate, position)
       values ($1,$2,$3,$4,$5,$6)`,
      [invoiceId, item.description, item.quantity, item.unit_price, item.tva_rate, index]
    )
  }
}

export async function initDb() {
  let lastError
  for (let attempt = 0; attempt < 30; attempt += 1) {
    try {
      await pool.query('select 1')
      lastError = undefined
      break
    } catch (error) {
      lastError = error
      await new Promise((resolve) => setTimeout(resolve, 1000))
    }
  }
  if (lastError) throw lastError

  await pool.query(SCHEMA)
  await seed()
}

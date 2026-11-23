import { Router } from 'express'
import clients from './routes/clients.js'
import products from './routes/products.js'
import invoices from './routes/invoices.js'
import stats from './routes/stats.js'

const api = Router()

api.use('/clients', clients)
api.use('/products', products)
api.use('/invoices', invoices)
api.use('/stats', stats)

api.use((req, res) => {
  res.status(404).json({ error: 'Route inconnue' })
})

export default api

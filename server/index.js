import express from 'express'
import http from 'node:http'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { initDb } from './db.js'
import api from './api.js'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const port = Number(process.env.PORT || 3000)
const isProd = process.env.NODE_ENV === 'production'

await initDb()

const app = express()
app.disable('x-powered-by')
app.use(express.json({ limit: '1mb' }))
app.use('/api', api)

const server = http.createServer(app)

if (isProd) {
  app.use(express.static(path.join(root, 'dist')))
  app.use((req, res) => res.sendFile(path.join(root, 'dist', 'index.html')))
} else {
  const { createServer } = await import('vite')
  const vite = await createServer({
    root,
    appType: 'custom',
    server: { middlewareMode: true, hmr: { server } },
  })
  app.use(vite.middlewares)
  app.use(async (req, res, next) => {
    try {
      const template = fs.readFileSync(path.join(root, 'index.html'), 'utf-8')
      const html = await vite.transformIndexHtml(req.originalUrl, template)
      res.status(200).set({ 'Content-Type': 'text/html' }).end(html)
    } catch (error) {
      next(error)
    }
  })
}

app.use((err, req, res, next) => {
  const status = err.status || 500
  if (status >= 500) console.error(err)
  res.status(status).json({ error: err.message || 'Erreur serveur' })
})

server.listen(port, '0.0.0.0', () => {
  console.log(`fFacturagen prêt sur http://0.0.0.0:${port}`)
})

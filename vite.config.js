import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// In the Base44 sandbox the preview is served through a proxy whose hostname
// changes with the sandbox id, so allow the whole sandbox domain.
const preview = process.env.BASE44_PREVIEW_MODE === '1'
const sandboxDomain = process.env.BASE44_SANDBOX_HOST_DOMAIN

export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0',
    port: 3000,
    allowedHosts:
      preview && sandboxDomain ? [`.${sandboxDomain}`, 'localhost', '127.0.0.1'] : undefined,
  },
})

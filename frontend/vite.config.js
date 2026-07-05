import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import fs from 'fs'

// Use the self-signed cert generated in the Dockerfile (/ssl/).
// Falls back to plain HTTP when running outside Docker (cert files absent).
const sslKeyPath  = '/ssl/key.pem'
const sslCertPath = '/ssl/cert.pem'
const httpsConfig = fs.existsSync(sslKeyPath) && fs.existsSync(sslCertPath)
  ? { key: fs.readFileSync(sslKeyPath), cert: fs.readFileSync(sslCertPath) }
  : false

export default defineConfig({
  plugins: [react()],
  server: {
    https: httpsConfig,
    host: true,
    port: 7001,
    allowedHosts: ['ch.savean', 'localhost'],
    proxy: {
      '/api': {
        target: process.env.VITE_API_URL || 'http://localhost:8000',
        changeOrigin: true,
      }
    }
  }
})

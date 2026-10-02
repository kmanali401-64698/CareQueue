import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import app from './server/app.js'

function expressPlugin() {
  return {
    name: 'express-backend',
    configureServer(server) {
      server.middlewares.use(app)
    },
  }
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), expressPlugin()],
})

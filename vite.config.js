import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    // The Express API runs on its own port in dev (see server/); proxying it
    // through here means the browser only ever talks to Vite's own origin, so
    // the httpOnly session cookie is same-origin with zero CORS setup needed.
    proxy: {
      // 4000, not 5000 — port 5000 is claimed by macOS's AirPlay Receiver
      // (ControlCenter) on many Macs, well before anything in this repo runs.
      '/api': {
        target: 'http://localhost:4000',
        changeOrigin: true,
      },
    },
  },
})

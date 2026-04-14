import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    host: true, // Expose on local network (0.0.0.0) so phones can connect via LAN IP
    allowedHosts: true, // Allow ngrok and other tunnel domains
    proxy: {
      // Node.js Express routes (auth & scan)
      '/api/auth': {
        target: 'http://localhost:5000',
        changeOrigin: true,
      },
      '/api/scan': {
        target: 'http://localhost:5000',
        changeOrigin: true,
      },
      // FastAPI Python routes (AI analysis)
      '/api': {
        target: 'http://localhost:8000',
        changeOrigin: true,
      },
    },
  },
})


import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    host: true, // Expose on local network (0.0.0.0) so phones can connect via LAN IP
    allowedHosts: true, // Allow ngrok and other tunnel domains
    proxy: {
      '/api': {
        target: 'http://localhost:8000', // FastAPI Python backend
        changeOrigin: true,
      },
    },
  },
})



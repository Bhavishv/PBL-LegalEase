import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    host: true, 
    port: 5188,
    strictPort: true,
    allowedHosts: true, 
    hmr: {
      protocol: 'wss',
      clientPort: 443,
    },
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
      '/api/analysis': {
        target: 'http://localhost:5000',
        changeOrigin: true,
      },
      // FastAPI Python routes (AI analysis & crowd intel)
      '/api': {
        target: 'http://localhost:8000',
        changeOrigin: true,
      },
    },
  },
})

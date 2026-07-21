import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      // FastAPI AI routes must come FIRST (more specific match)
      '/api/ai': {
        target: 'http://localhost:8000',
        changeOrigin: true,
        secure: false,
      },
      // Express REST API
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
        secure: false,
      },
    },
  },
})

import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0',
    port: 5173,
    allowedHosts: true,
    proxy: {
      '/api-proxy': {
        target: 'https://name-neko-api.vercel.app',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api-proxy/, ''),
        secure: false,
      },
      // Keep DoujinDesu calls same-origin in development so browser CORS
      // restrictions do not turn an otherwise valid manga response into an
      // empty grid.
      '/doujin-api': {
        target: 'https://doujin.desu.xxx',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/doujin-api/, '/api'),
        secure: false,
      }
    }
  },
  preview: {
    host: '0.0.0.0',
    port: 5173,
    allowedHosts: true,
  }
})

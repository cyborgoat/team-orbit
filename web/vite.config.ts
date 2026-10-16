import path from 'path'
import { fileURLToPath } from 'url'
import { defineConfig, type ProxyOptions } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { TanStackRouterVite } from '@tanstack/router-plugin/vite'

const rootDir = path.dirname(fileURLToPath(import.meta.url))

const apiProxy: ProxyOptions = {
  target: 'http://localhost:3000',
  bypass(req) {
    if (req.headers.accept?.includes('text/html')) return '/index.html'
  },
}

export default defineConfig({
  plugins: [
    TanStackRouterVite({ target: 'react', autoCodeSplitting: true }),
    react(),
    tailwindcss(),
  ],
  resolve: {
    alias: {
      '@': path.resolve(rootDir, './src'),
    },
  },
  server: {
    port: 5173,
    proxy: {
      '/auth': apiProxy,
      '/users': apiProxy,
      '/events': apiProxy,
      '/announcements': apiProxy,
      '/news': apiProxy,
      '/blog-posts': apiProxy,
      '/forum-posts': apiProxy,
      '/forum-comments': apiProxy,
      '/uploads': apiProxy,
      '/notifications': apiProxy,
      '/health': apiProxy,
      '/socket.io': {
        target: 'http://localhost:3000',
        ws: true,
      },
    },
  },
})

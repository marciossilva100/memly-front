import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',

      workbox: {
        maximumFileSizeToCacheInBytes: 5000000,

        globPatterns: [
          '**/*.{js,css,html,ico,png,svg,jpg,jpeg,webp}'
        ],

        runtimeCaching: [

          // cache de imagens
          {
            urlPattern: ({ request }) => request.destination === 'image',
            handler: 'CacheFirst',
            options: {
              cacheName: 'images-cache',
              expiration: {
                maxEntries: 100,
                maxAgeSeconds: 60 * 60 * 24 * 30
              }
            }
          },

          // cache do áudio TTS vindo da sua API
          {
            urlPattern: ({ url }) =>
              url.origin === 'https://zaldemy.com' &&
              url.pathname.includes('/controller/treino.php') &&
              url.search.includes('action=voice'),

            handler: 'CacheFirst',

            options: {
              cacheName: 'tts-cache',

              expiration: {
                maxEntries: 200,
                maxAgeSeconds: 60 * 60 * 24 * 365
              },

              cacheableResponse: {
                statuses: [0, 200]
              }
            }
          }

        ]
      },

      manifest: {
        id: '/',
        name: 'Zaldemy',
        short_name: 'App',
        start_url: '.',
        display: 'standalone',
        background_color: '#ffffff',
        theme_color: '#000000',

        icons: [
          {
            src: '/icon-192.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: '/icon-512.png',
            sizes: '512x512',
            type: 'image/png'
          }
        ]
      }
    })
  ],

  server: {
    host: '0.0.0.0',
    port: 5173,
    strictPort: true,
    allowedHosts: true,

    proxy: {
      '/api': {
        target: 'https://zaldemy.com',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, '')
      }
    }
  }
})
import { defineConfig } from "vite"
import react from "@vitejs/plugin-react"
import { VitePWA } from "vite-plugin-pwa"

export default defineConfig({
  plugins: [
    react(),

    VitePWA({
      registerType: "autoUpdate",

      workbox: {
        clientsClaim: true,
        skipWaiting: true,
        maximumFileSizeToCacheInBytes: 5000000,

        globPatterns: [
          "**/*.{js,css,html,ico,png,svg,jpg,jpeg,webp}"
        ],

        runtimeCaching: [

          // 🔥 API SEM CACHE (SEMPRE PRIMEIRO)
          {
            urlPattern: ({ url }) =>
              url.hostname === "api.zaldemy.com",

            handler: "NetworkOnly"
          },

          // CACHE DE IMAGENS
          {
            urlPattern: ({ request }) =>
              request.destination === "image",

            handler: "CacheFirst",

            options: {
              cacheName: "images-cache",

              expiration: {
                maxEntries: 100,
                maxAgeSeconds: 60 * 60 * 24 * 30
              }
            }
          },

          // CACHE DO ÁUDIO TTS
          {
            urlPattern: ({ url }) =>
              url.hostname === "api.zaldemy.com" &&
              url.pathname.includes("/controller/treino.php") &&
              url.searchParams.get("action") === "voice",

            handler: "CacheFirst",

            options: {
              cacheName: "tts-cache",

              expiration: {
                maxEntries: 500,
                maxAgeSeconds: 60 * 60 * 24 * 365
              },

              cacheableResponse: {
                statuses: [200]
              }
            }
          },

          // CACHE DA API DE LIVROS
          {
            urlPattern: ({ url }) =>
              url.hostname === "openlibrary.org",

            handler: "StaleWhileRevalidate",

            options: {
              cacheName: "books-api-cache",

              expiration: {
                maxEntries: 50,
                maxAgeSeconds: 60 * 60 * 24
              },

              cacheableResponse: {
                statuses: [0, 200]
              }
            }
          }

        ]
      },

      manifest: {
        id: "/",
        name: "Zaldemy",
        short_name: "App",
        start_url: "/",
        display: "standalone",
        background_color: "#ffffff",
        theme_color: "#000000",

        icons: [
          {
            src: "/icon-192.png",
            sizes: "192x192",
            type: "image/png"
          },
          {
            src: "/icon-512.png",
            sizes: "512x512",
            type: "image/png"
          }
        ]
      }
    })
  ],

  server: {
    host: "0.0.0.0",
    port: 5173,
    strictPort: true,
    allowedHosts: true,

    proxy: {
      "/api": {
        target: "https://api.zaldemy.com",
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, "")
      }
    }
  }
})
import { defineConfig } from "vite"
import react from "@vitejs/plugin-react"
import { VitePWA } from "vite-plugin-pwa"

export default defineConfig(({ mode }) => {
  const API_URL =
    mode === "production"
      ? "https://api.zaldemy.com"
      : "https://hml-api.zaldemy.com";

  return {
    plugins: [
      react(),

      VitePWA({
        // "prompt" em vez de "autoUpdate" - com autoUpdate, o app recarrega
        // sozinho assim que detecta um build novo, sem aviso e a qualquer
        // momento (inclusive no meio de uma requisição em andamento, tipo
        // salvar o idioma escolhido no onboarding - a recarga destrói o
        // estado do React e pode interromper a chamada). O window.confirm()
        // em App.jsx já existia pra isso, mas não tinha efeito nenhum nesse
        // modo, porque o reload automático já acontecia por conta própria.
        registerType: "prompt",

        workbox: {
          // skipWaiting explicitamente false (o default do workbox-build é
          // true, mesmo sem declarar a opção): com skipWaiting, o service
          // worker novo pula direto pro estado ativo sozinho, sem nunca
          // passar pelo estado "esperando" - e é justamente esse estado que
          // o registerType "prompt" precisa pra funcionar (é o que dispara a
          // pergunta pro usuário antes de ativar). clientsClaim continua
          // true - só troca quem atende as próximas requisições após a
          // ativação confirmada, não força nada sozinho.
          skipWaiting: false,
          clientsClaim: true,
          maximumFileSizeToCacheInBytes: 5000000,

          globPatterns: [
            "**/*.{js,css,html,ico,png,svg,jpg,jpeg,webp}"
          ],

          runtimeCaching: [

            // 🔥 API SEM CACHE
            {
              urlPattern: ({ url }) =>
                url.hostname === "api.zaldemy.com" ||
                url.hostname === "hml-api.zaldemy.com",

              handler: "NetworkOnly"
            },

            // 🖼️ CACHE DE IMAGENS
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

            // 🔊 CACHE DO TTS
            {
              urlPattern: ({ url }) =>
                (
                  url.hostname === "api.zaldemy.com" ||
                  url.hostname === "hml-api.zaldemy.com"
                ) &&
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

            // 📚 CACHE OPENLIBRARY
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
          short_name: "Zaldemy",
          start_url: "/",
          display: "standalone",
          background_color: "#111827",
          theme_color: "#111827",

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
          target: API_URL,
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/api/, "")
        }
      }
    }
  };
});
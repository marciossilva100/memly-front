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

            // 🔊 CACHE DO TTS (voz padrão) - precisa vir ANTES da regra "API
            // sem cache" abaixo. O Workbox usa a primeira regra que casar
            // com a URL, e essa era registrada depois de uma regra mais
            // ampla que já cobre o mesmo hostname - a de cache nunca
            // chegava a rodar de verdade, então nenhum áudio ficava
            // salvo (bug: a promessa de "cache inteligente" no modal
            // premium não se cumpria).
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

            // 🔊 CACHE DO TTS (voz natural/premium) - stream_audio agora vai
            // por GET (texto na querystring) exatamente pra poder cachear
            // por URL igual à voz padrão acima. Um replay da mesma frase
            // nem chega no servidor (não gasta cota nem gera custo de novo -
            // o backend já tem seu próprio cache de arquivo, mas isso evita
            // até a viagem de rede).
            {
              urlPattern: ({ url }) =>
                (
                  url.hostname === "api.zaldemy.com" ||
                  url.hostname === "hml-api.zaldemy.com"
                ) &&
                url.pathname.includes("/controller/tts.php") &&
                url.searchParams.get("action") === "stream_audio",

              handler: "CacheFirst",

              options: {
                cacheName: "tts-cache-natural",
                expiration: {
                  maxEntries: 500,
                  maxAgeSeconds: 60 * 60 * 24 * 365
                },
                cacheableResponse: {
                  statuses: [200]
                }
              }
            },

            // 🔥 API SEM CACHE (tudo mais nesses hosts)
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

          // "any" = ícone como desenhado, sem corte (usado tal qual). Sem um
          // ícone "maskable" dedicado, launchers Android que aplicam forma
          // adaptativa (círculo, squircle) tratam o ícone "any" como não
          // seguro pra máscara e o encolhem dentro de uma forma com fundo
          // branco próprio - exatamente o "quadrado dentro de um círculo
          // branco" que aparecia no ícone instalado. O "maskable" tem o
          // logo bem mais recuado (~62% da largura) especificamente pra
          // sobrar espaço de corte sem cortar o desenho, e o fundo já é o
          // mesmo #111827 do app, então mesmo a máscara cortando bem
          // rente, nunca aparece branco.
          icons: [
            {
              src: "/icon-192.png",
              sizes: "192x192",
              type: "image/png",
              purpose: "any"
            },
            {
              src: "/icon-512.png",
              sizes: "512x512",
              type: "image/png",
              purpose: "any"
            },
            {
              src: "/icon-maskable-192.png",
              sizes: "192x192",
              type: "image/png",
              purpose: "maskable"
            },
            {
              src: "/icon-maskable-512.png",
              sizes: "512x512",
              type: "image/png",
              purpose: "maskable"
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
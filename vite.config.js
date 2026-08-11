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
        // injectManifest (SW próprio em src/sw.js) em vez de generateSW: as
        // notificações push precisam de listeners de "push"/"notificationclick"
        // de verdade, que o modo generateSW (SW inteiro auto-gerado a partir
        // de config, sem arquivo próprio) não permite adicionar. As mesmas
        // regras de cache que existiam aqui em runtimeCaching foram portadas
        // pra src/sw.js (workbox-routing/workbox-strategies) - esse bloco
        // `workbox` não é mais lido nesse modo.
        strategies: "injectManifest",
        srcDir: "src",
        filename: "sw.js",

        // "prompt" em vez de "autoUpdate" - com autoUpdate, o app recarrega
        // sozinho assim que detecta um build novo, sem aviso e a qualquer
        // momento (inclusive no meio de uma requisição em andamento, tipo
        // salvar o idioma escolhido no onboarding - a recarga destrói o
        // estado do React e pode interromper a chamada). O window.confirm()
        // em App.jsx já existia pra isso, mas não tinha efeito nenhum nesse
        // modo, porque o reload automático já acontecia por conta própria.
        registerType: "prompt",

        injectManifest: {
          maximumFileSizeToCacheInBytes: 5000000,
          globPatterns: [
            "**/*.{js,css,html,ico,png,svg,jpg,jpeg,webp}"
          ],
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
import { precacheAndRoute } from "workbox-precaching";
import { registerRoute } from "workbox-routing";
import { CacheFirst, NetworkOnly, StaleWhileRevalidate } from "workbox-strategies";
import { ExpirationPlugin } from "workbox-expiration";
import { CacheableResponsePlugin } from "workbox-cacheable-response";
import { clientsClaim } from "workbox-core";

// Mesmo clientsClaim:true que existia no bloco workbox do vite.config.js -
// só troca quem atende as próximas requisições depois que o SW novo já
// ativou (não força ativação sozinho, isso continua dependendo do usuário
// confirmar o prompt de atualização, ver registerType:"prompt").
clientsClaim();

// No modo generateSW esse listener era injetado automaticamente; no
// injectManifest (SW próprio) precisa ser adicionado à mão. É o que faz
// updateSW(true) (App.jsx, via registerSW de virtual:pwa-register)
// realmente ativar o SW novo que estava esperando - sem isso, o prompt de
// atualização aparecia mas confirmar não tinha efeito nenhum.
self.addEventListener("message", (event) => {
    if (event.data?.type === "SKIP_WAITING") {
        self.skipWaiting();
    }
});

// Precache dos assets do build - injetado pelo vite-plugin-pwa
// (strategies: "injectManifest") no momento do build.
precacheAndRoute(self.__WB_MANIFEST);

// As 4 regras abaixo são as MESMAS que existiam em vite.config.js quando o
// plugin ainda gerava o service worker sozinho (modo "generateSW") - só
// portadas pra cá porque um SW próprio (necessário pros listeners de
// push/notificationclick no fim do arquivo) exige o modo "injectManifest",
// que não lê mais o bloco `workbox.runtimeCaching` do vite.config.js.

// 🔊 CACHE DO TTS (voz padrão) - precisa vir ANTES da regra "API sem
// cache" abaixo (a primeira rota que casar com a URL vence).
registerRoute(
    ({ url }) =>
        (url.hostname === "api.zaldemy.com" || url.hostname === "hml-api.zaldemy.com") &&
        url.pathname.includes("/controller/treino.php") &&
        url.searchParams.get("action") === "voice",
    new CacheFirst({
        cacheName: "tts-cache",
        plugins: [
            new ExpirationPlugin({ maxEntries: 500, maxAgeSeconds: 60 * 60 * 24 * 365 }),
            new CacheableResponsePlugin({ statuses: [200] }),
        ],
    })
);

// 🔊 CACHE DO TTS (voz natural/premium)
registerRoute(
    ({ url }) =>
        (url.hostname === "api.zaldemy.com" || url.hostname === "hml-api.zaldemy.com") &&
        url.pathname.includes("/controller/tts.php") &&
        url.searchParams.get("action") === "stream_audio",
    new CacheFirst({
        cacheName: "tts-cache-natural",
        plugins: [
            new ExpirationPlugin({ maxEntries: 500, maxAgeSeconds: 60 * 60 * 24 * 365 }),
            new CacheableResponsePlugin({ statuses: [200] }),
        ],
    })
);

// 🔥 API SEM CACHE (tudo mais nesses hosts)
registerRoute(
    ({ url }) => url.hostname === "api.zaldemy.com" || url.hostname === "hml-api.zaldemy.com",
    new NetworkOnly()
);

// 🖼️ CACHE DE IMAGENS
registerRoute(
    ({ request }) => request.destination === "image",
    new CacheFirst({
        cacheName: "images-cache",
        plugins: [new ExpirationPlugin({ maxEntries: 100, maxAgeSeconds: 60 * 60 * 24 * 30 })],
    })
);

// 📚 CACHE OPENLIBRARY
registerRoute(
    ({ url }) => url.hostname === "openlibrary.org",
    new StaleWhileRevalidate({
        cacheName: "books-api-cache",
        plugins: [
            new ExpirationPlugin({ maxEntries: 50, maxAgeSeconds: 60 * 60 * 24 }),
            new CacheableResponsePlugin({ statuses: [0, 200] }),
        ],
    })
);

// 🔔 Notificações push - o payload é montado em cron/enviar_notificacoes_push.php
// (model/PushNotification.php::enviarParaUsuario), formato
// {titulo, corpo, url}.
self.addEventListener("push", (event) => {
    let dados = {};
    try {
        dados = event.data?.json() ?? {};
    } catch {
        dados = {};
    }

    event.waitUntil(
        self.registration.showNotification(dados.titulo || "Zaldemy", {
            body: dados.corpo || "",
            icon: "/icon-512.png",
            // O badge (ícone pequeno) o Android renderiza só pelo canal alfa,
            // ignorando cor - precisa ser silhueta branca em fundo
            // transparente, senão vira um quadrado sólido sem forma (era o
            // que acontecia usando icon-192.png, que tem fundo opaco).
            badge: "/icon-badge.png",
            data: { url: dados.url || "/home" },
        })
    );
});

self.addEventListener("notificationclick", (event) => {
    event.notification.close();
    event.waitUntil(self.clients.openWindow(event.notification.data?.url || "/home"));
});

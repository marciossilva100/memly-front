import { PushNotifications } from "@capacitor/push-notifications";
import { isNativePlatform } from "./googleNativeAuth";

// Dois mecanismos de notificação, escondidos atrás da mesma API pública
// deste módulo: PWA instalada (navegador) usa Web Push; app nativo
// (Capacitor/Android) usa Firebase Cloud Messaging (FCM), já que a WebView
// do Capacitor não tem suporte a Push API/Service Worker push como uma PWA
// instalada de verdade pelo navegador.
function pwaInstalada() {
    if (isNativePlatform()) return false;
    return window.matchMedia("(display-mode: standalone)").matches || window.navigator.standalone === true;
}

export function notificacoesDisponiveis() {
    if (isNativePlatform()) return true;
    return pwaInstalada() && "serviceWorker" in navigator && "PushManager" in window;
}

// Converte a chave pública VAPID (base64url, como o backend gera) pro
// formato Uint8Array que pushManager.subscribe() exige.
function urlBase64ToUint8Array(base64String) {
    const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
    const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
    const rawData = window.atob(base64);
    return Uint8Array.from([...rawData].map((char) => char.charCodeAt(0)));
}

// ===================== FCM (app nativo Android) =====================

// Guarda o token localmente só pra poder mandar junto na hora de desativar
// (remover_fcm_token) - diferente do Web Push, não dá pra "reconsultar" o
// token FCM atual de forma síncrona sem passar pelo fluxo de registro de novo.
const FCM_TOKEN_STORAGE_KEY = "zaldemy_fcm_token";

async function enviarTokenFcmParaServidor(token) {
    const API_URL = import.meta.env.VITE_API_URL;

    const res = await fetch(`${API_URL}/controller/pushNotifications.php`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "Authorization": "Bearer " + localStorage.getItem("token"),
        },
        body: JSON.stringify({ action: "registrar_fcm_token", token }),
    });

    const data = await res.json().catch(() => null);

    if (!res.ok || !data?.success) {
        throw new Error(data?.message || data?.error || "Não foi possível salvar a notificação no servidor.");
    }

    try {
        localStorage.setItem(FCM_TOKEN_STORAGE_KEY, token);
    } catch {
        // localStorage indisponível - não impede a notificação de funcionar,
        // só perde a conveniência de desativar sem registrar de novo.
    }
}

async function statusNotificacoesNativo() {
    const { receive } = await PushNotifications.checkPermissions();
    return { suportado: true, ativado: receive === "granted", negado: receive === "denied" };
}

async function ativarNotificacoesNativo() {
    const permStatus = await PushNotifications.requestPermissions();

    if (permStatus.receive !== "granted") {
        throw new Error("Permissão de notificação negada.");
    }

    return new Promise((resolve, reject) => {
        let liquidado = false;

        const limpar = () => {
            registrationListener.remove();
            errorListener.remove();
        };

        const registrationListener = PushNotifications.addListener("registration", async (token) => {
            if (liquidado) return;
            liquidado = true;

            try {
                await enviarTokenFcmParaServidor(token.value);
                limpar();
                resolve();
            } catch (err) {
                limpar();
                reject(err);
            }
        });

        const errorListener = PushNotifications.addListener("registrationError", (err) => {
            if (liquidado) return;
            liquidado = true;

            limpar();
            reject(new Error(err?.error || "Erro ao registrar notificação push nativa."));
        });

        PushNotifications.register();
    });
}

async function desativarNotificacoesNativo() {
    let token = null;
    try {
        token = localStorage.getItem(FCM_TOKEN_STORAGE_KEY);
    } catch {
        // segue sem token - nada pra remover do servidor nesse caso
    }

    if (!token) return;

    const API_URL = import.meta.env.VITE_API_URL;
    await fetch(`${API_URL}/controller/pushNotifications.php`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "Authorization": "Bearer " + localStorage.getItem("token"),
        },
        body: JSON.stringify({ action: "remover_fcm_token", token }),
    }).catch(() => { });

    try {
        localStorage.removeItem(FCM_TOKEN_STORAGE_KEY);
    } catch {
        // inofensivo - só não limpa o cache local
    }
}

// ===================== API pública (Web Push + FCM) =====================

export async function statusNotificacoes() {
    if (isNativePlatform()) {
        return statusNotificacoesNativo();
    }

    if (!notificacoesDisponiveis()) {
        return { suportado: false, ativado: false };
    }

    if (Notification.permission === "denied") {
        return { suportado: true, ativado: false, negado: true };
    }

    const registration = await navigator.serviceWorker.ready;
    const subscription = await registration.pushManager.getSubscription();

    return { suportado: true, ativado: !!subscription };
}

async function enviarSubscriptionParaServidor(subscription) {
    const API_URL = import.meta.env.VITE_API_URL;
    const json = subscription.toJSON();

    const res = await fetch(`${API_URL}/controller/pushNotifications.php`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "Authorization": "Bearer " + localStorage.getItem("token"),
        },
        body: JSON.stringify({
            action: "registrar_subscription",
            endpoint: json.endpoint,
            keys: json.keys,
        }),
    });

    // Sem checar a resposta, um 400/401/500 do backend (subscription
    // rejeitada, token expirado, erro de banco) passava batido: o fetch só
    // rejeita em erro de rede, então ativarNotificacoes() "tinha sucesso" e
    // o toggle acendia mesmo com o servidor nunca guardando a subscription -
    // foi exatamente esse o caso do usuário 47 ("Nenhuma notificação ativada
    // nesse dispositivo" ao testar, mesmo com o toggle marcado como ligado).
    const data = await res.json().catch(() => null);

    if (!res.ok || !data?.success) {
        throw new Error(data?.message || data?.error || "Não foi possível salvar a notificação no servidor.");
    }
}

export async function ativarNotificacoes() {
    if (isNativePlatform()) {
        return ativarNotificacoesNativo();
    }

    if (!notificacoesDisponiveis()) {
        throw new Error("Notificações não disponíveis (só funcionam com o PWA instalado).");
    }

    const permissao = await Notification.requestPermission();
    if (permissao !== "granted") {
        throw new Error("Permissão de notificação negada.");
    }

    const registration = await navigator.serviceWorker.ready;
    let subscription = await registration.pushManager.getSubscription();

    if (!subscription) {
        subscription = await registration.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey: urlBase64ToUint8Array(import.meta.env.VITE_VAPID_PUBLIC_KEY),
        });
    }

    await enviarSubscriptionParaServidor(subscription);
}

export async function desativarNotificacoes() {
    if (isNativePlatform()) {
        return desativarNotificacoesNativo();
    }

    if (!notificacoesDisponiveis()) return;

    const registration = await navigator.serviceWorker.ready;
    const subscription = await registration.pushManager.getSubscription();

    if (!subscription) return;

    const endpoint = subscription.endpoint;
    await subscription.unsubscribe();

    const API_URL = import.meta.env.VITE_API_URL;
    await fetch(`${API_URL}/controller/pushNotifications.php`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "Authorization": "Bearer " + localStorage.getItem("token"),
        },
        body: JSON.stringify({ action: "remover_subscription", endpoint }),
    }).catch(() => { });
}

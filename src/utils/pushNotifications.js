import { isNativePlatform } from "./googleNativeAuth";

// Notificações são só pra PWA instalada (adicionada à tela de início) -
// nunca numa aba comum do navegador nem dentro do app nativo (Capacitor
// ainda não tem push nativo configurado, ver plano). "Instalada" aqui
// significa display-mode standalone, sem contar o app nativo (que também
// bate standalone, mas tem seu próprio critério de exclusão).
function pwaInstalada() {
    if (isNativePlatform()) return false;
    return window.matchMedia("(display-mode: standalone)").matches || window.navigator.standalone === true;
}

export function notificacoesDisponiveis() {
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

export async function statusNotificacoes() {
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

    await fetch(`${API_URL}/controller/pushNotifications.php`, {
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
}

export async function ativarNotificacoes() {
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

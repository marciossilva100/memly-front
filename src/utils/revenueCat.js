import { isNativePlatform } from "./googleNativeAuth";

// Identificador do entitlement configurado no dashboard do RevenueCat -
// precisa bater exatamente com o nome criado lá ("premium"). Separado do
// fluxo de assinatura via Stripe (controller/assinatura.php) de propósito -
// são duas fontes de assinatura completamente independentes (web vs
// Android), nunca compartilham estado no frontend. Ver model/RevenueCat.php
// no backend pro lado do webhook.
export const ENTITLEMENT_PREMIUM = "premium";

let configurado = false;
let usuarioAtualId = null;

// Import dinâmico de propósito - o pacote nativo do RevenueCat não deve nem
// ser carregado no bundle web/PWA (só existe implementação real no Android,
// e carregar à toa no boot do app adicionaria peso sem necessidade pra quem
// nunca vai usar essa função). Mesma técnica já usada em
// src/utils/pushNotifications.js pro @capacitor/push-notifications.
async function obterPurchases() {
    const { Purchases } = await import("@revenuecat/purchases-capacitor");
    return Purchases;
}

// Chamado depois de um login bem-sucedido (ver AuthContext.jsx) - garante
// que o RevenueCat sabe QUEM é o usuário atual (appUserID = nosso próprio
// id, não um id anônimo gerado por eles) antes de qualquer compra ou
// consulta de status, pra bater certinho com o app_user_id esperado no
// webhook (ver model/RevenueCat.php).
export async function inicializarRevenueCat(userId) {
    if (!isNativePlatform() || !userId) return;

    const idString = String(userId);
    if (usuarioAtualId === idString) return;

    const apiKey = import.meta.env.VITE_REVENUECAT_ANDROID_API_KEY;
    if (!apiKey) {
        console.error("VITE_REVENUECAT_ANDROID_API_KEY não configurada - compra Premium nativa desabilitada.");
        return;
    }

    try {
        const Purchases = await obterPurchases();

        if (!configurado) {
            await Purchases.configure({ apiKey, appUserID: idString });
            configurado = true;
        } else {
            // Sessão trocou de usuário (logout + login de outra conta) sem
            // reiniciar o app - configure() já rodou antes, usa logIn pra
            // trocar de identidade em vez de configurar de novo.
            await Purchases.logIn({ appUserID: idString });
        }

        usuarioAtualId = idString;
    } catch (err) {
        console.error("Erro ao inicializar RevenueCat:", err);
    }
}

// Limpa a identidade local (não desloga do RevenueCat de verdade - só
// permite que o próximo inicializarRevenueCat() de outro usuário chame
// logIn em vez de ser ignorado por engano) - chamado no logout do app.
export function limparUsuarioRevenueCat() {
    usuarioAtualId = null;
}

// Retorna o pacote (PurchasesPackage) do plano Premium mensal configurado
// no RevenueCat, ou null se não disponível (API fora do ar, produto não
// configurado no Play Console ainda, etc.) - quem chama trata null como
// "não deu pra carregar preço/comprar agora".
export async function obterPacotePremium() {
    if (!isNativePlatform()) return null;

    try {
        const Purchases = await obterPurchases();
        const offerings = await Purchases.getOfferings();
        return offerings?.current?.availablePackages?.[0] ?? null;
    } catch (err) {
        console.error("Erro ao buscar ofertas do RevenueCat:", err);
        return null;
    }
}

// Dispara o fluxo de compra nativo (tela de pagamento do Google Play).
// NUNCA atualiza o plano do usuário aqui no frontend - quem faz isso de
// verdade é o webhook (model/RevenueCat.php), assíncrono. O retorno
// imediato é só pra feedback visual (sucesso/cancelado/erro); o acesso
// Premium passa a valer quando checkAuth() rodar de novo e o backend já
// tiver processado o webhook (ver comentário em PremiumModal.jsx sobre o
// polling curto depois da compra).
export async function comprarPacotePremium(pacote) {
    try {
        const Purchases = await obterPurchases();
        const resultado = await Purchases.purchasePackage({ aPackage: pacote });
        return { sucesso: true, customerInfo: resultado.customerInfo };
    } catch (err) {
        if (err?.userCancelled) {
            return { sucesso: false, cancelado: true };
        }
        console.error("Erro ao comprar pacote Premium:", err);
        return { sucesso: false, cancelado: false, erro: err?.message || "Erro desconhecido na compra." };
    }
}

// Usado só pra feedback otimista na hora (ex: liberar a tela sem esperar o
// próximo checkAuth) - a fonte de verdade de acesso continua sendo
// usuarios.plano no backend, atualizado pelo webhook.
export async function temEntitlementPremiumAtivo() {
    if (!isNativePlatform()) return false;

    try {
        const Purchases = await obterPurchases();
        const { customerInfo } = await Purchases.getCustomerInfo();
        return Boolean(customerInfo?.entitlements?.active?.[ENTITLEMENT_PREMIUM]);
    } catch (err) {
        console.error("Erro ao consultar status Premium no RevenueCat:", err);
        return false;
    }
}

// "Restaurar compras" - obrigatório pela política da Google/Apple pra quem
// reinstalou o app ou trocou de aparelho e já tinha assinatura ativa.
export async function restaurarComprasPremium() {
    try {
        const Purchases = await obterPurchases();
        const { customerInfo } = await Purchases.restorePurchases();
        return { sucesso: true, premiumAtivo: Boolean(customerInfo?.entitlements?.active?.[ENTITLEMENT_PREMIUM]) };
    } catch (err) {
        console.error("Erro ao restaurar compras:", err);
        return { sucesso: false, erro: err?.message || "Erro desconhecido ao restaurar." };
    }
}

import { Capacitor } from '@capacitor/core';
import { SocialLogin } from '@capgo/capacitor-social-login';

// Mesmo client ID web já usado pelo @react-oauth/google (App.jsx),
// exigido pelo Credential Manager do Android mesmo em apps nativos.
const GOOGLE_WEB_CLIENT_ID = '1055075063152-tkobce7c2j9eq1t4doi0419votjlemis.apps.googleusercontent.com';

let initPromise = null;

function ensureInitialized() {
    if (!initPromise) {
        initPromise = SocialLogin.initialize({
            google: { webClientId: GOOGLE_WEB_CLIENT_ID },
        });
    }
    return initPromise;
}

export const isNativePlatform = () => Capacitor.isNativePlatform();

// Detecta navegador mobile (Android/iOS) acessando a versão web/PWA,
// para diferenciar de um desktop (que não tem como instalar/usar o app).
export const isMobileWeb = () => /Android|iPad|iPhone|iPod/i.test(navigator.userAgent);

// App nativo (Capacitor) ou PWA já instalada/aberta em modo standalone.
export const isStandaloneApp = () =>
    isNativePlatform() ||
    window.matchMedia('(display-mode: standalone)').matches ||
    window.navigator.standalone === true;

// Retorna o access_token do Google (mesmo formato que o backend já espera
// de @react-oauth/google) usando o SDK nativo, ou lança em caso de erro/cancelamento.
export async function signInWithGoogleNative() {
    await ensureInitialized();

    // Não passar "scopes" aqui: o plugin já inclui userinfo.email/profile/openid
    // por padrão, e escopos customizados exigem alterar a MainActivity nativa.
    const res = await SocialLogin.login({
        provider: 'google',
    });

    const accessToken = res?.result?.accessToken?.token;

    if (!accessToken) {
        throw new Error('Google não retornou um access_token válido');
    }

    return accessToken;
}

// Fluxo de login Google por redirecionamento de página inteira, usado quando
// o app roda como PWA instalado (standalone). Nesse modo o fluxo de popup do
// Google Identity Services (useGoogleLogin) não funciona: o popup completa o
// login, mas a comunicação de volta via window.opener se perde no contexto
// standalone do Android, deixando o usuário preso na tela de login.
const GOOGLE_CLIENT_ID = "1055075063152-tkobce7c2j9eq1t4doi0419votjlemis.apps.googleusercontent.com";

// Sempre usa /login como redirect_uri, mesmo quando chamado a partir de
// outra tela (ex: Cadastro.jsx) - o backend processa o retorno do Google do
// mesmo jeito (action: login_google) não importa de onde veio, então usar
// uma rota fixa evita ter que cadastrar cada rota nova no Google Cloud
// Console (Authorized redirect URIs) toda vez que um botão de Google surgir
// em outra tela. Sem isso, cada rota nova batia em "Acesso bloqueado" até
// alguém lembrar de liberá-la manualmente no console do Google.
export function startGoogleRedirectLogin() {
    const redirectUri = window.location.origin + "/login";

    const params = new URLSearchParams({
        client_id: GOOGLE_CLIENT_ID,
        redirect_uri: redirectUri,
        response_type: "token",
        scope: "email profile",
        include_granted_scopes: "true",
        prompt: "select_account"
    });

    window.location.href = `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
}

// Checagem não-destrutiva (não mexe na URL) - usada pelo AuthContext pra
// saber se deve ceder a autenticação pro fluxo de redirecionamento do Google
// em vez de rodar a checagem padrão em paralelo (ver comentário em
// AuthContext.jsx sobre a corrida entre os dois).
export function hasGoogleRedirectToken() {
    return window.location.hash.includes("access_token");
}

export function consumeGoogleRedirectToken() {
    if (!window.location.hash.includes("access_token")) return null;

    const params = new URLSearchParams(window.location.hash.substring(1));
    const accessToken = params.get("access_token");

    window.history.replaceState(null, "", window.location.pathname + window.location.search);

    return accessToken;
}

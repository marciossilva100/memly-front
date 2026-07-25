// O evento beforeinstallprompt dispara uma única vez por carregamento de
// página, no momento em que o navegador decide (heurística própria) que o
// app é instalável — e não espera ninguém estar "ouvindo".
//
// Antes, zaldemy.com ia direto para a tela de login, que já registrava o
// listener na primeira pintura da página. Agora a rota "/" é a landing page,
// que não tem esse listener; o usuário só chega em /login ou /cadastrar
// depois via navegação client-side, quando o evento (se disparou logo no
// carregamento inicial) já passou e foi perdido. Por isso o listener precisa
// existir desde o primeiro instante do app, não só quando a tela de
// instalação é montada.
let deferredPrompt = null;
const listeners = new Set();

window.addEventListener("beforeinstallprompt", (e) => {
    e.preventDefault();
    deferredPrompt = e;
    listeners.forEach((callback) => callback(e));
});

window.addEventListener("appinstalled", () => {
    deferredPrompt = null;
});

export function getInstallPrompt() {
    return deferredPrompt;
}

// Registra callback e, se o evento já tiver sido capturado antes do
// componente montar, chama o callback imediatamente com ele.
export function onInstallPromptChange(callback) {
    listeners.add(callback);
    if (deferredPrompt) callback(deferredPrompt);
    return () => listeners.delete(callback);
}

export function clearInstallPrompt() {
    deferredPrompt = null;
}

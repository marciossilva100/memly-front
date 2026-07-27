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
    // O Chrome só dispara esse evento quando NÃO considera o app instalado -
    // se ele disparou de novo, o flag antigo de "já instalado" está errado
    // (ex: usuário desinstalou depois de instalar uma vez) e precisa ser
    // limpo, senão a tela de instalação fica travada pra sempre em "abra
    // pelo ícone" sem nenhuma forma de reinstalar.
    clearPwaInstalled();
    listeners.forEach((callback) => callback(e));
});

window.addEventListener("appinstalled", () => {
    deferredPrompt = null;
    markPwaInstalled();
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

// O navegador só sabe dizer "isso está rodando em modo instalado" (display-mode:
// standalone) quando o app já foi ABERTO pelo ícone instalado - não existe uma
// API pra perguntar "esse app já foi instalado?" enquanto ainda se está numa
// aba comum do navegador. Pra contornar isso, guardamos um flag no localStorage
// assim que detectamos uma instalação (pelo evento appinstalled, ou por já termos
// visto o app rodando em standalone alguma vez), e usamos esse flag depois pra
// não voltar a pedir instalação numa aba comum do navegador - só orientar a
// abrir pelo ícone.
const STORAGE_KEY = "zaldemy_pwa_installed";

export function markPwaInstalled() {
    try {
        localStorage.setItem(STORAGE_KEY, "1");
    } catch {
        // localStorage indisponível (modo privado etc.) - segue sem persistir
    }
}

export function isPwaKnownInstalled() {
    try {
        return localStorage.getItem(STORAGE_KEY) === "1";
    } catch {
        return false;
    }
}

export function clearPwaInstalled() {
    try {
        localStorage.removeItem(STORAGE_KEY);
    } catch {
        // localStorage indisponível (modo privado etc.) - segue sem persistir
    }
}

if (
    window.matchMedia("(display-mode: standalone)").matches ||
    window.navigator.standalone === true
) {
    markPwaInstalled();
}

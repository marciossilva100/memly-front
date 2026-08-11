// fetch() não tem timeout embutido - uma requisição que trava (rede
// instabilizando, ex: logo no boot frio do app) nunca resolve nem rejeita,
// travando pra sempre qualquer código que dependa dela (ver AuthContext.jsx
// checkAuth, que trava a tela inteira em "loading" até esse fetch terminar).
// Aborta via AbortController depois de `ms`, caindo no catch de quem chamou
// como se fosse qualquer outro erro de rede.
export function fetchComTimeout(url, options = {}, ms = 8000) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), ms);

    return fetch(url, { ...options, signal: controller.signal })
        .finally(() => clearTimeout(timer));
}

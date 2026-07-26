// Fallback para h-svh/h-dvh em navegadores sem suporte a essas unidades CSS
// (Safari só ganhou suporte em meados de 2022 - iOS mais antigos não têm).
// Calcula a altura real da viewport visível via JS e expõe como uma custom
// property, recalculando quando a barra de endereço do navegador aparece/some.
//
// window.innerHeight + "resize" não é confiável pra isso no Safari: a barra
// de endereço recolher/aparecer nem sempre dispara "resize" na window (só
// passou a disparar de forma consistente em iOS mais recentes). O jeito
// certo, desde que existe, é o visualViewport - criado justamente pra expor
// a área realmente visível e notificar mudanças nela de forma confiável.
export function setAppVh() {
    const height = window.visualViewport ? window.visualViewport.height : window.innerHeight;
    document.documentElement.style.setProperty("--app-vh", `${height * 0.01}px`);
}

setAppVh();
window.addEventListener("resize", setAppVh);
window.addEventListener("orientationchange", setAppVh);

if (window.visualViewport) {
    window.visualViewport.addEventListener("resize", setAppVh);
    window.visualViewport.addEventListener("scroll", setAppVh);
}

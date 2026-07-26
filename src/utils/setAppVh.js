// Fallback para h-svh/h-dvh em navegadores sem suporte a essas unidades CSS
// (Safari só ganhou suporte em meados de 2022 - iOS mais antigos não têm).
// Calcula a altura real da viewport visível via JS e expõe como uma custom
// property, recalculando quando a barra de endereço do navegador aparece/some.
function setAppVh() {
    document.documentElement.style.setProperty("--app-vh", `${window.innerHeight * 0.01}px`);
}

setAppVh();
window.addEventListener("resize", setAppVh);
window.addEventListener("orientationchange", setAppVh);

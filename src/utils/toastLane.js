// Coordena os avisos laterais globais (AudioSpeedHintBalloon, AudioLimitToast,
// FrasesLimitToast, NivelUpToast) - todos usam a mesma posição fixa (canto
// inferior direito) e cada um decide sozinho quando aparecer, sem saber dos
// outros. Bug real reportado: na primeira visita ao Flashcards, mais de um
// desses avisos podia disparar ao mesmo tempo (ex: dica de velocidade de
// áudio + sugestão de subir de nível) e apareciam sobrepostos na mesma
// posição em vez de um de cada vez. Fila simples em memória (módulo) - só
// libera o próximo quando o atual terminar de sumir.
let ocupado = false;
const fila = [];

// iniciar: função que efetivamente começa a animação de entrada do aviso -
// só é chamada quando é a vez dele. Quem chama precisa avisar quando
// terminar via liberarVez().
export function pedirVez(iniciar) {
    if (!ocupado) {
        ocupado = true;
        iniciar();
    } else {
        fila.push(iniciar);
    }
}

export function liberarVez() {
    ocupado = false;
    const proximo = fila.shift();
    if (proximo) {
        pedirVez(proximo);
    }
}

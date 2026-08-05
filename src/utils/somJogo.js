// Efeitos sonoros do jogo Chuva de Frases, sintetizados via Web Audio API
// (sem arquivo de áudio externo pra baixar/embutir) - um "ding-ding"
// ascendente no estilo dos apps de idioma (Duolingo e afins) pro acerto.
let audioCtx = null;

function getAudioCtx() {
    const Ctx = window.AudioContext || window.webkitAudioContext;
    if (!Ctx) return null;
    if (!audioCtx) audioCtx = new Ctx();
    return audioCtx;
}

function tocarNota(ctx, freq, inicio, duracao, volume) {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = "sine";
    osc.frequency.value = freq;

    gain.gain.setValueAtTime(0, inicio);
    gain.gain.linearRampToValueAtTime(volume, inicio + 0.015);
    gain.gain.exponentialRampToValueAtTime(0.001, inicio + duracao);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(inicio);
    osc.stop(inicio + duracao + 0.02);
}

export function tocarSomAcerto() {
    try {
        const ctx = getAudioCtx();
        if (!ctx) return;
        if (ctx.state === "suspended") ctx.resume();

        const agora = ctx.currentTime;
        // Mi5 -> Lá5: intervalo curto e alegre, duas notas subindo.
        tocarNota(ctx, 659.25, agora, 0.22, 0.22);
        tocarNota(ctx, 880.0, agora + 0.1, 0.28, 0.22);
    } catch {
        // Web Audio indisponível (navegador antigo, contexto bloqueado etc.) -
        // som é só reforço, não essencial ao funcionamento do jogo.
    }
}

// Efeitos sonoros do jogo Chuva de Frases, sintetizados via Web Audio API
// (sem arquivo de áudio externo pra baixar/embutir) - um arpejo agudo tipo
// "moeda"/recompensa (mais brilhante que um ding-ding grave) pro acerto.
let audioCtx = null;

function getAudioCtx() {
    const Ctx = window.AudioContext || window.webkitAudioContext;
    if (!Ctx) return null;
    if (!audioCtx) audioCtx = new Ctx();
    return audioCtx;
}

function tocarNota(ctx, freq, inicio, duracao, volume, tipo = "sine") {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = tipo;
    osc.frequency.value = freq;

    gain.gain.setValueAtTime(0, inicio);
    gain.gain.linearRampToValueAtTime(volume, inicio + 0.012);
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
        // Arpejo ascendente agudo (Dó6, Mi6, Sol6) - tipo "moeda"/recompensa
        // de jogo, bem mais agudo e brilhante que o ding-ding anterior.
        // Onda triangular (mais brilhante que seno) + um harmônico uma
        // oitava acima em volume baixo em cada nota, pra dar um "sparkle".
        const notas = [1046.5, 1318.5, 1568.0];

        notas.forEach((freq, i) => {
            const inicioNota = agora + i * 0.07;
            tocarNota(ctx, freq, inicioNota, 0.18, 0.18, "triangle");
            tocarNota(ctx, freq * 2, inicioNota, 0.14, 0.05, "triangle");
        });
    } catch {
        // Web Audio indisponível (navegador antigo, contexto bloqueado etc.) -
        // som é só reforço, não essencial ao funcionamento do jogo.
    }
}

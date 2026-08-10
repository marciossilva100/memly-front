// Efeitos sonoros dos minijogos (Chuva de Frases e Tiro Certeiro),
// sintetizados via Web Audio API - sem arquivo de áudio externo pra
// baixar/embutir.
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

// Tiro do Tiro Certeiro: "pew" clássico de laser - onda quadrada com
// frequência caindo rápido (exponentialRamp), bem curto pra poder disparar
// em sequência sem sobrepor de forma estranha.
export function tocarSomTiro() {
    try {
        const ctx = getAudioCtx();
        if (!ctx) return;
        if (ctx.state === "suspended") ctx.resume();

        const agora = ctx.currentTime;
        const duracao = 0.12;

        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = "square";
        osc.frequency.setValueAtTime(1100, agora);
        osc.frequency.exponentialRampToValueAtTime(220, agora + duracao);

        gain.gain.setValueAtTime(0.12, agora);
        gain.gain.exponentialRampToValueAtTime(0.001, agora + duracao);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(agora);
        osc.stop(agora + duracao + 0.02);
    } catch {
        // som é só reforço, não essencial ao funcionamento do jogo.
    }
}

// Erro do Tiro Certeiro: buzz curto e grave (2 notas descendo), bem
// diferente do "pew" do tiro e do arpejo agudo do acerto, pra dar feedback
// negativo claro sem soar agressivo demais.
export function tocarSomErro() {
    try {
        const ctx = getAudioCtx();
        if (!ctx) return;
        if (ctx.state === "suspended") ctx.resume();

        const agora = ctx.currentTime;
        tocarNota(ctx, 180, agora, 0.14, 0.14, "sawtooth");
        tocarNota(ctx, 130, agora + 0.1, 0.16, 0.14, "sawtooth");
    } catch {
        // som é só reforço, não essencial ao funcionamento do jogo.
    }
}

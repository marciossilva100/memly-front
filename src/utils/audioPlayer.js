import { dispatchPremiumLimitHit } from "../hooks/usePremiumLimitListener";

let currentAudio = null;
let currentToken = 0;

export const playAudio = async (text, user, ia = false, lang = null) => {
    const API_URL = import.meta.env.VITE_API_URL;
    if (!text) return;

    const voiceLang = lang || user?.learning_language;

    // cancela áudio anterior e invalida qualquer chamada anterior ainda em andamento
    const myToken = ++currentToken;
    if (currentAudio && currentAudio.pause) {
        currentAudio.pause();
    }
    currentAudio = null;

    // Voz natural (ElevenLabs): liberada pro plano premium (1, limite diário)
    // e, como amostra grátis, pro plano limitado (3, limite vitalício) -
    // ambos controlados pelo backend. Se der erro genérico (rede, API fora),
    // cai pra voz padrão abaixo. Mas se o motivo for limite atingido, não
    // reproduz nada - só mostra o modal premium.
    if (user.plano === 1 || user.plano === 3) {
        const resultado = await gerarAudio(text);

        if (resultado?.limiteAtingido) {
            dispatchPremiumLimitHit("audio");
            return;
        }

        if (resultado?.url) {
            // uma chamada mais recente já assumiu o controle enquanto aguardávamos o áudio
            if (myToken !== currentToken) {
                URL.revokeObjectURL(resultado.url);
                return;
            }

            const audio = new Audio(resultado.url);
            currentAudio = audio;

            audio.playbackRate = 0.9;
            audio.play().catch(() => {});

            audio.onended = () => {
                URL.revokeObjectURL(resultado.url);
                currentAudio = null;
            };

            return;
        }
    }

    try {
        const cleanText = text.trim().replace(/^"|"$/g, '');

        const url =
            `${API_URL}/controller/treino.php?action=voice` +
            "&text=" + encodeURIComponent(cleanText) +
            "&lang=" + encodeURIComponent(voiceLang);

        const res = await fetch(url);

        if (!res.ok) {
            throw new Error("Erro HTTP: " + res.status);
        }

        const audios = await res.json();

        console.log("AUDIOS:", audios);

        if (!Array.isArray(audios) || audios.length === 0) {
            console.error("Áudios inválidos:", audios);
            return;
        }

        // uma chamada mais recente já assumiu o controle enquanto buscávamos o áudio
        if (myToken !== currentToken) return;

        // controle de execução
        currentAudio = { playing: true };

        for (const base64 of audios) {

            // se cancelado por uma chamada mais recente
            if (myToken !== currentToken || !currentAudio || currentAudio.playing !== true) break;

            const byteArray = Uint8Array.from(atob(base64), c => c.charCodeAt(0));
            const blob = new Blob([byteArray], { type: "audio/mpeg" });
            const urlAudio = URL.createObjectURL(blob);

            const audio = new Audio(urlAudio);
            currentAudio = audio;

            // A voz padrão (LibreTranslate) não tem parâmetro de velocidade
            // na API, então aplicamos no player - disponível em qualquer
            // plano, diferente da escolha de voz (só premium).
            const velocidadePreferida = parseFloat(localStorage.getItem('zaldemy_velocidade_tts'));
            audio.playbackRate = Number.isFinite(velocidadePreferida) ? velocidadePreferida : 1.0;

            await audio.play().catch(err => {
                console.error("ERRO PLAY:", err);
            });

            await new Promise(resolve => {
                audio.onended = resolve;
                audio.onerror = resolve;
            });

            URL.revokeObjectURL(urlAudio);
        }

        if (myToken === currentToken) {
            currentAudio = null;
        }

    } catch (err) {
        console.error("Erro ao tocar áudio:", err);
        if (myToken === currentToken) {
            currentAudio = null;
        }
    }
};

// Retorna { limiteAtingido: true }, { url } ou null (erro genérico - cai
// pro fallback de voz padrão).
const gerarAudio = async (texto) => {
    const API_URL = import.meta.env.VITE_API_URL;

    try {
        const res = await fetch(`${API_URL}/controller/tts.php`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": "Bearer " + localStorage.getItem("token")
            },
            body: JSON.stringify({
                action: "stream_audio",
                texto: texto
            })
        });

        if (!res.ok) {
            throw new Error("Erro HTTP: " + res.status);
        }

        const contentType = res.headers.get("content-type");

        if (!contentType || !contentType.includes("audio")) {
            const text = await res.text();
            console.error("Resposta não é áudio:", text);

            try {
                const data = JSON.parse(text);
                if (data.limite_atingido) {
                    return { limiteAtingido: true };
                }
            } catch {
                // resposta não era JSON - segue pro fallback normal abaixo
            }

            throw new Error("API não retornou áudio");
        }

        const blob = await res.blob();

        if (blob.size === 0) {
            throw new Error("Áudio vazio");
        }

        return { url: URL.createObjectURL(blob) };

    } catch (err) {
        console.error("Erro ao gerar áudio:", err);
        return null;
    }
};
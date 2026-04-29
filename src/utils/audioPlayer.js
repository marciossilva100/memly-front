let currentAudio = null;

export const playAudio = async (text, user, ia = false) => {
    const API_URL = import.meta.env.VITE_API_URL;
    if (!text) return;

    // cancela áudio anterior
    if (currentAudio && currentAudio.pause) {
        currentAudio.pause();
        currentAudio = null;
    }

    // fluxo ElevenLabs (mantido)
    // if (user.plano === 1 && user.id === 47 && !ia) {
    if (user.plano === 1 && user.id === 47) {
        const url = await gerarAudio(text);
        if (!url) return;

        const audio = new Audio(url);
        currentAudio = audio;

        audio.playbackRate = 0.9;
        audio.play().catch(() => {});

        audio.onended = () => {
            URL.revokeObjectURL(url);
            currentAudio = null;
        };

        return;
    }

    try {
        const cleanText = text.trim().replace(/^"|"$/g, '');

        const url =
            `${API_URL}/controller/treino.php?action=voice` +
            "&text=" + encodeURIComponent(cleanText) +
            "&lang=" + encodeURIComponent(user.learning_language);

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

        // controle de execução
        currentAudio = { playing: true };

        for (const base64 of audios) {

            // se cancelado
            if (!currentAudio || currentAudio.playing !== true) break;

            const byteArray = Uint8Array.from(atob(base64), c => c.charCodeAt(0));
            const blob = new Blob([byteArray], { type: "audio/mpeg" });
            const urlAudio = URL.createObjectURL(blob);

            const audio = new Audio(urlAudio);
            currentAudio = audio;

            audio.playbackRate = 1.0;

            await audio.play().catch(err => {
                console.error("ERRO PLAY:", err);
            });

            await new Promise(resolve => {
                audio.onended = resolve;
                audio.onerror = resolve;
            });

            URL.revokeObjectURL(urlAudio);
        }

        currentAudio = null;

    } catch (err) {
        console.error("Erro ao tocar áudio:", err);
        currentAudio = null;
    }
};

const gerarAudio = async (texto) => {
    const API_URL = import.meta.env.VITE_API_URL;

    try {
        const res = await fetch(`${API_URL}/controller/elevenlabs.php`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
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
            throw new Error("API não retornou áudio");
        }

        const blob = await res.blob();

        if (blob.size === 0) {
            throw new Error("Áudio vazio");
        }

        return URL.createObjectURL(blob);

    } catch (err) {
        console.error("Erro ao gerar áudio:", err);
        return null;
    }
};
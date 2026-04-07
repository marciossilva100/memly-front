let currentAudio = null;

export const playAudio = async (text, user,ia = false) => {
    const API_URL = import.meta.env.VITE_API_URL;
    if (!text) return;

    // cancela áudio anterior
    if (currentAudio) {
        currentAudio.pause();
        currentAudio = null;
    }

    // if (user.plano === 1 && user.id === 47 && !ia) {
    if (user.plano === 1 && user.id === 47 && !ia) {
        const url = await gerarAudio(text);
        if (!url) return;

        const audio = new Audio(url);
        currentAudio = audio;

        audio.playbackRate = 0.9;
        audio.play().catch(() => { });

        audio.onended = () => {
            URL.revokeObjectURL(url);
            currentAudio = null;
        };

        return;
    }

    const url =
    `${API_URL}/controller/treino.php?action=voice` +
    "&text=" + encodeURIComponent(text) +
    "&lang=" + encodeURIComponent(user.learning_language);

    const audio = new Audio();
    audio.src = url;
    audio.playbackRate = 1.2;

    currentAudio = audio;

    audio.play().catch(() => { });
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
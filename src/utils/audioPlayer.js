let currentAudio = null;

export const playAudio = async (text, user, ia = false) => {
    console.log('1. playAudio chamado', { text, user: user?.plano, ia });
    
    if (!text) {
        console.log('2. texto vazio');
        return;
    }

    if (currentAudio) {
        console.log('3. cancelando audio anterior');
        currentAudio.pause();
        currentAudio = null;
    }

    if (user.plano === 1 && user.id === 47 && !ia) {
        console.log('4. usando elevenlabs');
        const url = await gerarAudio(text);
        console.log('5. url gerada:', url);
        if (!url) return;

        const audio = new Audio(url);
        currentAudio = audio;
        audio.playbackRate = 0.9;
        
        audio.play()
            .then(() => console.log('6. ✅ audio tocando'))
            .catch(err => console.log('6. ❌ erro no play:', err));
        
        audio.onended = () => {
            URL.revokeObjectURL(url);
            currentAudio = null;
            console.log('7. audio finalizado');
        };
        return;
    }

    console.log('8. usando endpoint padrao');
    const url = "/api/controller/treino.php?action=voice" +
        "&text=" + encodeURIComponent(text) +
        "&lang=" + encodeURIComponent(user.learning_language);
    
    console.log('9. url:', url);
    
    const audio = new Audio();
    audio.src = url;
    audio.playbackRate = 1;
    currentAudio = audio;

    audio.play()
        .then(() => console.log('10. ✅ audio tocando'))
        .catch(err => console.log('10. ❌ erro no play:', err));
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
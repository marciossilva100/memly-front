import { useCallback, useEffect, useRef, useState } from "react";

// Hook compartilhado de gravação de áudio (Frase do Dia e Perguntas).
// Usa MediaRecorder + getUserMedia - não existia nada parecido no projeto
// antes disso.

const DURACAO_MAXIMA_MS = 60000; // 60s - evita gravação infinita

export default function useAudioRecorder() {
    const [gravando, setGravando] = useState(false);
    const [audioBlob, setAudioBlob] = useState(null);
    const [audioUrl, setAudioUrl] = useState(null);
    const [erro, setErro] = useState(null);

    const mediaRecorderRef = useRef(null);
    const chunksRef = useRef([]);
    const streamRef = useRef(null);
    const timeoutRef = useRef(null);

    const pararGravacao = useCallback((motivo) => {
        if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
            timeoutRef.current = null;
        }
        if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
            mediaRecorderRef.current.stop();
        }
        setGravando(false);
        if (motivo === "duracao_maxima") {
            setErro("Gravação parada automaticamente após 60 segundos.");
        }
    }, []);

    const iniciarGravacao = useCallback(async () => {
        setErro(null);
        setAudioBlob(null);
        setAudioUrl(null);

        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            streamRef.current = stream;

            const mediaRecorder = new MediaRecorder(stream);
            chunksRef.current = [];

            mediaRecorder.ondataavailable = (e) => {
                if (e.data.size > 0) chunksRef.current.push(e.data);
            };

            mediaRecorder.onstop = () => {
                const blob = new Blob(chunksRef.current, { type: mediaRecorder.mimeType });
                setAudioBlob(blob);
                setAudioUrl(URL.createObjectURL(blob));
                streamRef.current?.getTracks().forEach((track) => track.stop());
                streamRef.current = null;
            };

            mediaRecorderRef.current = mediaRecorder;
            mediaRecorder.start();
            setGravando(true);

            timeoutRef.current = setTimeout(() => {
                pararGravacao("duracao_maxima");
            }, DURACAO_MAXIMA_MS);
        } catch (err) {
            console.error("Erro ao acessar microfone:", err);
            setErro("Não foi possível acessar o microfone. Verifique as permissões do navegador.");
        }
    }, [pararGravacao]);

    const limpar = useCallback(() => {
        if (audioUrl) URL.revokeObjectURL(audioUrl);
        setAudioBlob(null);
        setAudioUrl(null);
        setErro(null);
    }, [audioUrl]);

    useEffect(() => {
        return () => {
            if (timeoutRef.current) clearTimeout(timeoutRef.current);
        };
    }, []);

    return { gravando, audioBlob, audioUrl, erro, iniciarGravacao, pararGravacao, limpar };
}

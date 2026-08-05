import { useEffect } from "react";

export const AUDIO_SPEED_HINT_EVENT = "zaldemy:primeiro-audio";
const CHAVE_JA_VISTO = "zaldemy_dica_velocidade_audio_vista";

// Dispara só na primeira vez de verdade (marca localStorage antes de
// disparar, síncrono, sem gap - chamadas concorrentes não duplicam o evento).
export function dispatchPrimeiroAudio() {
    if (localStorage.getItem(CHAVE_JA_VISTO)) return;
    localStorage.setItem(CHAVE_JA_VISTO, "1");
    window.dispatchEvent(new CustomEvent(AUDIO_SPEED_HINT_EVENT));
}

// Escuta o evento global disparado por utils/audioPlayer.js na primeira
// reprodução de áudio real do usuário (treino, perguntas, frases por IA) -
// usado porque playAudio é chamado de vários lugares diferentes (não só
// componentes), sem acesso direto ao estado de um balão local por tela.
export default function useAudioSpeedHintListener(onPrimeiroAudio) {
    useEffect(() => {
        function handler() {
            onPrimeiroAudio();
        }

        window.addEventListener(AUDIO_SPEED_HINT_EVENT, handler);
        return () => window.removeEventListener(AUDIO_SPEED_HINT_EVENT, handler);
    }, [onPrimeiroAudio]);
}

import { useEffect } from "react";

export const AUDIO_SPEED_HINT_EVENT = "zaldemy:primeiro-audio";

// Por usuário (não por dispositivo) - mesmo padrão de chaveAvisoLimiteAudio
// em audioPlayer.js. Sem o user_id na chave, a dica "aparece uma única vez
// na vida do usuário" na prática virava "uma única vez por aparelho": num
// dispositivo compartilhado/de teste que já viu a dica com QUALQUER conta,
// um usuário genuinamente novo nunca chegava a ver a dica na própria
// primeira reprodução de áudio.
function chaveJaVisto(user) {
    return `zaldemy_dica_velocidade_audio_vista_${user?.id ?? "anon"}`;
}

// Dispara só na primeira vez de verdade (marca localStorage antes de
// disparar, síncrono, sem gap - chamadas concorrentes não duplicam o evento).
export function dispatchPrimeiroAudio(user) {
    const chave = chaveJaVisto(user);
    if (localStorage.getItem(chave)) return;
    localStorage.setItem(chave, "1");
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

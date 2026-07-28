import { useEffect } from "react";

export const PREMIUM_LIMIT_EVENT = "zaldemy:premium-limit-hit";

export function dispatchPremiumLimitHit(motivo) {
    window.dispatchEvent(new CustomEvent(PREMIUM_LIMIT_EVENT, { detail: { motivo } }));
}

// Escuta o evento global disparado quando um recurso limitado (ex: cota de
// áudio do ElevenLabs) esgota - usado porque essa checagem acontece dentro de
// utilitários chamados de vários lugares (não componentes), sem acesso direto
// ao estado local de cada página que possui seu próprio PremiumModal.
export default function usePremiumLimitListener(onLimitHit) {
    useEffect(() => {
        function handler(e) {
            onLimitHit(e.detail?.motivo);
        }

        window.addEventListener(PREMIUM_LIMIT_EVENT, handler);
        return () => window.removeEventListener(PREMIUM_LIMIT_EVENT, handler);
    }, [onLimitHit]);
}

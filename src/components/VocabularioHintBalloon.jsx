import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useAuth } from "../context/AuthContext";

// Inclui o user_id porque o localStorage é por aparelho, não por conta -
// sem isso, uma conta nova testada no mesmo aparelho de uma conta que já
// viu o balão nunca seria avisada na própria primeira vez (mesmo motivo já
// documentado em utils/audioPlayer.js pros avisos de lá).
function chaveDicaVocabulario(user) {
    return `zaldemy_dica_vocabulario_exibida_${user?.id ?? "anon"}`;
}

// Dica contextual apontando pro botão "Ver palavras que já estudo" - some
// pra sempre depois da primeira exibição (localStorage, não por sessão),
// compartilhada entre Perguntas.jsx e treinoIA.jsx (mesma dica, mesmo botão,
// mesmo comportamento nas duas telas - um usuário que já viu numa não
// precisa ver de novo na outra). Precisa ser renderizado dentro de um
// container com position:relative (o wrapper do botão) pra se posicionar
// certo.
//
// Sem timer de auto-esconder de propósito - um balão secundário abaixo de
// um botão que não é o foco principal da tela, sumindo sozinho em poucos
// segundos, passava despercebido fácil (confirmado testando: até com o
// balão renderizando certinho, a janela curta fazia perder o momento). Fica
// até o usuário tocar nele pra fechar.
export default function VocabularioHintBalloon() {
    const { t } = useTranslation();
    const { user } = useAuth();
    const [visivel, setVisivel] = useState(false);

    useEffect(() => {
        if (!user) return;
        const chave = chaveDicaVocabulario(user);
        if (localStorage.getItem(chave)) return;
        localStorage.setItem(chave, "1");

        // setState fora do corpo síncrono do efeito (mesmo padrão usado nos
        // outros balões desse tipo, ver AudioSpeedHintBalloon.jsx) - evita o
        // aviso de cascading render do lint por chamar setState direto no
        // corpo do useEffect.
        const raf = requestAnimationFrame(() => setVisivel(true));
        return () => cancelAnimationFrame(raf);
    }, [user]);

    if (!visivel) return null;

    return (
        <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2.5 z-40 w-56 max-w-[75vw]">
            <div className="absolute -top-1.5 left-1/2 -translate-x-1/2 w-3 h-3 bg-orange-500 rotate-45" />
            <button
                type="button"
                onClick={() => setVisivel(false)}
                className="relative w-full bg-gradient-to-br from-amber-400 via-orange-500 to-red-500 border border-white/15 text-white text-xs font-bold rounded-xl px-3 py-2 text-center shadow-lg"
            >
                {t("vocabulary_hint_balloon")}
            </button>
        </div>
    );
}

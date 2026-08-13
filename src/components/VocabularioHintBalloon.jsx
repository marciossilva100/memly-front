import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

const CHAVE = "zaldemy_dica_vocabulario_exibida";
const DURACAO_VISIVEL_MS = 6000;

// Dica contextual apontando pro botão "Ver palavras que já estudo" - some
// pra sempre depois da primeira exibição (localStorage, não por sessão),
// compartilhada entre Perguntas.jsx e treinoIA.jsx (mesma dica, mesmo botão,
// mesmo comportamento nas duas telas - um usuário que já viu numa não
// precisa ver de novo na outra). Precisa ser renderizado dentro de um
// container com position:relative (o wrapper do botão) pra se posicionar
// certo.
export default function VocabularioHintBalloon() {
    const { t } = useTranslation();
    const [visivel, setVisivel] = useState(false);

    useEffect(() => {
        if (localStorage.getItem(CHAVE)) return;
        localStorage.setItem(CHAVE, "1");

        // setState fora do corpo síncrono do efeito (mesmo padrão usado nos
        // outros balões desse tipo, ver AudioSpeedHintBalloon.jsx) - evita o
        // aviso de cascading render do lint por chamar setState direto no
        // corpo do useEffect.
        const raf = requestAnimationFrame(() => setVisivel(true));
        return () => cancelAnimationFrame(raf);
    }, []);

    useEffect(() => {
        if (!visivel) return;
        const timer = setTimeout(() => setVisivel(false), DURACAO_VISIVEL_MS);
        return () => clearTimeout(timer);
    }, [visivel]);

    if (!visivel) return null;

    return (
        <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2.5 z-40 w-56 max-w-[75vw]">
            <div className="absolute -top-1.5 left-1/2 -translate-x-1/2 w-3 h-3 bg-orange-400 rotate-45" />
            <button
                type="button"
                onClick={() => setVisivel(false)}
                className="relative w-full bg-orange-400 border border-white/15 text-white text-xs font-bold rounded-xl px-3 py-2 text-center shadow-lg"
            >
                {t("vocabulary_hint_balloon")}
            </button>
        </div>
    );
}

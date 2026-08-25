import { useEffect, useState, useRef } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { Clock } from "lucide-react";
import { useAuth } from "../context/AuthContext";

const DURACAO_VISIVEL_MS = 4500;
const DURACAO_TRANSICAO_MS = 350;

function chaveDica(userId) {
    return `zaldemy_dica_tempo_virada_vista_${userId ?? "anon"}`;
}

// Aviso único na vida do usuário, na primeira vez que abre Flashcards.jsx -
// mesmo visual/comportamento de AudioSpeedHintBalloon (cartão lateral que
// desliza entrando/saindo), mas em bottom-52 em vez de bottom-28: essa tela
// também pode disparar o aviso de velocidade de áudio (ao clicar em
// "Ouvir") ao mesmo tempo - um offset diferente evita os dois avisos se
// sobrepondo na mesma posição da tela.
export default function FlipTimeHintBalloon() {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const { user } = useAuth();
    const [estado, setEstado] = useState("escondido"); // escondido | entrando | visivel | saindo
    const timeoutsRef = useRef([]);

    useEffect(() => {
        if (!user?.id) return;
        const chave = chaveDica(user.id);
        if (localStorage.getItem(chave)) return;
        localStorage.setItem(chave, "1");

        // setState assíncrono (mesmo dentro de um mount de verdade) evita
        // cascata de render síncrona durante o efeito - mesma ideia de
        // AudioSpeedHintBalloon, que só chama setEstado de dentro de um
        // callback de evento, nunca direto no corpo do efeito.
        const timeoutEntrada = setTimeout(() => {
            setEstado("entrando");

            requestAnimationFrame(() => {
                requestAnimationFrame(() => setEstado("visivel"));
            });
        }, 0);

        timeoutsRef.current = [
            timeoutEntrada,
            setTimeout(() => setEstado("saindo"), DURACAO_VISIVEL_MS),
            setTimeout(() => setEstado("escondido"), DURACAO_VISIVEL_MS + DURACAO_TRANSICAO_MS),
        ];

        return () => timeoutsRef.current.forEach(clearTimeout);
    }, [user?.id]);

    if (estado === "escondido") return null;

    const dentro = estado === "visivel";

    return (
        <div
            className={`fixed z-50 bottom-52 right-4 w-64 max-w-[75vw] transition-transform ease-out ${dentro ? "translate-x-0" : "translate-x-[130%]"
                }`}
            style={{ transitionDuration: `${DURACAO_TRANSICAO_MS}ms` }}
        >
            <button
                type="button"
                onClick={() => { setEstado("saindo"); navigate("/configuracoes"); }}
                className="w-full flex items-start gap-2 bg-gradient-to-br from-amber-400 via-orange-500 to-red-500 border border-white/15 text-white text-sm font-bold px-4 py-3 rounded-xl shadow-lg text-left"
            >
                <Clock className="w-4 h-4 shrink-0 mt-0.5 text-white" />
                <span>{t("flip_time_hint")}</span>
            </button>
        </div>
    );
}

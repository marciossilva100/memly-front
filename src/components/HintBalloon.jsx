import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";

// Inclui o user_id porque o localStorage é por aparelho, não por conta -
// sem isso, uma conta nova testada no mesmo aparelho de uma conta que já
// viu o balão nunca seria avisada na própria primeira vez (mesmo motivo já
// documentado em utils/audioPlayer.js pros avisos de lá).
function chaveDica(storageKey, userId) {
    return `${storageKey}_${userId ?? "anon"}`;
}

// Memoriza, por chave, a decisão de mostrar ou não já tomada NESTA carga de
// página (variável de módulo - sobrevive a qualquer remontagem do
// componente, ao contrário do estado do React). Alguma parte da árvore de
// componentes acima (rota/auth/etc) remonta esse componente uma vez pouco
// depois do primeiro mount, mesmo sem ele nunca desmontar de verdade do
// ponto de vista do usuário - sem essa memória, a 2ª montagem reconsultava
// o localStorage, já marcado "visto" pela 1ª montagem, e desistia de
// mostrar o balão pra sempre (reproduzido testando de verdade, com
// console.log em cada mount/unmount). Reaproveitar a decisão da 1ª
// montagem em qualquer remontagem seguinte é robusto independente da causa
// exata dessa remontagem.
const decisaoNestaCarga = new Map();

// Balão de dica contextual genérico - some pra sempre depois da primeira
// exibição (localStorage, não por sessão). Precisa ser renderizado dentro
// de um container com position:relative (o wrapper do elemento apontado)
// pra se posicionar certo. storageKey identifica QUAL dica é (cada uso
// precisa de uma chave própria, ex: "zaldemy_dica_vocabulario_exibida").
//
// Sem timer de auto-esconder de propósito - um balão secundário abaixo de
// um elemento que não é o foco principal da tela, sumindo sozinho em poucos
// segundos, passava despercebido fácil. Fica até o usuário tocar nele pra
// fechar.
export default function HintBalloon({ storageKey, children, direcao = "baixo", fecharAoInteragir = false }) {
    const { user } = useAuth();
    const userId = user?.id;

    const [visivel, setVisivel] = useState(() => {
        if (!userId) return false;
        const chave = chaveDica(storageKey, userId);

        if (decisaoNestaCarga.has(chave)) {
            return decisaoNestaCarga.get(chave);
        }

        const mostrar = !localStorage.getItem(chave);
        decisaoNestaCarga.set(chave, mostrar);
        return mostrar;
    });

    // Só grava a flag (idempotente - gravar "1" de novo não tem efeito
    // colateral nenhum) - nunca decide visibilidade aqui, então reexecutar
    // esse efeito por qualquer motivo é inofensivo.
    useEffect(() => {
        if (userId && visivel) {
            localStorage.setItem(chaveDica(storageKey, userId), "1");
        }
    }, [userId, visivel, storageKey]);

    // fecharAoInteragir - some também com qualquer clique na tela, não só
    // tocando o balão em si (mesmo padrão já usado no guia de "criar
    // primeira categoria" na Home). Opcional (default false) pra não mudar
    // o comportamento de quem já usa esse componente esperando só o toque
    // direto fechar (Perguntas.jsx/treinoIA.jsx).
    useEffect(() => {
        if (!fecharAoInteragir || !visivel) return;

        function handleInteracao() {
            setVisivel(false);
        }

        document.addEventListener("click", handleInteracao);
        return () => document.removeEventListener("click", handleInteracao);
    }, [fecharAoInteragir, visivel]);

    if (!visivel) return null;

    // direcao="cima" - pro caso do elemento apontado ficar colado na borda
    // inferior da tela (ex: botão fixo no rodapé), onde um balão abrindo pra
    // baixo sairia da viewport.
    const posicao = direcao === "cima"
        ? "bottom-full mb-2.5"
        : "top-full mt-2.5";
    const setaPosicao = direcao === "cima"
        ? "-bottom-1.5"
        : "-top-1.5";

    return (
        <div className={`absolute ${posicao} left-1/2 -translate-x-1/2 z-40 w-56 max-w-[75vw]`}>
            <div className={`absolute ${setaPosicao} left-1/2 -translate-x-1/2 w-3 h-3 bg-orange-500 rotate-45`} />
            <button
                type="button"
                onClick={() => setVisivel(false)}
                className="relative w-full bg-gradient-to-br from-amber-400 via-orange-500 to-red-500 border border-white/15 text-white text-xs font-bold rounded-xl px-3 py-2 text-center shadow-lg"
            >
                {children}
            </button>
        </div>
    );
}

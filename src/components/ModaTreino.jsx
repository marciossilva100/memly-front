import { Dialog } from "@headlessui/react";
import { Play, Repeat, Check, Clock, ChevronRight, Sparkles, X, BookOpen } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { treinoStatsCache } from "../utils/treinoStatsCache";
import { useTranslation } from "react-i18next";
import { Trans } from "react-i18next";

export default function ModalTreino({
  openTreino,
  onClose,
  onOpenPremium,
  onOpenAdvinhar,
  onOpenIA,
  categoriaId
}) {
  const { t } = useTranslation();

  const navigate = useNavigate();

  // Só o texto da contagem regressiva ("próximo treino em Xmin") - null
  // quando não está esperando, pra cair na descrição padrão da opção em vez
  // de precisar de um valor "vazio" artificial.
  const [mensagemEspera, setMensagemEspera] = useState(null);
  const { user } = useAuth();
  const [waiting, setWaiting] = useState(false);
  const API_URL = import.meta.env.VITE_API_URL;
  const [countPhrases, setCountPhrases] = useState({
    learn: 0,
    repeat: 0,
    repeat_traine: 0,
    review: 0,
    traine: null
  });
  const statsCache = useRef({});

  // =========================
  // BUSCAR DADOS DO TREINO
  // =========================
  useEffect(() => {

    if (!openTreino) return;

    // Home.jsx já busca esses mesmos dados pra toda categoria assim que a
    // lista carrega (pros badges dos cards) e guarda no cache compartilhado -
    // se já tiver chegado, mostra na hora, sem o "pisca zerado" de antes.
    const cached = statsCache.current[categoriaId] ?? treinoStatsCache.get(categoriaId);

    if (cached) {
      // Mostra o dado já conhecido na hora, sem esperar a rede
      setCountPhrases(cached);
    }

    fetch(`${API_URL}/controller/treino.php`, {
      method: "POST",
      headers: {
        "Authorization": "Bearer " + localStorage.getItem("token")
      },
      body: JSON.stringify({
        action: "training_stats",
        category_id: categoriaId
      })
    })
      .then(res => res.json())
      .then(data => {

        const repeat =
          (data.data?.[1]?.total ?? 0) +
          (data.data?.[2]?.total ?? 0);

        const newState = {
          learn: data.data?.[0]?.total ?? 0,
          repeat: repeat,
          repeat_traine: data.data?.[2]?.total ?? 0, // em_treino
          review: data.data?.[3]?.total ?? 0,
          traine: data.data?.[1]?.segundos_restantes ?? 0
        };

        statsCache.current[categoriaId] = newState;
        treinoStatsCache.set(categoriaId, newState);
        setCountPhrases(newState);

      })
      .catch(err => {
        console.error("Erro ao buscar treino:", err);
      });

  }, [categoriaId, openTreino]);



  // =========================
  // TIMER DE TREINO
  // =========================
  useEffect(() => {

    if (countPhrases.repeat_traine > 0) {
      setMensagemEspera(null);
      setWaiting(false);
      return;
    }

    if (!countPhrases.traine || countPhrases.repeat < 1) {
      setMensagemEspera(null);
      setWaiting(false);
      return;
    }

    let seconds = countPhrases.traine;

    function atualizar() {

      if (seconds <= 0) {
        setMensagemEspera(null);
        setWaiting(false);
        return;
      }

      const hours = Math.floor(seconds / 3600);
      const minutes = Math.floor((seconds % 3600) / 60);
      const sec = seconds % 60;

      if (hours > 0) {
        setMensagemEspera(t("next_training_hours", { hours, minutes }));
        setWaiting(true);
      }
      else if (minutes > 0) {
        setMensagemEspera(t("next_training_minutes", { minutes, sec }));
        setWaiting(true);
      }
      else {
        setMensagemEspera(t("remaining_seconds", { sec }));
        setWaiting(true);
      }

      seconds--;

    }

    atualizar();

    const interval = setInterval(atualizar, 1000);

    return () => clearInterval(interval);

  }, [countPhrases]);



  // =========================
  // RESET QUANDO FECHA MODAL
  // =========================
  useEffect(() => {

    if (!openTreino) {

      setCountPhrases({
        learn: 0,
        repeat: 0,
        repeat_traine: 0,
        review: 0,
        traine: null
      });

    }

  }, [openTreino]);

  // =========================
  // UPDATE TREINO
  // =========================
  function updateTraine() {

    fetch(`${API_URL}/controller/treino.php`, {
      method: "POST",
      headers: {
        "Authorization": "Bearer " + localStorage.getItem("token")
      },
      body: JSON.stringify({
        action: "update_repeat",
        category_id: categoriaId
      })
    })
      .then(res => res.json())
      .then(data => {

        if (!data.success) {
          console.error("Erro ao atualizar treino");
        }

      })
      .catch(err => {
        console.error("Erro:", err);
      });

  }


  function go(endpoint, leng) {

    if (leng > 0) {
      navigate(endpoint);
    }

  }

  function clicarRepetir() {
    if (countPhrases.repeat > 0 && !waiting) {
      updateTraine();
      onOpenAdvinhar();
    }
  }

  function abrirTreinoIA() {
    onClose();
    onOpenIA();
  }

  // Repetir fica desabilitado (visualmente, não só no clique) quando ainda
  // não tem frase nenhuma pra repetir, ou quando a próxima liberação ainda
  // não chegou - antes o botão parecia sempre clicável mesmo bloqueado,
  // sem nenhuma pista visual do motivo (reportado: "parece clicável mas
  // não faz nada").
  const repetirDesabilitado = countPhrases.repeat < 1 || waiting;

  const opcoes = [
    {
      icon: Play,
      cor: "text-blue-400",
      fundo: "bg-blue-400/10 border-blue-400/30",
      titulo: t("learn"),
      descricao: t("learn_training_desc"),
      contagem: countPhrases.learn,
      disabled: countPhrases.learn < 1,
      onClick: () => go(`/digitartexto/${categoriaId}/learn`, countPhrases.learn),
    },
    {
      icon: repetirDesabilitado && waiting ? Clock : Repeat,
      cor: "text-purple-400",
      fundo: "bg-purple-400/10 border-purple-400/30",
      titulo: t("repeat"),
      descricao: mensagemEspera ?? t("repeat_training_desc"),
      contagem: countPhrases.repeat,
      disabled: repetirDesabilitado,
      onClick: clicarRepetir,
    },
    {
      icon: Check,
      cor: "text-green-400",
      fundo: "bg-green-400/10 border-green-400/30",
      // components precisa receber elementos React de verdade (não uma
      // string) - usar "" aqui quebrava com "Element type is invalid"
      // (confirmado ao testar). Fragmento vazio no lugar da <br/> original,
      // já que o card novo é largo o bastante pra não precisar da quebra.
      titulo: <Trans i18nKey="review_learned_words" components={{ br: <></> }} />,
      descricao: t("review_training_desc"),
      contagem: countPhrases.review,
      disabled: countPhrases.review < 1,
      onClick: () => go(`/flashcards/${categoriaId}/review`, countPhrases.review),
    },
  ];

  return (
    <Dialog
      open={openTreino}
      onClose={onClose}
      className="relative z-50"
    >

      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" />

      <div className="fixed inset-0 flex items-center justify-center p-4">

        <Dialog.Panel className="relative w-full max-w-sm rounded-2xl bg-gradient-to-br from-gray-900 to-gray-800 border border-gray-700 p-5 shadow-2xl">

          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-2 mb-5">
            <BookOpen className="w-5 h-5 text-[#4cb8c4]" />
            <Dialog.Title className="text-lg font-semibold text-white">
              {t("training")}
            </Dialog.Title>
          </div>

          <div className="flex flex-col gap-3">
            {opcoes.map((opcao, i) => (
              <button
                key={i}
                type="button"
                disabled={opcao.disabled}
                onClick={opcao.onClick}
                className="relative flex items-center gap-3 p-3 rounded-xl border border-gray-700 bg-gray-800/50 hover:bg-gray-700/50 hover:border-gray-600 transition-colors text-left disabled:opacity-50 disabled:hover:bg-gray-800/50 disabled:hover:border-gray-700 disabled:cursor-not-allowed"
              >
                <div className={`flex items-center justify-center w-11 h-11 shrink-0 rounded-full border ${opcao.fundo}`}>
                  <opcao.icon className={`w-5 h-5 ${opcao.cor}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-white font-medium leading-tight">{opcao.titulo}</p>
                  <p className="text-gray-400 text-xs mt-0.5 leading-snug">{opcao.descricao}</p>
                </div>
                <div className="flex flex-col items-end gap-1 shrink-0">
                  <span className="text-xs text-gray-400">{opcao.contagem} {t("words")}</span>
                  <ChevronRight className="w-4 h-4 text-gray-500" />
                </div>
              </button>
            ))}
          </div>

          {/* Ponte pro Treino com IA - reativada (existia antes, comentada/
              desativada), mas sem virar uma 4ª opção igual às outras: visual
              mais discreto, separado por uma divisória, porque esse recurso
              não é "desta categoria" (puxa de várias categorias elegíveis,
              tem cota diária própria) - ver discussão sobre a Home. Só a
              ponte de descoberta estava faltando, não a identidade de
              recurso à parte. */}
          <div className="mt-4 pt-4 border-t border-gray-800">
            <button
              type="button"
              onClick={abrirTreinoIA}
              className="w-full flex items-center justify-center gap-2 text-sm text-gray-400 hover:text-[#4cb8c4] transition-colors"
            >
              <Sparkles className="w-4 h-4" />
              {t("ai_training")}
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

        </Dialog.Panel>

      </div>

    </Dialog>
  );

}

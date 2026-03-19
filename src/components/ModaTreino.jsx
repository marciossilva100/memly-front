import { Dialog } from "@headlessui/react";
import { Play, Repeat, Check, Crown, Bot } from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { playAudio } from "../utils/audioPlayer";


export default function ModalTreino({
  openTreino,
  onClose,
  onOpenPremium,
  onOpenAdvinhar,
  onOpenIA,
  categoriaId
}) {

  const navigate = useNavigate();

  const [mensagem, setMensagem] = useState(<span className="text-base">Repetir</span>);
  const { user, setUser } = useAuth();
  const [waiting, setWaiting] = useState(false);

  const [countPhrases, setCountPhrases] = useState({
    learn: 0,
    repeat: 0,
    repeat_traine: 0,
    review: 0,
    traine: null
  });

  // =========================
  // BUSCAR DADOS DO TREINO
  // =========================
  useEffect(() => {


    if (!openTreino) return;

    fetch("https://zaldemy.com/controller/treino.php", {
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
      setMensagem(<span className="text-base">Repetir</span>);
      setWaiting(false);
      return;
    }

    if (!countPhrases.traine || countPhrases.repeat < 1) {
      setMensagem(<span className="text-base">Repetir</span>);
      setWaiting(false);
      return;
    }

    let seconds = countPhrases.traine;

    function atualizar() {

      if (seconds <= 0) {
        setMensagem(<span className="text-base">Repetir</span>);
        setWaiting(false);
        return;
      }

      const hours = Math.floor(seconds / 3600);
      const minutes = Math.floor((seconds % 3600) / 60);
      const sec = seconds % 60;

      if (hours > 0) {
        setMensagem(
          <span className="text-sm text-red-700">
            Próximo treino em {hours}h {minutes}m
          </span>
        );
        setWaiting(true);
      }
      else if (minutes > 0) {
        setMensagem(
          <span className="text-sm text-red-700">
            Próximo treino em {minutes}m {sec}s
          </span>
        );
        setWaiting(true);
      }
      else {
        setMensagem(
          <span className="text-sm text-red-700">
            Faltam {sec}s
          </span>
        );
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

  const playAudio = (text) => {

    if (!text) return;

    const url =
      "/api/controller/treino.php?action=voice" +
      "&text=" + encodeURIComponent(text) +
      "&lang=" + encodeURIComponent(user.learning_language);

    const audio = new Audio(url);
    audio.playbackRate = 0.9;

    audio.play().catch(() => { });

  };

  // =========================
  // UPDATE TREINO
  // =========================
  function updateTraine() {

    fetch("https://zaldemy.com/controller/treino.php", {
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

  function verifyPlan(e) {
    if (user.plano === 1) {
      onOpenIA()
      return
    }
    onOpenPremium()
    // navigate('/premiumplan');

  }



  return (
    <Dialog
      open={openTreino}
      onClose={onClose}
      className="relative z-50"
    >

      <div className="fixed inset-0 bg-black/40" />

      <div className="fixed inset-0 flex items-center justify-center p-2">

        <Dialog.Panel className="w-70 max-w-xl rounded-2xl bg-white p-6 shadow-xl">

          <Dialog.Title className="text-lg font-semibold mb-3 text-slate-700">
            Treino
          </Dialog.Title>


          <div
            className="flex gap-2 items-center mb-4 cursor-pointer"
            onClick={() => {
              go(`/digitartexto/${categoriaId}/learn`, countPhrases.learn);
            }}
          >

            <Play size={32} className="text-blue-400 me-2" />

            <div className="flex flex-col">
              <span className="text-lg">Aprender</span>
              <span className="text-xs">{countPhrases.learn} palavras</span>
            </div>

          </div>



          <div
            className="flex gap-2 items-center mb-4 cursor-pointer"
            onClick={() => {

              if (countPhrases.repeat > 0 && !waiting) {
                updateTraine();
                onOpenAdvinhar();
              }

            }}
          >

            <Repeat size={32} className="text-blue-400 me-2" />

            <div className="flex flex-col">
              {mensagem}
              <span className="text-xs">{countPhrases.repeat} palavras</span>
            </div>

          </div>



          <div
            className="flex gap-2 items-center mb-4 cursor-pointer"
            onClick={() => {
              go(`/flashcards/${categoriaId}/review`, countPhrases.review);
            }}
          >

            <Check size={32} className="text-green-400 me-2" />

            <div className="flex flex-col">
              <span className="text-lg leading-tight">
                Revisar palavras
                <br />
                aprendidas
              </span>

              <span className="text-xs">{countPhrases.review} palavras</span>
            </div>

          </div>



          <div
            className="flex gap-2 items-center cursor-pointer"
            onClick={(e) => {
              verifyPlan();
            }}
          >

            <Bot size={32} className="text-blue-600 me-2" />

            <span className="text-lg flex items-center">
              Treino diário com IA
              {user.plano === 2 && (<Crown size={18} className="ms-2 text-yellow-500" />)}
            </span>

          </div>



          {/* <div className="mt-6 flex justify-center gap-5">

            <button
              onClick={onClose}
              className="text-sm text-slate-600"
            >
              Cancelar
            </button>

            <button className="bg-blue-600 text-white px-4 py-2 rounded-full text-sm">
              Salvar
            </button>

          </div> */}

        </Dialog.Panel>

      </div>

    </Dialog>
  );

}
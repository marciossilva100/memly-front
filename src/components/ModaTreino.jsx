import { Dialog } from "@headlessui/react";
import { Play, Repeat, Check, Crown, Bot } from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

export default function ModalTreino({
  openTreino,
  onClose,
  onOpenAdvinhar,
  onOpenIA,
  categoriaId
}) {


  const [mensagem, setMensagem] = useState("");
  const navigate = useNavigate();
  const [countPhrases, setCountPhrases] = useState({
    learn: 0,
    repeat: 0,
    repeat_traine: 0,
    review: 0,
  })

  useEffect(() => {
    fetch('http://localhost:8081/controller/treino.php', {
      method: 'POST',
      credentials: "include",
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        action: 'training_stats',
        category_id: categoriaId
      })
    })
      .then(res => res.json())
      .then(data => {
        const repeat = data.data?.[1].total + data.data?.[2].total;
        setCountPhrases({
          learn: data.data?.[0].total ?? 0,
          repeat: repeat ?? 0,
          repeat_traine: data.data?.[2].total ?? 0,
          review: data.data?.[3].total ?? 0,
          traine: data.data?.[1].data_liberacao ?? null
        })

        // const categoriasFormatadas = data.map(item => ({
        //   id: item.id,
        //   categoria: item.categoria,
        //   quantidade: item.total_frases
        // }));
      });

    console.log(countPhrases)
  }, [categoriaId])



  useEffect(() => {

    if (countPhrases.repeat_traine > 0) {
      setMensagem(<span className="text-base">Repetir</span>);
      return;
    }

    if (!countPhrases.traine) return;

    const targetDate = new Date(countPhrases.traine);

    function atualizar() {
      setMensagem(getTimeRemaining(targetDate));
    }

    atualizar();

    const interval = setInterval(atualizar, 1000);

    return () => clearInterval(interval);

  }, [countPhrases]);

  function updateTraine() {
    fetch('http://localhost:8081/controller/treino.php', {
      method: 'POST',
      credentials: "include",
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        action: 'update_repeat',
        category_id: categoriaId
      })
    })
      .then(res => res.json())
      .then(data => {

      });
  }

  function getTimeRemaining(targetDate) {
    const now = new Date();
    const diff = targetDate - now;
    console.log('diff ', countPhrases.repeat_traine)

    if (countPhrases.repeat_traine > 0) {
      return <span className="text-base">Repetir</span>;
    }

    const totalSeconds = Math.floor(diff / 1000);

    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    if (hours > 0) {
      return (
        <span className="text-sm text-red-700">
          Próximo treino em {hours}h {minutes}m
        </span>
      );
    }

    if (minutes > 0) {
      return (
        <span className="text-sm text-red-700">
          Próximo treino em {minutes}m {seconds}s
        </span>
      );
    }

    return (
      <span className="text-sm text-red-700">
        Faltam {seconds}s
      </span>
    );
  }

  function go(endpoint, leng) {

    if (leng > 0)
      navigate(endpoint);

  }

  return (
    <Dialog
      open={openTreino}
      onClose={onClose}
      className="relative z-50"
    >
      {/* Overlay */}
      <div className="fixed inset-0 bg-black/40" />

      {/* Container */}
      <div className="fixed inset-0 flex items-center justify-center p-2">
        <Dialog.Panel className="w-70 max-w-xl rounded-2xl bg-white p-6 shadow-xl">
          <Dialog.Title className="text-lg font-semibold mb-3 text-slate-700">
            Treino
          </Dialog.Title>
          <div className="flex gap-2 items-center mb-4" onClick={() => {
            go(`/digitartexto/${categoriaId}`, countPhrases.learn);
          }}>
            <Play size={32} className="text-blue-400 me-2" />
            <div className="flex flex-col">
              <span className="text-base">Aprender</span>
              <span className="text-xs">{countPhrases.learn} palavras</span>
            </div>
          </div>

          <div
            className="flex gap-2 items-center mb-4 cursor-pointer"
            onClick={() => {
              updateTraine();
              onOpenAdvinhar();
            }}
          >
            <Repeat size={32} className="text-blue-400 me-2" />
            <div className="flex flex-col">
              {mensagem}
              <span className="text-xs">{countPhrases.repeat} palavras</span>
            </div>
          </div>

          <div className="flex gap-2 items-center mb-4">
            <Check size={32} className="text-green-400 me-2" />
            <div className="flex flex-col">
              <span className="text-base leading-tight">
                Revisar palavras<br /> aprendidas
              </span>
              <span className="text-xs">{countPhrases.review} palavras</span>
            </div>
          </div>

          <div className="flex gap-2 items-center mb-4" onClick={onOpenIA}>
            <Bot size={32} className="text-blue-600 me-2" />
            <span className="text-sm flex items-center">
              Treino diário com IA
              <Crown size={18} className="ms-2 text-yellow-500" />
            </span>
          </div>

          <div className="mt-6 flex justify-center gap-5">
            <button
              onClick={onClose}
              className="text-sm text-slate-600"
            >
              Cancelar
            </button>

            <button className="bg-blue-600 text-white px-4 py-2 rounded-full text-sm">
              Salvar
            </button>
          </div>
        </Dialog.Panel>
      </div>
    </Dialog>
  );
}

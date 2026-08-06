import { useEffect, useState } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { playAudio, pararAudio } from "../utils/audioPlayer";
import { useTranslation } from "react-i18next";

export default function JogoFrases() {
  const { t } = useTranslation();

  const { id, mode } = useParams();

  const [todasFrases, setTodasFrases] = useState([]);
  const [indiceAtual, setIndiceAtual] = useState(0);

  const [nativas, setNativas] = useState([]);
  const [traduzidas, setTraduzidas] = useState([]);

  const [selecionadaEsquerda, setSelecionadaEsquerda] = useState(null);
  const [selecionadaDireita, setSelecionadaDireita] = useState(null);

  const [erroEsquerdaId, setErroEsquerdaId] = useState(null);
  const [erroDireitaId, setErroDireitaId] = useState(null);

  const [sucessoEsquerdaId, setSucessoEsquerdaId] = useState(null);
  const [sucessoDireitaId, setSucessoDireitaId] = useState(null);
  const [idPhrases, setIdPhrases] = useState([]);
  const location = useLocation();
  const correctIds = location.state?.correctIds || [];
  const [bloqueado, setBloqueado] = useState(false);

  const [totalPerguntas, setTotalPerguntas] = useState(0);
  const [acertos, setAcertos] = useState(0);
  const [erros, setErros] = useState(0);
  const API_URL = import.meta.env.VITE_API_URL;
  const [finalizado, setFinalizado] = useState(false);
  const { user } = useAuth();

  const navigate = useNavigate();

  // Para o áudio em reprodução ao sair da tela (troca de rota) - sem isso,
  // o áudio seguia tocando mesmo depois do usuário já ter navegado embora.
  useEffect(() => () => pararAudio(), []);

  useEffect(() => {
    if (finalizado) {
      const timer = setTimeout(() => {
        // navigate("/home");
      }, 3000);

      return () => clearTimeout(timer);
    }
  }, [finalizado]);

  useEffect(() => {
    carregarFrases();
  }, [id, mode]);

  async function trainingUpdate(updatedList, actionToSend) {
    try {
      await fetch(`${API_URL}/controller/treino.php`, {
        method: "POST",
        headers: {
          Authorization: "Bearer " + localStorage.getItem("token"),
        },
        body: JSON.stringify({
          action: actionToSend,
          updatedList: updatedList,
          category_id: id,

        }),
      });
    } catch (error) {
      console.log(error);
    }
  }

  function carregarFrases() {
    let endpoint =
      mode === "traine" ? "controller/treino.php" : "controller/frases.php";

    fetch(`${API_URL}/${endpoint}`, {
      method: "POST",
      headers: {
        Authorization: "Bearer " + localStorage.getItem("token"),
      },
      body: JSON.stringify({
        action: mode,
        category_id: id,
        correctIds: (correctIds ? correctIds : '')

      }),
    })
      .then((res) => res.json())
      .then((data) => {
        setTodasFrases(data);
        setIndiceAtual(0);

        const lote = data.slice(0, 4);

        setIdPhrases(data.map((item) => item.id));
        setTotalPerguntas(data.length);

        setAcertos(0);
        setErros(0);
        setFinalizado(false);

        setNativas(shuffleArray(lote));
        setTraduzidas(shuffleArray(lote));

        resetEstados();
      });
  }

  async function carregarProximoLote() {
    const proximoIndice = indiceAtual + 4;
    const lote = todasFrases.slice(proximoIndice, proximoIndice + 4);

    if (lote.length === 0) {

      if (mode !== 'learn')
        await trainingUpdate(idPhrases, "trainee_finish");

      setFinalizado(true);
      return;
    }

    setIndiceAtual(proximoIndice);

    setNativas(shuffleArray(lote));
    setTraduzidas(shuffleArray(lote));

    resetEstados();
  }

  function resetEstados() {
    setSelecionadaEsquerda(null);
    setSelecionadaDireita(null);
    setErroEsquerdaId(null);
    setErroDireitaId(null);
    setSucessoEsquerdaId(null);
    setSucessoDireitaId(null);
  }

  useEffect(() => {
    if (!selecionadaEsquerda || !selecionadaDireita || bloqueado) return;

    const acertou = selecionadaEsquerda.id === selecionadaDireita.id;

    if (acertou) {
      setSucessoEsquerdaId(selecionadaEsquerda.id);
      setSucessoDireitaId(selecionadaDireita.id);
      setBloqueado(true);

      setAcertos((prev) => prev + 1);

      playAudio(selecionadaDireita.texto_traduzido, user);

      // 🔥 AQUI ESTÁ A CORREÇÃO
      setTimeout(() => {
        finalizarAcerto();
      }, 600);
    } else {
      setErroEsquerdaId(selecionadaEsquerda.id);
      setErroDireitaId(selecionadaDireita.id);

      setErros((prev) => prev + 1);

      setTimeout(() => {
        resetEstados();
      }, 450);
    }
  }, [selecionadaEsquerda, selecionadaDireita]);

  function finalizarAcerto() {
    const novoNativas = nativas.filter(
      (item) => item.id !== selecionadaEsquerda.id
    );

    const novoTraduzidas = traduzidas.filter(
      (item) => item.id !== selecionadaDireita.id
    );

    setNativas(novoNativas);
    setTraduzidas(novoTraduzidas);

    resetEstados();
    setBloqueado(false);

    if (novoNativas.length === 0) {
      carregarProximoLote();
    }
  }

  const porcentagem = totalPerguntas
    ? Math.round((acertos / totalPerguntas) * 100)
    : 0;

  function mensagemFinal() {
    if (porcentagem === 100) return t("congrats_master");
    if (porcentagem >= 80) return t("excellent_performance");
    if (porcentagem >= 60) return t("match_very_good");
    return t("keep_training");
  }

  if (totalPerguntas < 1) {
    navigate(`/home`);
    return null;
  }

  if (finalizado) {

    if (mode === 'learn') {
      navigate(`/flashcards/${id}/learn`, {
        state: { correctIds }
      });
      return
    }


    return (
      <div className="h-dvh flex items-center justify-center from-gray-900 to-gray-800 bg-gradient-to-br px-8">
        <div className="w-full max-w-md bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-2xl shadow-2xl p-8 text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-[#4cb8c4]/10 border border-[#4cb8c4]/30 flex items-center justify-center text-3xl">
            {porcentagem >= 80 ? "🏆" : porcentagem >= 60 ? "👏" : "💪"}
          </div>

          <p className="text-lg text-white mb-2">{mensagemFinal()}</p>

          <div className="text-5xl font-extrabold text-[#4cb8c4] mb-2">
            {porcentagem}%
          </div>

          <p className="text-gray-300 mb-6">
            {t("results_summary", { acertos, erros })}
          </p>

          <button
            onClick={() => navigate("/home")}
            className="w-full px-6 py-3 bg-[#4cb8c4] hover:bg-[#3da5b0] text-white font-medium transition-colors rounded-full"
          >
            {t("back_to_home")}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="px-6 pt-4 h-screen grid grid-rows-[auto,1fr] overflow-hidden from-gray-900 to-gray-800 bg-gradient-to-br">
      <div className="relative text-center mb-4 [@media(max-height:700px)]:mb-2">
        <div onClick={() => navigate(-1)} className="text-left cursor-pointer text-white text-2xl">
          ←
        </div>
        <h1 className="absolute inset-x-0 top-0 text-lg font-semibold text-white pointer-events-none">
          {t("match_the_pairs")}
        </h1>
      </div>

      {/* Blocos/fonte menores em telas baixas (ex: iPhone SE) - senão as 4
          linhas de pares somadas ficavam maiores que a tela e a última
          linha cortava embaixo. Mesmo padrão de breakpoint já usado em
          DigitarTexto/Flashcards/Perguntas. */}
      <div className="flex justify-center pb-6 [@media(max-height:700px)]:pb-3 min-h-0">
        <div className="w-full max-w-5xl grid grid-cols-2 gap-8 [@media(max-height:700px)]:gap-4 h-full">
          <div className="grid grid-rows-4 gap-3 [@media(max-height:700px)]:gap-2">
            {nativas.map((frase) => (
              <button
                key={frase.id}
                disabled={bloqueado}
                onClick={() => setSelecionadaEsquerda(frase)}
                className={`p-4 [@media(max-height:700px)]:p-2 [@media(max-height:700px)]:text-sm rounded-lg border text-white border-slate-400
                  ${sucessoEsquerdaId === frase.id
                    ? "bg-[#469118]"
                    : erroEsquerdaId === frase.id
                      ? "bg-[#861616]"
                      : selecionadaEsquerda?.id === frase.id
                        ? "bg-slate-600"
                        : "bg-[linear-gradient(to_right,#233245,#0d1425)]"
                  }`}
              >
                {frase.texto_nativo}
              </button>
            ))}
          </div>

          <div className="grid grid-rows-4 gap-3 [@media(max-height:700px)]:gap-2">
            {traduzidas.map((frase) => (
              <button
                key={frase.id}
                disabled={bloqueado}
                onClick={() => setSelecionadaDireita(frase)}
                className={`p-4 [@media(max-height:700px)]:p-2 [@media(max-height:700px)]:text-sm rounded-lg border text-white border-slate-400
                  ${sucessoDireitaId === frase.id
                    ? "bg-[#469118]"
                    : erroDireitaId === frase.id
                      ? "bg-[#861616]"
                      : selecionadaDireita?.id === frase.id
                        ? "bg-slate-600"
                        : "bg-[linear-gradient(to_right,#233245,#0d1425)]"
                  }`}
              >
                {frase.texto_traduzido}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function shuffleArray(array) {
  return [...array].sort(() => Math.random() - 0.5);
}
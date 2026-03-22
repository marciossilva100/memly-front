import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { playAudio } from "../utils/audioPlayer";

export default function JogoFrases() {
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

  const [bloqueado, setBloqueado] = useState(false);

  const [totalPerguntas, setTotalPerguntas] = useState(0);
  const [acertos, setAcertos] = useState(0);
  const [erros, setErros] = useState(0);

  const [finalizado, setFinalizado] = useState(false);
  const { user } = useAuth();

  const navigate = useNavigate();

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
      await fetch("https://api.zaldemy.com/controller/treino.php", {
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

    fetch(`https://api.zaldemy.com/${endpoint}`, {
      method: "POST",
      headers: {
        Authorization: "Bearer " + localStorage.getItem("token"),
      },
      body: JSON.stringify({
        action: mode,
        category_id: id,
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
    if (porcentagem === 100) return "🏆 Parabéns! Você é um mestre!";
    if (porcentagem >= 80) return "🔥 Excelente desempenho!";
    if (porcentagem >= 60) return "👏 Muito bom!";
    return "💪 Continue treinando!";
  }

  if (totalPerguntas < 1) {
    navigate(`/home`);
    return null;
  }

  if (finalizado) {
    return (
      <div className="h-dvh flex items-center justify-center from-gray-900 to-gray-800 bg-gradient-to-br px-10">
        <div className="bg-white p-10 rounded-2xl shadow-2xl text-center max-w-md">
          <p className="text-xl mb-4">{mensagemFinal()}</p>

          <div className="text-5xl font-extrabold text-indigo-600 mb-2">
            {porcentagem}%
          </div>

          <p className="text-text mb-6">
            {acertos} acertos • {erros} erros
          </p>

          <button
            onClick={() => navigate("/home")}
            className="px-6 py-3 bg-indigo-600 text-white hover:bg-indigo-700 transition rounded-full"
          >
            Voltar ao início
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="px-6 pt-4 h-screen grid grid-rows-[auto,1fr] overflow-hidden from-gray-900 to-gray-800 bg-gradient-to-br">
      <div className="mb-4">
        <div onClick={() => navigate(-1)} className="cursor-pointer text-white text-2xl">
          ← 
        </div>
      </div>

      <div className="flex justify-center">
        <div className="w-full max-w-5xl grid grid-cols-2 gap-8 h-full">
          <div className="grid grid-rows-4 gap-3">
            {nativas.map((frase) => (
              <button
                key={frase.id}
                disabled={bloqueado}
                onClick={() => setSelecionadaEsquerda(frase)}
                className={`p-4 rounded-lg border
                  ${
                    sucessoEsquerdaId === frase.id
                      ? "bg-green-100"
                      : erroEsquerdaId === frase.id
                      ? "bg-red-100"
                      : selecionadaEsquerda?.id === frase.id
                      ? "bg-blue-100"
                      : "bg-white"
                  }`}
              >
                {frase.texto_nativo}
              </button>
            ))}
          </div>

          <div className="grid grid-rows-4 gap-3">
            {traduzidas.map((frase) => (
              <button
                key={frase.id}
                disabled={bloqueado}
                onClick={() => setSelecionadaDireita(frase)}
                className={`p-4 rounded-lg border
                  ${
                    sucessoDireitaId === frase.id
                      ? "bg-green-100"
                      : erroDireitaId === frase.id
                      ? "bg-red-100"
                      : selecionadaDireita?.id === frase.id
                      ? "bg-blue-100"
                      : "bg-white"
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
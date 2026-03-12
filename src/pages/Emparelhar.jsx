import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";

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
  const [idPhrases, setIdPhrases] = useState([])

  const [bloqueado, setBloqueado] = useState(false);

  const [totalPerguntas, setTotalPerguntas] = useState(0);
  const [acertos, setAcertos] = useState(0);
  const [erros, setErros] = useState(0);

  const [finalizado, setFinalizado] = useState(false);

  const navigate = useNavigate();

  useEffect(() => {

    if (finalizado) {
      const timer = setTimeout(() => {
        // navigate("/home");
      }, 3000); // 3000ms = 3 segundos

      return () => clearTimeout(timer); // limpa o timer se o componente desmontar
    }

  }, [navigate, finalizado]);

  useEffect(() => {
    carregarFrases();
  }, [id, mode]);

  useEffect(() => {

    // if(totalPerguntas < 1)
    //   navigate(`/home`)

    // return
  }, [idPhrases]);

  async function trainingUpdate(updatedList, actionToSend) {
    try {
      const res = await fetch("https://zaldemy.com/controller/treino.php", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: actionToSend,
          updatedList: updatedList,
          category_id: id
        })
      });

      const data = await res.json();

      if (!data.success) {
        console.log(data.message);
      }

      return


    } catch (error) {
      console.log(error);
    }
  }

  function carregarFrases() {
    let endpoint =
      mode === "traine" ? "controller/treino.php" : "controller/frases.php";

    fetch(`https://zaldemy.com/${endpoint}`, {
      method: "POST",
      headers: {
                "Authorization": "Bearer " + localStorage.getItem("token")
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

        const ids = data.map(item => item.id);
        setIdPhrases(ids);

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
      await trainingUpdate(idPhrases, 'trainee_finish');
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

  function falarTexto(texto, callback) {
    if (!("speechSynthesis" in window)) {
      callback();
      return;
    }

    const utterance = new SpeechSynthesisUtterance(texto);
    utterance.lang = "en-US";
    utterance.rate = 1;

    utterance.onend = callback;
    utterance.onerror = callback;

    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(utterance);
  }

  useEffect(() => {
    if (!selecionadaEsquerda || !selecionadaDireita || bloqueado) return;

    const acertou = selecionadaEsquerda.id === selecionadaDireita.id;

    if (acertou) {

      setSucessoEsquerdaId(selecionadaEsquerda.id);
      setSucessoDireitaId(selecionadaDireita.id);
      setBloqueado(true);

      setAcertos((prev) => prev + 1);

      falarTexto(selecionadaDireita.texto_traduzido, () => {
        finalizarAcerto();
      });

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
    if (porcentagem >= 60) return "👏 Muito bom! Continue assim!";
    return "💪 Continue treinando, você vai evoluir!";
  }

  if (totalPerguntas < 1) {
    navigate(`/home`);
    return
  }

  if (finalizado) {
    return (
      <div className="h-screen flex items-center justify-center bg-gradient-to-r from-[#4cb8c4] to-[#085078] px-10">
        <div className="bg-white p-10 rounded-2xl shadow-2xl text-center max-w-md">

          <p className="text-xl mb-4">{mensagemFinal()}</p>

          <div className="text-5xl font-extrabold text-indigo-600 mb-2">
            {porcentagem}%
          </div>

          <p className="text-gray-600 mb-6">
            {acertos} acertos • {erros} erros
          </p>

          <button
            onClick={() => navigate("/home")}
            className="px-6 py-3 bg-indigo-600 text-white hover:bg-indigo-700 transition rounded-full"
          >
            Voltar ao início
          </button>

          {/* <button
            onClick={carregarFrases}
            className="px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition"
          >
            🔁 Jogar novamente
          </button> */}

        </div>
      </div>
    );
  }

  return (
    <div className="p-6 h-screen grid grid-rows-[auto,1fr] overflow-hidden bg-gradient-to-r from-[#4cb8c4] to-[#085078]">

      {/* HEADER */}
      <div className="relative text-center mb-6">
        <div
          className="absolute left-0 top-1/2 -translate-y-1/2 cursor-pointer"
          onClick={() => navigate(-1)}
        >
          <i className="bi bi-arrow-left text-xl"></i>
        </div>
      </div>

      {/* AREA DO JOGO */}
      <div className="flex justify-center items-stretch">

        <div className="w-full max-w-5xl h-full">

          <div className="grid grid-cols-2 gap-8 h-full">

            {/* NATIVO */}
            <div className="grid grid-rows-4 gap-3 h-full">
              {nativas.map((frase) => (
                <button
                  key={frase.id}
                  disabled={bloqueado}
                  onClick={() => setSelecionadaEsquerda(frase)}
                  className={`
                  h-full w-full flex items-center justify-center p-4 rounded-lg border transition shadow-xl
                  ${sucessoEsquerdaId === frase.id
                      ? "bg-green-100 border-green-300"
                      : erroEsquerdaId === frase.id
                        ? "bg-red-100 border-red-300"
                        : selecionadaEsquerda?.id === frase.id
                          ? "bg-blue-100 border-blue-300"
                          : "bg-white hover:bg-slate-100"
                    }
                `}
                >
                  {frase.texto_nativo}
                </button>
              ))}
            </div>

            {/* TRADUZIDO */}
            <div className="grid grid-rows-4 gap-3 h-full">
              {traduzidas.map((frase) => (
                <button
                  key={frase.id}
                  disabled={bloqueado}
                  onClick={() => setSelecionadaDireita(frase)}
                  className={`
                  h-full w-full flex items-center justify-center p-4 rounded-lg border transition
                  ${sucessoDireitaId === frase.id
                      ? "bg-green-100 border-green-300"
                      : erroDireitaId === frase.id
                        ? "bg-red-100 border-red-300"
                        : selecionadaDireita?.id === frase.id
                          ? "bg-blue-100 border-blue-300"
                          : "bg-white hover:bg-slate-100"
                    }
                `}
                >
                  {frase.texto_traduzido}
                </button>
              ))}
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}

function shuffleArray(array) {
  return [...array].sort(() => Math.random() - 0.5);
}
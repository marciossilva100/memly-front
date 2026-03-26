import { useParams, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { playAudio } from "../utils/audioPlayer";
import { Volume } from "lucide-react";


// import { gerarAudio } from "../services/elevenlabs";
import { useAuth } from "../context/AuthContext";

export default function Flashcards() {

  const { id, mode } = useParams();
  const navigate = useNavigate();

  const [frases, setFrases] = useState([]);
  const [index, setIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [showBackContent, setShowBackContent] = useState(false);
  const [finished, setFinished] = useState(false);
  const [progress, setProgress] = useState(0);
  const API_URL = import.meta.env.VITE_API_URL;
  const [listIdCorrectPhrase, setListIdCorrectPhrase] = useState([]);
  const [listIdIncorrectPhrase, setListIdIncorrectPhrase] = useState([]);
  const { user, setUser } = useAuth();

  const FLIP_TIME = 5000;
  const FLIP_DURATION = 400;

  const RADIUS = 42;
  const CIRCUMFERENCE = 2 * Math.PI * RADIUS;


  useEffect(() => {

    const endpoint = ['traine'].includes(mode)
      ? 'controller/treino.php'
      : 'controller/frases.php';

    fetch(`${API_URL}/${endpoint}`, {
      method: "POST",
      headers: {
        "Authorization": "Bearer " + localStorage.getItem("token")
      },
      body: JSON.stringify({
        action: mode,
        category_id: id
      })
    })
      .then(res => res.json())
      .then(data => {

        setFrases(data);
        setIndex(0);
        setIsFlipped(false);
        setShowBackContent(false);
        setFinished(false);
        setProgress(0);

        setListIdCorrectPhrase([]);
        setListIdIncorrectPhrase([]);

      });

  }, [id, mode]);

  // progresso e flip automático
  useEffect(() => {

    if (!frases.length || finished || isFlipped) {
      setProgress(0);
      return;
    }

    const start = Date.now();

    const interval = setInterval(() => {

      const elapsed = Date.now() - start;
      const percent = Math.min((elapsed / FLIP_TIME) * 100, 100);

      setProgress(percent);

      if (percent === 100) {
        clearInterval(interval);
        flipCard();
      }

    }, 100);

    return () => clearInterval(interval);

  }, [index, frases, finished, isFlipped]);

  // async function playEleven() {

  //   const url = await gerarAudio(frases[index].texto_traduzido);

  //   if (!url) return;

  //   const audio = new Audio(url);
  //   audio.playbackRate = 0.9;
  //   audio.play();

  // }

  const flipCard = () => {

    setIsFlipped(true);
    setShowBackContent(false);

    setTimeout(() => {

      setShowBackContent(true);
      playAudio(frases[index].texto_traduzido, user);

    }, FLIP_DURATION / 2);

  };


  async function learningUpdate(updatedList, updatedIncorrectList, actionToSend, metrics) {

    try {

      const res = await fetch(`${API_URL}/controller/treino.php`, {
        method: "POST",
        headers: {
          "Authorization": "Bearer " + localStorage.getItem("token")
        },
        body: JSON.stringify({
          action: actionToSend,
          updatedList: updatedList,
          updatedIncorrectList: updatedIncorrectList,
          category_id: id,
          acertos: metrics.acertos,
          erros: metrics.erros,
          total: metrics.totalPerguntas,
          porcentagem: metrics.porcentagem
        })
      });

      const data = await res.json();

      if (!data.success) {
        console.log(data.message);
      }

    } catch (error) {

      console.log(error);

    }

  }

    async function trainingUpdate(actionToSend,frase_id,statusCorrectPhrase) {

      try {

        const res = await fetch(`${API_URL}/controller/treino.php`, {
          method: "POST",
          headers: {
            "Authorization": "Bearer " + localStorage.getItem("token")
          },
          body: JSON.stringify({
            action: actionToSend,
            frase_id: [frase_id],
            category_id: id,
            statusCorrectPhrase:statusCorrectPhrase
          })
        });

        const data = await res.json();

        if (!data.success) {
          console.log(data.message);
        }

      } catch (error) {

        console.log(error);

      }

    }

  const nextCard = async (correct = false) => {

    let updatedList = listIdCorrectPhrase;
    let updatedIncorrectList = listIdIncorrectPhrase;

    if (correct) {

      updatedList = [...listIdCorrectPhrase, frases[index].id];
      setListIdCorrectPhrase(updatedList);

    } else {

      updatedIncorrectList = [...listIdIncorrectPhrase, frases[index].id];
      setListIdIncorrectPhrase(updatedIncorrectList);

    }

    window.speechSynthesis.cancel();

    setIsFlipped(false);
    setShowBackContent(false);
    setProgress(0);

    const statusCorrectPhrase = correct ? 1 : 0

    const actionToSend =
    mode === 'traine' ? 'trainee_finish' : mode;

    await trainingUpdate(actionToSend,frases[index].id,statusCorrectPhrase)

    if (index + 1 < frases.length) {

      setIndex(prev => prev + 1);

    } else {

      const updatedCorrect = updatedList;
      const updatedIncorrect = updatedIncorrectList;

      const acertos = updatedCorrect.length;
      const erros = updatedIncorrect.length;
      const totalPerguntas = frases.length;

      const porcentagem = totalPerguntas
        ? Math.round((acertos / totalPerguntas) * 100)
        : 0;

   


      // if (mode === 'learn') {
      //   await learningUpdate(
      //     updatedCorrect,
      //     updatedIncorrect,
      //     'learn',
      //     { acertos, erros, totalPerguntas, porcentagem }
      //   );
      // }

      setFinished(true);

    }

  };

  if (!frases.length) {

    return (
      <div className="h-screen flex items-center justify-center">
        Carregando...
      </div>
    );

  }

  const acertos = listIdCorrectPhrase.length;
  const erros = listIdIncorrectPhrase.length;
  const totalPerguntas = frases.length;

  const porcentagem = totalPerguntas
    ? Math.round((acertos / totalPerguntas) * 100)
    : 0;

  function mensagemFinal() {

    if (porcentagem === 100) return "🏆 Parabéns! Você acertou tudo!";
    if (porcentagem >= 80) return "🔥 Excelente desempenho!";
    if (porcentagem >= 60) return "👏 Muito bom! Continue assim!";
    return "💪 Continue treinando, você vai evoluir!";

  }

  if (finished) {

    return (
      <div className="h-screen flex items-center justify-center from-gray-900 to-gray-800 bg-gradient-to-br px-10">

        <div className="bg-white p-10 rounded-2xl shadow-2xl text-center max-w-md">

          <p className="text-xl mb-4">{mensagemFinal()}</p>

          <div className="text-5xl font-extrabold text-indigo-500 mb-2">
            {porcentagem}%
          </div>

          <p className="text-gray-600 mb-6">
            {acertos} acertos • {erros} erros
          </p>

          <button
            onClick={() => navigate("/home")}
            className="px-6 py-3 bg-[#4cb8c4] text-white  hover:bg-indigo-700 transition rounded-full"
          >
            Voltar ao início
          </button>

        </div>

      </div>
    );

  }

  const progressBar = frases.length
    ? ((index + (isFlipped ? 1 : 0)) / frases.length) * 100
    : 0;

  return (

    <div className="flex px-6  h-dvh pt-4 from-gray-900 to-gray-800 bg-gradient-to-br">
      <div className="overflow-y-auto flex-1 scrollbar-hide">


        <div className="relative text-center mb-4">

          <div
            className="text-left cursor-pointer"
            onClick={() => navigate(-1)}
          >
            <i className="bi bi-arrow-left text-2xl text-white"></i>
          </div>

        </div>

        <div className="top-0 left-0 w-full h-2 bg-slate-200 pt-2">

          <div
            className="h-full bg-slate-400 transition-all duration-300"
            style={{ width: `${progressBar}%` }}
          />

        </div>

        <div className="h-dvh  justify-center pt-8 h-20">

          <div className="perspective flashcard justify-center flex h-[300px]">

            <div className={`card ${isFlipped ? "flip" : ""}`}>

              <div className="card-front shadow-[0_10px_40px_rgba(0,0,0,0.08)] text-center p-8 bg-[linear-gradient(to_right,#233245,#0d1425)] rounded-lg">
                <span className="text-2xl">
                  {frases[index].texto_nativo}
                </span>
              </div>

              <div className="card-back shadow-[0_10px_40px_rgba(0,0,0,0.09)] text-center p-8 rounded-lg bg-[linear-gradient(to_right,#0d1425,#233245)]">
                <span className="text-2xl text-white">
                  {showBackContent && frases[index].texto_traduzido}
                </span>
              </div>

            </div>

          </div>
          {isFlipped && (
            <div className="text-center flex justify-center mt-5">
              <button onClick={(e) => {
                e.preventDefault();
                playAudio(frases[index].texto_traduzido, user);
              }} className="px-4 py-2 rounded-md bg-slate-400 text-white text-sm hover:bg-blue-500 transition flex">
                <Volume className="w-5 h-5" />
                Ouvir
              </button>
            </div>
          )}

          {!isFlipped && (

            <div className="fixed bottom-6 left-1/2 -translate-x-1/2 ">

              <svg width="96" height="96">

                <circle
                  cx="48"
                  cy="48"
                  r={RADIUS}
                  stroke="#e5e7eb"
                  strokeWidth="8"
                  fill="none"
                />

                <circle
                  cx="48"
                  cy="48"
                  r={RADIUS}
                  stroke="#3687bf"
                  strokeWidth="8"
                  fill="none"
                  strokeDasharray={CIRCUMFERENCE}
                  strokeDashoffset={CIRCUMFERENCE * (1 - progress / 100)}
                  style={{
                    transition: "stroke-dashoffset 0.1s linear",
                    transform: "rotate(-90deg)",
                    transformOrigin: "50% 50%"
                  }}
                />

              </svg>

              <button
                onClick={flipCard}
                className="absolute inset-0 m-auto bg-[#4cb8c4] text-white rounded-full w-20 h-20 shadow-lg transition active:scale-95"
              >
                Mostrar
              </button>

            </div>

          )}



        </div>
        {isFlipped && (

          <div className="flex sticky bottom-6 items-center justify-center gap-3 w-full ">

            <button
              onClick={() => nextCard(false)}
              className="bg-red-400/70 backdrop-blur-sm text-white px-5 py-3 rounded-full shadow-lg transition active:scale-95 w-full"
            >
              Não lembrei
            </button>

            <button
              onClick={() => nextCard(true)}
              className="bg-gray-700/50 backdrop-blur-sm text-white px-5 py-3 rounded-full shadow-lg transition active:scale-95 w-full"
            >
              Lembrei
            </button>

          </div>

        )}
      </div>

    </div>

  );

}
import { useParams,useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { gerarAudio } from "../services/elevenlabs";

export default function Flashcards() {
  const { id, mode } = useParams();

  const [frases, setFrases] = useState([]);
  const [index, setIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [showBackContent, setShowBackContent] = useState(false);
  const [finished, setFinished] = useState(false);
  const [progress, setProgress] = useState(0);
  const [listIdCorrectPhrase, setListIdCorrectPhrase] = useState([]);
  const navigate = useNavigate();

  const FLIP_TIME = 5000;
  const FLIP_DURATION = 400; // ⚠️ deve bater com o CSS transition
  const RADIUS = 42;
  const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

  // 🔹 Pré-carrega vozes
  useEffect(() => {
    const loadVoices = () => window.speechSynthesis.getVoices();
    loadVoices();
    window.speechSynthesis.onvoiceschanged = loadVoices;

    const silentUtterance = new SpeechSynthesisUtterance("");
    window.speechSynthesis.speak(silentUtterance);
    window.speechSynthesis.cancel();
  }, []);

  

  // 🔹 Busca frases
  useEffect(() => {

    let endpoint;

    if (mode === 'traine') {
      endpoint = 'controller/treino.php';
    } else {
      endpoint = 'controller/frases.php';
    }

    fetch(`http://localhost:8081/${endpoint}`, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
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
      });
  }, [id,mode]);

  // 🔹 Flip automático + progresso
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

  async function playEleven() {
    const url = await gerarAudio(frases[index].texto_traduzido);

    const audio = new Audio(url);
    audio.playbackRate = 0.90; // 25% mais rápido
    audio.play();
  }

  // 🔹 Função centralizada de flip
  const flipCard = () => {


    setIsFlipped(true);
    setShowBackContent(false);

    setTimeout(() => {
      setShowBackContent(true);
      playEleven()
      // playAudio(frases[index].texto_traduzido);
    }, FLIP_DURATION / 2);
  };

  // 🔹 Áudio
  const playAudio = (text) => {
    if (!text) return;

    const utterance = new SpeechSynthesisUtterance(text);
    const voices = window.speechSynthesis.getVoices();
    const voice =
      voices.find(v => v.lang === "en-US") ||
      voices.find(v => v.lang.startsWith("en"));

    if (voice) utterance.voice = voice;

    utterance.lang = "en-US";
    utterance.rate = 0.9;
    utterance.pitch = 1;

    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(utterance);
  };


  async function trainingUpdate(updatedList,actionToSend) {
    try {
      const res = await fetch("http://localhost:8081/controller/treino.php", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: actionToSend,
          //data: updatedList,
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

  // useEffect(() => {
  //   if (mode && frases.length > 0 && frases[index]) {
  //     setListIdCorrectPhrase(prev => [
  //       ...prev,
  //       frases[index].id
  //     ]);
  //   }

  // }, [mode]);

  // 🔹 Próximo card
  const nextCard = async (correct = false) => {

    let updatedList = listIdCorrectPhrase;

    if (correct) {
      updatedList = [...listIdCorrectPhrase, frases[index].id];
      setListIdCorrectPhrase(updatedList);
    }

    window.speechSynthesis.cancel();
    setIsFlipped(false);
    setShowBackContent(false);
    setProgress(0);

    if (index + 1 < frases.length) {
      setIndex(prev => prev + 1);
    } else {

      const actionToSend =
      mode === 'traine' ? 'trainee_finish' : mode;

      //if (mode === 'learn')
      await trainingUpdate(updatedList,actionToSend); // 👈 passa a lista correta

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

  if (finished) {
      navigate(`/home`)

    // return (
    //   <div className="h-screen flex items-center justify-center text-xl font-semibold bg-slate-50">
    //     🎉 Treino finalizado
    //   </div>
    // );
  }

  return (
    <div className="h-screen flex justify-center pt-5 bg-slate-50">
      <div className="perspective flashcard justify-center flex">
        <div className={`card ${isFlipped ? "flip" : ""}`}>

          {/* FRENTE */}
          <div className="card-front shadow-[0_10px_40px_rgba(0,0,0,0.08)] text-center p-8">
            <span className="text-2xl">
              {frases[index].texto_nativo}
            </span>
          </div>

          {/* VERSO */}
          <div className="card-back shadow-[0_10px_40px_rgba(0,0,0,0.09)] text-center p-8">
            <span className="text-2xl text-slate-700">
              {showBackContent && frases[index].texto_traduzido}
            </span>
          </div>

        </div>
      </div>

      {/* PROGRESSO */}
      {!isFlipped && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2">
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
            className="absolute inset-0 m-auto
                       bg-blue-600 text-white rounded-full
                       w-20 h-20 shadow-lg
                       transition active:scale-95"
          >
            Mostrar
          </button>
        </div>
      )}

      {/* BOTÕES APÓS VIRAR */}
      {isFlipped && (
        <div className="flex fixed bottom-6 items-center justify-center gap-3">
          <button
            onClick={() => nextCard(false)}
            className="bg-red-400 text-white px-5 py-3 rounded-xl shadow-lg transition active:scale-95"
          >
            Não lembrei
          </button>

          <button
            onClick={() => nextCard(true)}
            className="bg-blue-400 text-white px-5 py-3 rounded-xl shadow-lg transition active:scale-95"
          >
            Lembrei
          </button>
        </div>
      )}
    </div>
  );
}

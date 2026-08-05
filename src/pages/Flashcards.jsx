import { useParams, useNavigate,useLocation } from "react-router-dom";
import { useState, useEffect, useRef } from "react";
import { playAudio } from "../utils/audioPlayer";
import { Volume, RefreshCw } from "lucide-react";

// import { gerarAudio } from "../services/elevenlabs";
import { useAuth } from "../context/AuthContext";
import { useTranslation } from "react-i18next";
import imgChapeuFormatura from "../assets/img/chapeu_formatura.png"
import PremiumModal from "../components/PremiumModal";
import usePremiumLimitListener from "../hooks/usePremiumLimitListener";

export default function Flashcards() {
  const { t } = useTranslation();

  const { id, mode } = useParams();
  const navigate = useNavigate();

  const [frases, setFrases] = useState([]);
  const [index, setIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [showButton, setShowButton] = useState(true);
  const [finished, setFinished] = useState(false);
  const [progress, setProgress] = useState(0);
  const [hasBeenFlipped, setHasBeenFlipped] = useState(false); // NOVO: controla se o card já foi virado alguma vez
  const [nativeAudioPlayed, setNativeAudioPlayed] = useState(false);
  const flipTimeoutRef = useRef(null);
  const API_URL = import.meta.env.VITE_API_URL;
  const [listIdCorrectPhrase, setListIdCorrectPhrase] = useState([]);
  const [listIdIncorrectPhrase, setListIdIncorrectPhrase] = useState([]);
  const [answeredCount, setAnsweredCount] = useState(0);
  const { user, setUser } = useAuth();
  const location = useLocation();
  const correctIds = location.state?.correctIds || [];
  const [isPremiumModalOpen, setIsPremiumModalOpen] = useState(false);
  const [motivoPremium, setMotivoPremium] = useState(null);

  usePremiumLimitListener((motivo) => {
    setMotivoPremium(motivo);
    setIsPremiumModalOpen(true);
  });

  const FLIP_TIME = 8000;
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
        category_id: id,
        correctIds:(correctIds ? correctIds : '')
      })
    })
      .then(res => res.json())
      .then(data => {

        setFrases(data);
        setIndex(0);
        setIsFlipped(false);
        setShowButton(true);
        setHasBeenFlipped(false); // Reset quando carregar novo deck
        setNativeAudioPlayed(false);
        setFinished(false);
        setProgress(0);

        setListIdCorrectPhrase([]);
        setListIdIncorrectPhrase([]);

      });

  }, [id, mode]);

  // progresso e flip automático
  useEffect(() => {

    if (!frases.length || finished) {
      setProgress(0);
      return;
    }

    // Autoplay do áudio nativo é opt-in (configurável em Configurações) -
    // sem essa checagem tocava sempre, ignorando a preferência do usuário.
    // Mesmo padrão já usado em DigitarTexto.jsx.
    const autoplayFrente = localStorage.getItem('zaldemy_autoplay_frente') === '1';

    if (autoplayFrente && !isFlipped && showButton && !nativeAudioPlayed) {
      playAudio(frases[index].texto_nativo, user, false, user?.native_language || user?.learning_language, mode !== "traine");
      setNativeAudioPlayed(true);
    }

    // Só inicia o timer se o card NÃO estiver virado E o botão ainda estiver visível (primeira vez)
    if (!isFlipped && showButton) {
      const start = Date.now();

      const interval = setInterval(() => {

        const elapsed = Date.now() - start;
        const percent = Math.min((elapsed / FLIP_TIME) * 100, 100);

        setProgress(percent);

        if (percent === 100) {
          clearInterval(interval);
          flipCard(); // Vira automaticamente
        }

      }, 100);

      return () => clearInterval(interval);
    } else {
      setProgress(0);
    }

  }, [index, frases, finished, isFlipped, showButton, nativeAudioPlayed, user, mode]);

  const flipCard = () => {
    const willFlip = !isFlipped;

    // Alterna entre virado e não virado
    setIsFlipped(willFlip);

    // Marca que o card já foi virado pelo menos uma vez
    if (!hasBeenFlipped) {
      setHasBeenFlipped(true);
    }

    // Cancelar qualquer timeout anterior antes de configurar o novo
    if (flipTimeoutRef.current) {
      clearTimeout(flipTimeoutRef.current);
      flipTimeoutRef.current = null;
    }

    // Quando virar para o verso (isFlipped se tornando true)
    if (willFlip) {
      // Esconde o botão "Mostrar" quando o card é virado pela primeira vez
      if (showButton) {
        setShowButton(false);
      }

      const currentIndex = index;
      flipTimeoutRef.current = setTimeout(() => {
        playAudio(frases[currentIndex].texto_traduzido, user, false, null, mode !== "traine");
        flipTimeoutRef.current = null;
      }, FLIP_DURATION / 2);
    }
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

  async function trainingUpdate(actionToSend, frase_id, statusCorrectPhrase) {

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
          statusCorrectPhrase: statusCorrectPhrase
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

    setAnsweredCount(prev => prev + 1);

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

    if (flipTimeoutRef.current) {
      clearTimeout(flipTimeoutRef.current);
      flipTimeoutRef.current = null;
    }

    const statusCorrectPhrase = correct ? 1 : 0

    const actionToSend =
      mode === 'traine' ? 'trainee_finish' : mode;

    await trainingUpdate(actionToSend, frases[index].id, statusCorrectPhrase)

    // Reset e avanço de índice precisam ocorrer juntos (mesmo batch de render).
    // Se o reset de nativeAudioPlayed acontecesse antes do índice mudar, o autoplay
    // disparava ainda com o card anterior e depois não tocava mais o card atual.
    setIsFlipped(false);
    setShowButton(true); // Mostra o botão novamente para o próximo card
    setHasBeenFlipped(false); // Reset para o próximo card
    setNativeAudioPlayed(false); // Permite autoplay do texto nativo no próximo card
    setProgress(0);

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

      setFinished(true);

    }

  };

  if (!frases.length) {

    return (
      <div className="flex h-screen items-center justify-center from-gray-900 to-gray-800 bg-gradient-to-br">
        <img
          src={imgChapeuFormatura}
          alt={t("loading")}
          className="w-28 animate-pulse"
        />
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

    if (porcentagem === 100) return t("congrats_all_correct");
    if (porcentagem >= 80) return t("excellent_performance");
    if (porcentagem >= 60) return t("very_good_continue");
    return t("keep_training_evolve");

  }

  if (finished) {

    return (
      <div className="h-screen flex items-center justify-center from-gray-900 to-gray-800 bg-gradient-to-br px-8">

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

  const progressBar = frases.length
    ? (answeredCount / frases.length) * 100
    : 0;

  const progressBarVisible = answeredCount > 0
    ? Math.max(2, progressBar)
    : 0;

  return (

    <div className="flex px-6 h-dvh pt-4 from-gray-900 to-gray-800 bg-gradient-to-br">
      <div className="overflow-y-auto flex-1 scrollbar-hide pb-24">

        <div className="relative text-center mb-4">

          <div
            className="text-left cursor-pointer"
            onClick={() => navigate("/home")}
          >
            <i className="bi bi-arrow-left text-2xl text-white"></i>
          </div>

        </div>

        <div className="top-0 left-0 w-full h-2 bg-slate-200 overflow-hidden">

          <div
            className="h-full bg-[#4cb8c4] transition-all duration-300"
            style={{ width: `${progressBarVisible}%` }}
          />

        </div>

        <div className="pt-8">

          {/* Card com efeito 3D corrigido - altura/fonte menores em telas
              baixas (ex: iPhone SE), senão o card cortava. Mesmo padrão de
              breakpoint já usado em treinoIA/Perguntas. */}
          <div className="perspective flex justify-center h-[380px] [@media(max-height:700px)]:h-[300px]">
            <div className="flashcard w-full h-full">
              <div
                className={`card w-full h-full ${isFlipped ? "flip" : ""}`}
                onClick={flipCard}
                style={{ cursor: "pointer" }}
              >
                <div className="card-front shadow-[0_10px_40px_rgba(0,0,0,0.08)] text-center px-8 py-10 [@media(max-height:700px)]:py-6 bg-[linear-gradient(to_right,#233245,#0d1425)] rounded-lg">
                  <span className="text-2xl [@media(max-height:700px)]:text-xl">
                    {frases[index].texto_nativo}
                  </span>
                  <div className="absolute right-0 top-0 mt-3 me-3">
                    <RefreshCw className="text-white" />
                  </div>
                </div>

                <div className="card-back shadow-[0_10px_40px_rgba(0,0,0,0.09)] text-center px-8 py-10 [@media(max-height:700px)]:py-6 rounded-lg bg-[linear-gradient(to_right,#0d1425,#233245)]">
                  <span className="text-2xl [@media(max-height:700px)]:text-xl text-white">
                    {hasBeenFlipped ? frases[index].texto_traduzido : ""}
                  </span>
                  <div className="absolute right-0 top-0 mt-3 me-3">
                    <RefreshCw className="text-white" />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Botão Ouvir nativo - aparece antes de virar o card */}
          {!isFlipped && (
            <div className="text-center flex justify-center mt-5">
              <button onClick={(e) => {
                e.preventDefault();
                playAudio(frases[index].texto_nativo, user, false, user?.native_language || user?.learning_language, mode !== "traine");
              }} className="px-4 py-2 rounded-md bg-slate-500 text-white text-sm transition flex">
                <Volume className="w-5 h-5" />
                {t("listen_native")}
              </button>
            </div>
          )}

          {/* Botão Ouvir - aparece quando o card está mostrando o verso agora
              (isFlipped, não hasBeenFlipped - senão, ao virar de volta pra
              frente depois da primeira virada, os dois botões apareciam
              juntos, já que hasBeenFlipped nunca volta a false) */}
          {isFlipped && (
            <div className="text-center flex justify-center mt-5">
              <button onClick={(e) => {
                e.preventDefault();
                playAudio(frases[index].texto_traduzido, user, false, null, mode !== "traine");
              }} className="px-4 py-2 rounded-md bg-slate-500 text-white text-sm  transition flex">
                <Volume className="w-5 h-5" />
                {t("listen")}
              </button>
            </div>
          )}

          {/* Botão "Mostrar" - aparece apenas na PRIMEIRA VEZ que o card é carregado */}
          {!isFlipped && showButton && (

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
                className="absolute inset-0 m-auto bg-[#4cb8c4] text-white rounded-full w-20 h-20 shadow-lg transition active:scale-95"
              >
                {t("show")}
              </button>

            </div>

          )}

        </div>

        {/* Botões de avaliação - aparecem quando o card JÁ FOI VIRADO pelo menos uma vez.
            Fixed (não sticky) porque sticky só "gruda" quando o conteúdo é mais alto
            que a viewport - em telas muito altas (ex: Galaxy S20 Ultra) o conteúdo
            cabe inteiro sem precisar rolar, então o sticky nunca tinha nada pra
            grudar embaixo e os botões ficavam presos logo depois do card, no meio
            da tela, com um vão vazio enorme abaixo. */}
        {hasBeenFlipped && (

          <div className="fixed bottom-6 left-0 right-0 px-6 flex items-center justify-center gap-3">

            <button
              onClick={() => nextCard(false)}
              className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 hover:bg-gray-700/50 text-white px-5 py-3 rounded-full shadow-lg transition active:scale-95 w-full"
            >
              {t("didnt_remember")}
            </button>

            <button
              onClick={() => nextCard(true)}
              className="bg-[#4cb8c4] hover:bg-[#3da5b0] text-white px-5 py-3 rounded-full shadow-lg transition active:scale-95 w-full"
            >
              {t("remembered")}
            </button>

          </div>

        )}
      </div>

      <PremiumModal
        isOpen={isPremiumModalOpen}
        setIsPremiumModalOpen={setIsPremiumModalOpen}
        onClose={() => { setIsPremiumModalOpen(false); setMotivoPremium(null); }}
        motivo={motivoPremium}
      />

    </div>

  );

}
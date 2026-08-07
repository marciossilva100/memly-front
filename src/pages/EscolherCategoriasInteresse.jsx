import { useEffect, useState } from "react"
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useTranslation } from "react-i18next";
import { Plane, Film, Briefcase, UtensilsCrossed, Trophy, Music, Cpu, Users } from "lucide-react";
import imgChapeuFormatura from "../assets/img/chapeu_formatura-v2.png"

const MAXIMO_SELECIONAVEL = 3;

const INTERESSES = [
  { key: "viagens", icon: Plane },
  { key: "filmes_series", icon: Film },
  { key: "negocios", icon: Briefcase },
  { key: "culinaria", icon: UtensilsCrossed },
  { key: "esportes", icon: Trophy },
  { key: "musica", icon: Music },
  { key: "tecnologia", icon: Cpu },
  { key: "familia_amigos", icon: Users },
];

export default function EscolherCategoriasInteresse() {
  const { t } = useTranslation();
  const { user, setUser, checkAuth } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Se já tinha concluído e voltou pra editar (fromBack), deixa escolher de
  // novo em vez de já mandar pra frente.
  const editando = !!user?.interesses_definidos;

  useEffect(() => {
    if (user?.step <= 1 || !user?.nivel) {
      navigate("/escolhernivel", { replace: true });
    } else if (user?.interesses_definidos && !location.state?.fromBack) {
      navigate("/referenciausuario", { replace: true });
    }
  }, [user]);

  const [selecionados, setSelecionados] = useState([]);
  const [enviando, setEnviando] = useState(false);
  const [progresso, setProgresso] = useState(0);
  const [erro, setErro] = useState('');
  const API_URL = import.meta.env.VITE_API_URL;

  function alternarSelecao(key) {
    setErro('');
    setSelecionados(prev => {
      if (prev.includes(key)) {
        return prev.filter(k => k !== key);
      }
      if (prev.length >= MAXIMO_SELECIONAVEL) {
        return prev;
      }
      return [...prev, key];
    });
  }

  async function confirmar() {
    if (selecionados.length < 1) {
      setErro(t("choose_at_least_one_interest"));
      return;
    }

    setEnviando(true);
    setErro('');
    setProgresso(0);

    try {
      const token = localStorage.getItem("token");

      if (editando) {
        // Apaga as categorias de interesse antigas antes de criar as novas,
        // senão fica duplicado (as antigas + as novas).
        await fetch(`${API_URL}/controller/categoriaIA.php`, {
          method: 'POST',
          headers: {
            "Content-Type": "application/json",
            "Authorization": "Bearer " + token
          },
          body: JSON.stringify({ action: 'reiniciar_interesses' })
        });
      }

      const resultados = await Promise.all(selecionados.map(async (key) => {
        const res = await fetch(`${API_URL}/controller/categoriaIA.php`, {
          method: 'POST',
          headers: {
            "Content-Type": "application/json",
            "Authorization": "Bearer " + token
          },
          body: JSON.stringify({ action: 'criar_onboarding', categoria: t(`interest_${key}`) })
        });
        const data = await res.json();
        setProgresso(prev => prev + 1);
        return data;
      }));

      const falhou = resultados.some(r => !r.success);

      if (falhou) {
        setErro(t("interest_categories_error"));
        setEnviando(false);
        return;
      }

      await fetch(`${API_URL}/controller/categoriaIA.php`, {
        method: 'POST',
        headers: {
          "Content-Type": "application/json",
          "Authorization": "Bearer " + token
        },
        body: JSON.stringify({ action: 'marcar_interesses_definidos' })
      });

      setUser(prev => ({ ...(prev || {}), interesses_definidos: true }));
      await checkAuth(true);

      navigate("/referenciausuario");
    } catch (error) {
      console.error(error);
      setErro(t("server_connection_error"));
      setEnviando(false);
    }
  }

  return (
    <div className="h-dvh overflow-hidden flex flex-col px-8 pt-6 pb-[env(safe-area-inset-bottom)] from-gray-900 to-gray-800 bg-gradient-to-br">
      <div className="flex-1 overflow-y-auto scrollbar-hide pb-36">
        <div className="relative mb-2">
          <div
            className="left-0 cursor-pointer inline-block"
            onClick={() => navigate("/escolhernivel", { state: { fromBack: true } })}
          >
            <i className="bi bi-arrow-left text-2xl text-white"></i>
          </div>
        </div>

        <div className="w-full max-w-md mx-auto text-center mb-6">
          <div className="flex justify-center mb-3">
            <img src={imgChapeuFormatura} alt="Coruja" className="w-28" />
          </div>
          <h4 className="text-lg font-medium text-white">
            {t("choose_interests_prompt")}
          </h4>
          <p className="text-sm text-gray-400 mt-1">
            {t("choose_interests_subtitle_up_to", { max: MAXIMO_SELECIONAVEL })}
          </p>
          <p className="text-sm font-medium text-[#4cb8c4] mt-2">
            {t("interests_selected_count", { done: selecionados.length, total: MAXIMO_SELECIONAVEL })}
          </p>
        </div>

        <div className="w-full max-w-md mx-auto grid grid-cols-2 gap-3">
          {INTERESSES.map((item) => {
            const posicao = selecionados.indexOf(item.key);
            const selecionado = posicao !== -1;
            const desabilitado = !selecionado && selecionados.length >= MAXIMO_SELECIONAVEL;

            return (
              <button
                key={item.key}
                type="button"
                disabled={desabilitado || enviando}
                onClick={() => alternarSelecao(item.key)}
                className={`relative flex flex-col items-center gap-2 px-4 py-5 rounded-2xl border text-center transition-colors disabled:opacity-40 ${
                  selecionado
                    ? "border-[#4cb8c4] bg-[#4cb8c4]/10"
                    : "border-gray-700 bg-gray-800/50 hover:bg-gray-700/50"
                }`}
              >
                {selecionado && (
                  <span className="absolute top-2 right-2 w-5 h-5 rounded-full bg-[#4cb8c4] text-white text-xs font-bold flex items-center justify-center">
                    {posicao + 1}
                  </span>
                )}
                <div className={`w-11 h-11 rounded-full flex items-center justify-center ${
                  selecionado ? "bg-[#4cb8c4]/20" : "bg-gray-700/50"
                }`}>
                  <item.icon className={`w-5 h-5 ${selecionado ? "text-[#4cb8c4]" : "text-gray-400"}`} />
                </div>
                <p className="text-white text-sm font-medium">{t(`interest_${item.key}`)}</p>
              </button>
            );
          })}
        </div>

        {erro && (
          <div className="w-full max-w-md mx-auto bg-red-100 text-red-700 text-sm px-3 py-2 rounded mt-4 text-center">
            {erro}
          </div>
        )}
      </div>

      <div className="fixed bottom-0 left-0 w-full px-8 pt-8 pb-[calc(1rem+env(safe-area-inset-bottom))] bg-gradient-to-t from-gray-900 via-gray-900/95 to-transparent">
        <button
          type="button"
          onClick={confirmar}
          disabled={enviando || selecionados.length < 1}
          className="block w-full max-w-md mx-auto bg-[#4cb8c4] hover:bg-[#3da5b0] disabled:brightness-75 disabled:cursor-not-allowed text-white font-medium py-3 rounded-full transition text-center"
        >
          {enviando
            ? t("generating_interest_categories", { done: progresso, total: selecionados.length })
            : t("confirm")}
        </button>
      </div>
    </div>
  )
}

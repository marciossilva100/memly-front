import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useTranslation } from "react-i18next";
import { Sprout, TrendingUp, Trophy } from "lucide-react";
import imgChapeuFormatura from "../assets/img/chapeu_formatura-v2.png"

const NIVEIS = [
  { id: 1, icon: Sprout, key: "iniciante" },
  { id: 2, icon: TrendingUp, key: "intermediario" },
  { id: 3, icon: Trophy, key: "avancado" },
];

export default function EscolherNivel() {
  const { t } = useTranslation();
  const { user, setUser, checkAuth } = useAuth();
  const navigate = useNavigate();

  // Não pode chegar aqui sem ter escolhido o idioma de aprendizado ainda, e
  // se já tem nível salvo, essa etapa já foi concluída - segue em frente.
  useEffect(() => {
    if (user?.step <= 1) {
      navigate("/escolheridiomaaprender", { replace: true });
    } else if (user?.nivel) {
      navigate(user?.interesses_definidos ? "/referenciausuario" : "/escolhercategorias", { replace: true });
    }
  }, [user]);

  const [nivel, setNivel] = useState(null);
  const [erro, setErro] = useState('');
  const [enviando, setEnviando] = useState(false);
  const API_URL = import.meta.env.VITE_API_URL;

  async function confirmar() {
    if (!nivel) {
      setErro(t("choose_a_level"));
      return;
    }

    setEnviando(true);
    setErro('');

    try {
      const res = await fetch(`${API_URL}/controller/nivel.php`, {
        method: 'POST',
        headers: {
          "Content-Type": "application/json",
          "Authorization": "Bearer " + localStorage.getItem("token")
        },
        body: JSON.stringify({ action: 'set_level', nivel })
      });

      const data = await res.json();

      if (!data.success) {
        setErro(data.message || t("server_connection_error"));
        return;
      }

      setUser(prev => ({ ...(prev || {}), nivel }));
      await checkAuth(true);

      navigate("/escolhercategorias");
    } catch (error) {
      console.error(error);
      setErro(t("server_connection_error"));
    } finally {
      setEnviando(false);
    }
  }

  return (
    <div className="h-dvh overflow-hidden flex flex-col px-8 pt-6 pb-[env(safe-area-inset-bottom)] from-gray-900 to-gray-800 bg-gradient-to-br">
      <div className="w-full max-w-md mx-auto text-center mb-6">
        <div className="flex justify-center mb-3">
          <img src={imgChapeuFormatura} alt="Coruja" className="w-28" />
        </div>
        <h4 className="text-lg font-medium text-white">
          {t("choose_level_prompt")}
        </h4>
        <p className="text-sm text-gray-400 mt-1">
          {t("choose_level_subtitle")}
        </p>
      </div>

      <div className="w-full max-w-md mx-auto flex flex-col gap-3">
        {NIVEIS.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => { setErro(''); setNivel(item.id); }}
            className={`flex items-center gap-4 px-4 py-4 rounded-2xl border text-left transition-colors ${
              nivel === item.id
                ? "border-[#4cb8c4] bg-[#4cb8c4]/10"
                : "border-gray-700 bg-gray-800/50 hover:bg-gray-700/50"
            }`}
          >
            <div className={`w-11 h-11 shrink-0 rounded-full flex items-center justify-center ${
              nivel === item.id ? "bg-[#4cb8c4]/20" : "bg-gray-700/50"
            }`}>
              <item.icon className={`w-5 h-5 ${nivel === item.id ? "text-[#4cb8c4]" : "text-gray-400"}`} />
            </div>
            <div>
              <p className="text-white font-medium">{t(`level_${item.key}_title`)}</p>
              <p className="text-gray-400 text-xs mt-0.5">{t(`level_${item.key}_desc`)}</p>
            </div>
          </button>
        ))}

        {erro && (
          <div className="bg-red-100 text-red-700 text-sm px-3 py-1 rounded">
            {erro}
          </div>
        )}
      </div>

      <div className="mt-auto pb-4 fixed bottom-0 left-0 w-full px-8">
        <button
          type="button"
          onClick={confirmar}
          disabled={enviando}
          className="block w-full max-w-md mx-auto bg-[#4cb8c4] hover:bg-[#3da5b0] disabled:opacity-50 text-white font-medium py-3 rounded-full transition text-center"
        >
          {t("confirm")}
        </button>
      </div>
    </div>
  )
}

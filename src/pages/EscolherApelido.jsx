import { useEffect, useState } from "react"
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useTranslation } from "react-i18next";
import imgChapeuFormatura from "../assets/img/chapeu_formatura-v2.png"
import useEnableBodyScroll from "../hooks/useEnableBodyScroll";

export default function EscolherApelido() {
    const { t } = useTranslation();
    const { user, setUser, checkAuth } = useAuth();
    useEnableBodyScroll();
    const navigate = useNavigate();
    const location = useLocation();
    const API_URL = import.meta.env.VITE_API_URL;

    const [apelido, setApelidoInput] = useState('');
    const [erro, setErro] = useState('');
    const [enviando, setEnviando] = useState(false);

    // Já escolheu antes (ou voltou pra essa tela sem motivo) - segue o
    // onboarding normalmente, sem mostrar de novo.
    useEffect(() => {
        if (user?.apelido_definido_pelo_usuario && !location.state?.fromBack) {
            navigate("/escolheridioma", { replace: true });
        }
    }, [user]);

    // Pré-preenche com o apelido gerado automaticamente no cadastro - o
    // usuário pode manter esse mesmo (só confirmar) ou trocar por um seu.
    useEffect(() => {
        if (user?.apelido) setApelidoInput(user.apelido);
    }, [user?.apelido]);

    async function handleSubmit(e) {
        e.preventDefault();
        setErro('');

        const valor = apelido.trim();

        if (valor.length < 3 || valor.length > 20 || !/^[a-zA-Z0-9_]+$/.test(valor)) {
            setErro(t("nickname_invalid"));
            return;
        }

        setEnviando(true);

        try {
            const res = await fetch(`${API_URL}/controller/configuracoes.php`, {
                method: 'POST',
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": "Bearer " + localStorage.getItem("token")
                },
                body: JSON.stringify({ action: 'atualizar_apelido', apelido: valor })
            });

            const data = await res.json();

            if (!data.success) {
                setErro(data.message || t("unexpected_error"));
                return;
            }

            setUser(prev => (prev && { ...prev, apelido: data.apelido, apelido_definido_pelo_usuario: true }));
            await checkAuth(true);

            navigate("/escolheridioma");
        } catch (error) {
            console.error('Erro ao salvar apelido:', error);
            setErro(t("server_connection_error"));
        } finally {
            setEnviando(false);
        }
    }

    return (
        <div className="min-h-screen flex flex-col px-10 pt-6 pb-[env(safe-area-inset-bottom)] from-gray-900 to-gray-800 bg-gradient-to-br">
            <form onSubmit={handleSubmit}>
                <div className="w-lg max-w-md mx-auto text-center mb-6">
                    <div className="flex justify-center mb-3">
                        <img src={imgChapeuFormatura} alt="Chapeu formatura" className="w-28" />
                    </div>
                    <h4 className="text-lg font-medium text-white">
                        {t("choose_nickname_prompt")}
                    </h4>
                    <p className="text-xs text-gray-400 mt-1">
                        {t("nickname_onboarding_hint")}
                    </p>
                </div>

                <div className="w-full max-w-md mx-auto">
                    <input
                        type="text"
                        maxLength={20}
                        disabled={enviando}
                        value={apelido}
                        onChange={(e) => {
                            setApelidoInput(e.target.value);
                            setErro('');
                        }}
                        className="w-full h-12 px-4 rounded-2xl border border-blue-500 bg-transparent text-white text-sm outline-none"
                    />

                    {erro && (
                        <div className="bg-red-100 text-red-700 text-sm px-3 py-1 rounded mt-4">
                            {erro}
                        </div>
                    )}
                </div>

                <div className="w-lg mt-auto pb-4 fixed bottom-0 left-0 w-full px-10">
                    <button
                        type="submit"
                        disabled={enviando}
                        className="block w-full bg-[#4cb8c4] disabled:opacity-50 bottom-0 text-white font-medium py-3 rounded-full transition text-center"
                    >
                        {enviando ? t("saving") : t("confirm")}
                    </button>
                </div>
            </form>
        </div>
    )
}

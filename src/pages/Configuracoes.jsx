import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useAuth } from "../context/AuthContext";
import { FileText, Shield, LogOut, ChevronRight, Settings, BookOpen, Home, BarChart3, Trash2, Volume2, Check } from "lucide-react";
import ModalConfirm from "../components/ModalConfirm";

const QUANTIDADE_FRASES_MIN = 1;
const QUANTIDADE_FRASES_MAX = 8;

const VOZES_TTS = [
    { valor: "alloy", emoji: "🧑" },
    { valor: "ash", emoji: "👨" },
    { valor: "ballad", emoji: "👩" },
    { valor: "cedar", emoji: "🧔" },
    { valor: "coral", emoji: "👩‍🦰" },
    { valor: "echo", emoji: "👨‍🦰" },
    { valor: "fable", emoji: "🧑‍🦱" },
    { valor: "marin", emoji: "👩‍🦱" },
    { valor: "nova", emoji: "👩‍🦳" },
    { valor: "onyx", emoji: "👨‍🦲" },
    { valor: "sage", emoji: "🧓" },
    { valor: "shimmer", emoji: "👱‍♀️" },
    { valor: "verse", emoji: "👱‍♂️" },
];

function ItemMenu({ icone: Icone, titulo, onClick, cor = "text-gray-300" }) {
    return (
        <button
            type="button"
            onClick={onClick}
            className="w-full flex items-center justify-between gap-3 px-4 py-4 bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-xl hover:bg-gray-700/50 transition-colors text-left"
        >
            <span className="flex items-center gap-3">
                <Icone className={`w-5 h-5 ${cor}`} />
                <span className="text-white text-base">{titulo}</span>
            </span>
            <ChevronRight className="w-4 h-4 text-gray-500" />
        </button>
    );
}

export default function Configuracoes() {
    const navigate = useNavigate();
    const { t } = useTranslation();
    const { logout } = useAuth();
    const API_URL = import.meta.env.VITE_API_URL;

    const [quantidadeFrases, setQuantidadeFrases] = useState('');
    const [loadingQuantidade, setLoadingQuantidade] = useState(false);
    const [salvandoQuantidade, setSalvandoQuantidade] = useState(false);
    const [mensagemQuantidade, setMensagemQuantidade] = useState('');
    const [erroQuantidade, setErroQuantidade] = useState('');

    const [vozTts, setVozTts] = useState('nova');
    const [salvandoVoz, setSalvandoVoz] = useState(false);
    const [erroVoz, setErroVoz] = useState('');

    const [openModalExcluirConta, setOpenModalExcluirConta] = useState(false);
    const [excluindoConta, setExcluindoConta] = useState(false);
    const [erroExcluirConta, setErroExcluirConta] = useState('');

    async function handleLogout() {
        await logout();
        navigate("/login");
    }

    async function handleExcluirConta() {
        setExcluindoConta(true);
        setErroExcluirConta('');

        try {
            const res = await fetch(`${API_URL}/controller/configuracoes.php`, {
                method: 'POST',
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": "Bearer " + localStorage.getItem("token")
                },
                body: JSON.stringify({ action: 'excluir_conta' })
            });

            const data = await res.json();

            if (!data.success) {
                setErroExcluirConta(data.message || t("unexpected_error"));
                setOpenModalExcluirConta(false);
                return;
            }

            await logout();
            navigate("/login");
        } catch (error) {
            console.error('Erro ao excluir conta:', error);
            setErroExcluirConta(t("server_connection_error"));
            setOpenModalExcluirConta(false);
        } finally {
            setExcluindoConta(false);
        }
    }

    useEffect(() => {
        async function carregarConfiguracoes() {
            setLoadingQuantidade(true);

            try {
                const res = await fetch(`${API_URL}/controller/configuracoes.php`, {
                    method: 'POST',
                    headers: {
                        "Content-Type": "application/json",
                        "Authorization": "Bearer " + localStorage.getItem("token")
                    },
                    body: JSON.stringify({ action: 'obter' })
                });

                const data = await res.json();

                if (data.success) {
                    setQuantidadeFrases(String(data.quantidade_frases_aprender));
                    setVozTts(data.voz_tts || 'nova');
                }
            } catch (error) {
                console.error('Erro ao carregar configurações:', error);
            } finally {
                setLoadingQuantidade(false);
            }
        }

        carregarConfiguracoes();
    }, []);

    async function handleSalvarQuantidade(e) {
        e.preventDefault();
        setErroQuantidade('');
        setMensagemQuantidade('');

        const quantidade = Number(quantidadeFrases);

        if (!quantidade || quantidade < QUANTIDADE_FRASES_MIN || quantidade > QUANTIDADE_FRASES_MAX) {
            setErroQuantidade(t("phrases_amount_invalid", { min: QUANTIDADE_FRASES_MIN, max: QUANTIDADE_FRASES_MAX }));
            return;
        }

        setSalvandoQuantidade(true);

        try {
            const res = await fetch(`${API_URL}/controller/configuracoes.php`, {
                method: 'POST',
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": "Bearer " + localStorage.getItem("token")
                },
                body: JSON.stringify({
                    action: 'atualizar_quantidade_frases_aprender',
                    quantidade_frases_aprender: quantidade
                })
            });

            const data = await res.json();

            if (!data.success) {
                setErroQuantidade(data.message || t("unexpected_error"));
                return;
            }

            setMensagemQuantidade(t("saved_successfully"));
        } catch (error) {
            console.error('Erro ao salvar configurações:', error);
            setErroQuantidade(t("server_connection_error"));
        } finally {
            setSalvandoQuantidade(false);
        }
    }

    async function handleSelecionarVoz(voz) {
        if (voz === vozTts || salvandoVoz) return;

        const vozAnterior = vozTts;
        setVozTts(voz);
        setErroVoz('');
        setSalvandoVoz(true);

        try {
            const res = await fetch(`${API_URL}/controller/configuracoes.php`, {
                method: 'POST',
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": "Bearer " + localStorage.getItem("token")
                },
                body: JSON.stringify({ action: 'atualizar_voz_tts', voz_tts: voz })
            });

            const data = await res.json();

            if (!data.success) {
                setVozTts(vozAnterior);
                setErroVoz(data.message || t("unexpected_error"));
            }
        } catch (error) {
            console.error('Erro ao salvar voz:', error);
            setVozTts(vozAnterior);
            setErroVoz(t("server_connection_error"));
        } finally {
            setSalvandoVoz(false);
        }
    }

    return (
        <div className="h-dvh flex flex-col from-gray-900 to-gray-800 bg-gradient-to-br">
            <div className="flex-1 overflow-y-auto scrollbar-hide px-5 pb-[140px]">
                <div className="relative mb-4 mt-4">
                    <div
                        className="left-0 cursor-pointer inline-block"
                        onClick={() => navigate(-1)}
                    >
                        <i className="bi bi-arrow-left text-2xl text-white"></i>
                    </div>
                </div>

                <div className="max-w-2xl mx-auto">
                    <div className="flex items-center gap-2 mb-6">
                        <Settings className="w-6 h-6 text-green-400" />
                        <h1 className="text-2xl font-bold text-white">{t("settings")}</h1>
                    </div>

                    <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-xl p-4 mb-3">
                        <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-3">
                                <BookOpen className="w-5 h-5 text-green-400" />
                                <span className="text-white text-base">{t("phrases_per_learning_session")}</span>
                            </div>
                            <span className="text-green-400 text-2xl font-bold min-w-[3rem] text-right">
                                {Number(quantidadeFrases) || QUANTIDADE_FRASES_MIN}
                            </span>
                        </div>

                        <form onSubmit={handleSalvarQuantidade}>
                            <input
                                type="range"
                                min={QUANTIDADE_FRASES_MIN}
                                max={QUANTIDADE_FRASES_MAX}
                                disabled={loadingQuantidade}
                                value={Number(quantidadeFrases) || QUANTIDADE_FRASES_MIN}
                                onChange={(e) => {
                                    setQuantidadeFrases(e.target.value);
                                    setErroQuantidade('');
                                    setMensagemQuantidade('');
                                }}
                                className="w-full accent-green-400 cursor-pointer"
                            />

                            <div className="flex justify-between text-xs text-gray-500 mt-1 mb-4">
                                <span>{QUANTIDADE_FRASES_MIN}</span>
                                <span>{QUANTIDADE_FRASES_MAX}</span>
                            </div>

                            <button
                                type="submit"
                                disabled={salvandoQuantidade || loadingQuantidade}
                                className="w-full bg-[#4cb8c4] disabled:opacity-50 text-white px-4 py-2 rounded-full text-sm font-medium"
                            >
                                {salvandoQuantidade ? t("saving") : t("save")}
                            </button>
                        </form>

                        {erroQuantidade && (
                            <p className="text-red-400 text-xs mt-2">{erroQuantidade}</p>
                        )}
                        {mensagemQuantidade && (
                            <p className="text-green-400 text-xs mt-2">{mensagemQuantidade}</p>
                        )}
                    </div>

                    <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-xl p-4 mb-3">
                        <div className="flex items-center gap-3 mb-4">
                            <Volume2 className="w-5 h-5 text-[#4cb8c4]" />
                            <span className="text-white text-base">{t("voice_type")}</span>
                        </div>

                        <div className="space-y-1.5">
                            {VOZES_TTS.map((voz) => {
                                const selecionada = vozTts === voz.valor;
                                return (
                                    <button
                                        key={voz.valor}
                                        type="button"
                                        disabled={salvandoVoz}
                                        onClick={() => handleSelecionarVoz(voz.valor)}
                                        className={`w-full flex items-center gap-3 rounded-lg border px-3 py-2 transition-colors disabled:opacity-60 ${
                                            selecionada
                                                ? "border-[#4cb8c4] bg-[#4cb8c4]/10"
                                                : "border-gray-700 bg-gray-900/40 hover:bg-gray-700/40"
                                        }`}
                                    >
                                        <span className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-800 text-lg leading-none shrink-0">
                                            {voz.emoji}
                                        </span>
                                        <span className={`flex-1 text-left text-sm font-medium capitalize ${selecionada ? "text-[#4cb8c4]" : "text-gray-300"}`}>
                                            {voz.valor}
                                        </span>
                                        {selecionada && (
                                            <Check className="w-4 h-4 text-[#4cb8c4] shrink-0" />
                                        )}
                                    </button>
                                );
                            })}
                        </div>

                        {erroVoz && (
                            <p className="text-red-400 text-xs mt-3">{erroVoz}</p>
                        )}
                    </div>

                    <div className="space-y-3">
                        <ItemMenu
                            icone={FileText}
                            titulo={t("terms_of_use")}
                            cor="text-blue-400"
                            onClick={() => navigate("/termosdeuso")}
                        />

                        <ItemMenu
                            icone={Shield}
                            titulo={t("privacy_policy")}
                            cor="text-purple-400"
                            onClick={() => navigate("/politicaprivacidade")}
                        />

                        <ItemMenu
                            icone={LogOut}
                            titulo={t("log_out")}
                            cor="text-red-400"
                            onClick={handleLogout}
                        />

                        <ItemMenu
                            icone={Trash2}
                            titulo={t("delete_account")}
                            cor="text-red-500"
                            onClick={() => setOpenModalExcluirConta(true)}
                        />

                        {erroExcluirConta && (
                            <p className="text-red-400 text-xs">{erroExcluirConta}</p>
                        )}
                    </div>
                </div>
            </div>

            <ModalConfirm
                openModalConfirm={openModalExcluirConta}
                setOpenModalConfirm={setOpenModalExcluirConta}
                msg={t("delete_account_confirm_message")}
                onConfirm={handleExcluirConta}
            />

            <div className="sticky inset-x-0 bottom-0 z-10 text-center w-full justify-items-center justify-center items-center   ">


                <div className=" w-full ">
                    <div className='flex  left-0   w-full justify-center py-2 '>
                        <button type="button" onClick={() => navigate('/home')}>
                            <div className=' p-3 flex justify-center items-center'>
                                <Home width={38} height={38} className='text-[#4cb8c4]' />
                            </div>
                        </button>
                        <button type="button" onClick={() => navigate('/metricas')}>
                            <div className=' p-3 flex justify-center items-center'>
                                <BarChart3 className='text-amber-400' width={38} height={38} />

                                {/*  <BookOpen className='text-white' /> */}
                                {/* <img src={imgEstatistica} alt="" width={40} /> */}
                            </div>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

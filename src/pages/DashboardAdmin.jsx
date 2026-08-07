import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { isAdminEmail } from "../utils/adminEmails";
import {
    AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer
} from "recharts";
import {
    Users,
    UserPlus,
    BadgeCheck,
    Layers,
    BookOpen,
    RefreshCw,
    AlertCircle,
    Home,
    ShieldAlert,
    Globe,
    X,
    Plus
} from 'lucide-react';

const CORES = ['#00ff88', '#4ecdc4', '#ffe66d', '#c3447a', '#a78bfa', '#f472b6'];

export default function DashboardAdmin() {
    const { user } = useAuth();
    const navigate = useNavigate();
    const API_URL = import.meta.env.VITE_API_URL;

    const [loading, setLoading] = useState(false);
    const [erro, setErro] = useState(null);
    const [resumo, setResumo] = useState(null);
    const [crescimento, setCrescimento] = useState([]);
    const [usuariosPorPlano, setUsuariosPorPlano] = useState([]);
    const [canaisAquisicao, setCanaisAquisicao] = useState([]);
    const [idiomas, setIdiomas] = useState([]);

    const [paises, setPaises] = useState([]);
    const [novoCodigoPais, setNovoCodigoPais] = useState('');
    const [novoNomePais, setNovoNomePais] = useState('');
    const [erroPaises, setErroPaises] = useState('');
    const [salvandoPais, setSalvandoPais] = useState(false);

    const autorizado = isAdminEmail(user?.email);

    async function carregarPaises() {
        try {
            const response = await fetch(`${API_URL}/controller/dashboard.php`, {
                method: 'POST',
                headers: {
                    "Authorization": "Bearer " + localStorage.getItem("token"),
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({ action: 'listar_paises' })
            });
            const data = await response.json();
            setPaises(data.paises || []);
        } catch (error) {
            console.error('Erro ao carregar países liberados:', error);
        }
    }

    async function adicionarPais(e) {
        e.preventDefault();
        setErroPaises('');

        const codigo = novoCodigoPais.trim().toUpperCase();
        const nome = novoNomePais.trim();

        if (codigo.length !== 2) {
            setErroPaises('O código do país tem 2 letras (ex: BR, PT, US).');
            return;
        }
        if (!nome) {
            setErroPaises('Informe o nome do país.');
            return;
        }

        setSalvandoPais(true);
        try {
            const response = await fetch(`${API_URL}/controller/dashboard.php`, {
                method: 'POST',
                headers: {
                    "Authorization": "Bearer " + localStorage.getItem("token"),
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({ action: 'adicionar_pais', codigo, nome })
            });
            const data = await response.json();

            if (!response.ok) {
                setErroPaises(data.error || 'Não foi possível adicionar o país.');
                return;
            }

            setPaises(data.paises || []);
            setNovoCodigoPais('');
            setNovoNomePais('');
        } catch (error) {
            console.error('Erro ao adicionar país:', error);
            setErroPaises('Erro de conexão ao adicionar o país.');
        } finally {
            setSalvandoPais(false);
        }
    }

    async function removerPais(codigo) {
        try {
            const response = await fetch(`${API_URL}/controller/dashboard.php`, {
                method: 'POST',
                headers: {
                    "Authorization": "Bearer " + localStorage.getItem("token"),
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({ action: 'remover_pais', codigo })
            });
            const data = await response.json();
            setPaises(data.paises || []);
        } catch (error) {
            console.error('Erro ao remover país:', error);
        }
    }

    async function carregar() {
        setLoading(true);
        setErro(null);

        try {
            const response = await fetch(`${API_URL}/controller/dashboard.php`, {
                method: 'POST',
                headers: {
                    "Authorization": "Bearer " + localStorage.getItem("token"),
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({ action: 'dashboard', dias: 30 })
            });

            const data = await response.json();

            if (!response.ok) {
                setErro(data.error || 'Não foi possível carregar o dashboard.');
                return;
            }

            setResumo(data.resumo || null);
            setCrescimento(data.crescimento || []);
            setUsuariosPorPlano(data.usuarios_por_plano || []);
            setCanaisAquisicao(data.canais_aquisicao || []);
            setIdiomas(data.idiomas_mais_aprendidos || []);
        } catch (error) {
            console.error('Erro ao carregar dashboard admin:', error);
            setErro('Erro de conexão ao carregar o dashboard.');
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        if (autorizado) {
            carregar();
            carregarPaises();
        }
    }, [autorizado]);

    const CardKpi = ({ titulo, valor, icone: Icone, cor, subtexto }) => (
        <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-4 md:p-6 border border-gray-700">
            <div className="flex items-center justify-between">
                <div>
                    <p className="text-gray-400 text-xs md:text-sm font-medium">{titulo}</p>
                    <p className="text-xl md:text-3xl font-bold text-white mt-1 md:mt-2">{valor}</p>
                    {subtexto && <p className="text-xs md:text-sm text-gray-500 mt-1">{subtexto}</p>}
                </div>
                <div className={`p-2 md:p-3 rounded-lg bg-gradient-to-br ${cor}`}>
                    <Icone className="w-4 h-4 md:w-6 md:h-6 text-white" />
                </div>
            </div>
        </div>
    );

    const Secao = ({ titulo, icone: Icone, cor = "text-green-400", children }) => (
        <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl border border-gray-700 p-4 md:p-6">
            <div className="flex items-center gap-2 mb-4">
                <Icone className={`w-5 h-5 ${cor}`} />
                <h3 className="text-base md:text-lg font-semibold text-white">{titulo}</h3>
            </div>
            {children}
        </div>
    );

    const ListaComBarra = ({ dados, vazio }) => {
        const total = dados.reduce((acc, item) => acc + item.value, 0);

        if (dados.length === 0) {
            return (
                <div className="text-center py-6 text-gray-400 text-sm">
                    <AlertCircle className="w-10 h-10 mx-auto mb-2 text-gray-600" />
                    <p>{vazio}</p>
                </div>
            );
        }

        return (
            <div className="space-y-3">
                {dados.map((item, index) => {
                    const porcentagem = total > 0 ? ((item.value / total) * 100).toFixed(1) : '0.0';
                    return (
                        <div key={item.name}>
                            <div className="flex items-center justify-between mb-1">
                                <div className="flex items-center gap-2">
                                    <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: CORES[index % CORES.length] }}></div>
                                    <span className="text-white text-sm font-medium capitalize">{item.name}</span>
                                </div>
                                <span className="text-sm text-gray-300">{item.value}</span>
                            </div>
                            <div className="w-full bg-gray-700 rounded-full h-1.5">
                                <div
                                    className="h-1.5 rounded-full"
                                    style={{ width: `${porcentagem}%`, backgroundColor: CORES[index % CORES.length] }}
                                ></div>
                            </div>
                        </div>
                    );
                })}
            </div>
        );
    };

    if (!autorizado) {
        return (
            <div className="h-[calc(100dvh-64px)] flex flex-col items-center justify-center from-gray-900 to-gray-800 bg-gradient-to-br text-center px-6">
                <ShieldAlert className="w-12 h-12 text-red-400 mb-3" />
                <p className="text-white font-semibold">Acesso restrito</p>
                <p className="text-gray-400 text-sm mt-1">Esta página é exclusiva para administradores.</p>
                <button
                    onClick={() => navigate('/home')}
                    className="mt-4 bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded-lg text-sm"
                >
                    Voltar para o início
                </button>
            </div>
        );
    }

    return (
        <div className="h-[calc(100dvh-64px)] flex flex-col from-gray-900 to-gray-800 bg-gradient-to-br">
            <div className="flex-1 overflow-y-auto scrollbar-hide p-3 md:p-6 max-w-5xl mx-auto w-full px-6 pb-[120px]">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3 mb-6">
                    <div>
                        <h1 className="text-2xl md:text-3xl font-bold text-white">Dashboard do sistema</h1>
                        <p className="text-sm text-gray-400 mt-1">Visão geral de usuários, conteúdo e aquisição</p>
                    </div>

                    <button
                        onClick={carregar}
                        className="bg-gray-700 hover:bg-gray-600 text-white p-2 rounded-lg transition-colors"
                    >
                        <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                    </button>
                </div>

                {erro && (
                    <div className="mb-4 bg-red-500/10 border border-red-500/30 text-red-300 text-sm rounded-lg p-3">
                        {erro}
                    </div>
                )}

                {/* KPIs */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-6 mb-6">
                    <CardKpi
                        titulo="Usuários"
                        valor={resumo?.total_usuarios ?? '-'}
                        icone={Users}
                        cor="from-green-500 to-green-600"
                        subtexto={`${resumo?.usuarios_verificados ?? 0} verificados`}
                    />
                    <CardKpi
                        titulo="Novos usuários"
                        valor={resumo?.novos_usuarios_30d ?? '-'}
                        icone={UserPlus}
                        cor="from-blue-500 to-blue-600"
                        subtexto="Últimos 30 dias"
                    />
                    <CardKpi
                        titulo="Categorias"
                        valor={resumo?.total_categorias ?? '-'}
                        icone={Layers}
                        cor="from-purple-500 to-purple-600"
                        subtexto="Ativas"
                    />
                    <CardKpi
                        titulo="Frases"
                        valor={resumo?.total_frases ?? '-'}
                        icone={BookOpen}
                        cor="from-yellow-500 to-yellow-600"
                        subtexto="Cadastradas"
                    />
                </div>

                <div className="space-y-4">
                    {/* Crescimento de usuários */}
                    <Secao titulo="Crescimento de usuários (30 dias)" icone={UserPlus} cor="text-blue-400">
                        <div className="h-56 md:h-72">
                            {loading ? (
                                <div className="flex items-center justify-center h-full">
                                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-400"></div>
                                </div>
                            ) : crescimento.length > 0 ? (
                                <ResponsiveContainer width="100%" height="100%">
                                    <AreaChart data={crescimento}>
                                        <defs>
                                            <linearGradient id="colorNovos" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#00ff88" stopOpacity={0.3} />
                                                <stop offset="95%" stopColor="#00ff88" stopOpacity={0} />
                                            </linearGradient>
                                        </defs>
                                        <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                                        <XAxis dataKey="data" stroke="#9CA3AF" tick={{ fontSize: 12 }} />
                                        <YAxis allowDecimals={false} stroke="#9CA3AF" tick={{ fontSize: 12 }} />
                                        <Tooltip
                                            contentStyle={{
                                                backgroundColor: '#1F2937',
                                                border: 'none',
                                                borderRadius: '8px',
                                                fontSize: '12px'
                                            }}
                                            formatter={(value) => [value, 'novos usuários']}
                                        />
                                        <Area
                                            type="monotone"
                                            dataKey="novos_usuarios"
                                            stroke="#00ff88"
                                            strokeWidth={2}
                                            fill="url(#colorNovos)"
                                        />
                                    </AreaChart>
                                </ResponsiveContainer>
                            ) : (
                                <div className="flex flex-col items-center justify-center h-full text-gray-400">
                                    <AlertCircle className="w-12 h-12 mb-2 text-gray-600" />
                                    <p className="text-sm">Sem dados no período</p>
                                </div>
                            )}
                        </div>
                    </Secao>

                    <div className="grid md:grid-cols-2 gap-4">
                        <Secao titulo="Usuários por plano" icone={Users} cor="text-green-400">
                            <ListaComBarra dados={usuariosPorPlano} vazio="Nenhum dado de plano encontrado" />
                        </Secao>

                        <Secao titulo="Idiomas mais aprendidos" icone={BookOpen} cor="text-yellow-400">
                            <ListaComBarra dados={idiomas} vazio="Nenhum idioma encontrado" />
                        </Secao>
                    </div>

                    <Secao titulo="Canais de aquisição" icone={BadgeCheck} cor="text-purple-400">
                        <ListaComBarra dados={canaisAquisicao} vazio="Nenhum canal registrado" />
                    </Secao>

                    <Secao titulo="Países liberados para cadastro" icone={Globe} cor="text-cyan-400">
                        <p className="text-gray-400 text-xs mb-4">
                            Só afeta cadastro novo (tradicional e primeiro login com Google) - quem já tem conta continua acessando de qualquer país.
                        </p>

                        <div className="flex flex-wrap gap-2 mb-4">
                            {paises.length === 0 && (
                                <p className="text-gray-500 text-sm">Nenhum país liberado - ninguém consegue se cadastrar.</p>
                            )}
                            {paises.map((pais) => (
                                <div
                                    key={pais.codigo}
                                    className="flex items-center gap-2 bg-gray-700/60 border border-gray-600 rounded-full pl-3 pr-1.5 py-1"
                                >
                                    <span className="text-white text-sm">{pais.nome}</span>
                                    <span className="text-gray-400 text-xs">{pais.codigo}</span>
                                    <button
                                        type="button"
                                        onClick={() => removerPais(pais.codigo)}
                                        className="text-gray-400 hover:text-red-400 rounded-full p-0.5"
                                        title="Remover"
                                    >
                                        <X className="w-3.5 h-3.5" />
                                    </button>
                                </div>
                            ))}
                        </div>

                        <form onSubmit={adicionarPais} className="flex flex-wrap items-end gap-2">
                            <div>
                                <label className="block text-xs text-gray-400 mb-1">Código</label>
                                <input
                                    type="text"
                                    maxLength={2}
                                    placeholder="PT"
                                    value={novoCodigoPais}
                                    onChange={(e) => setNovoCodigoPais(e.target.value)}
                                    className="w-20 bg-gray-900 border border-gray-600 rounded-lg px-3 py-2 text-white text-sm uppercase"
                                />
                            </div>
                            <div>
                                <label className="block text-xs text-gray-400 mb-1">Nome</label>
                                <input
                                    type="text"
                                    placeholder="Portugal"
                                    value={novoNomePais}
                                    onChange={(e) => setNovoNomePais(e.target.value)}
                                    className="bg-gray-900 border border-gray-600 rounded-lg px-3 py-2 text-white text-sm"
                                />
                            </div>
                            <button
                                type="submit"
                                disabled={salvandoPais}
                                className="flex items-center gap-1 bg-cyan-600 hover:bg-cyan-500 disabled:brightness-75 text-white text-sm font-medium px-3 py-2 rounded-lg"
                            >
                                <Plus className="w-4 h-4" />
                                Adicionar
                            </button>
                        </form>

                        {erroPaises && (
                            <p className="text-red-400 text-xs mt-2">{erroPaises}</p>
                        )}
                    </Secao>
                </div>
            </div>

            <div className="sticky inset-x-0 bottom-0 z-10 text-center w-full">
                <div className='flex left-0 w-full justify-center py-2'>
                    <button type="button" onClick={() => navigate('/home')}>
                        <div className='p-3 flex justify-center items-center'>
                            <Home width={38} height={38} className='text-green-400' />
                        </div>
                    </button>
                </div>
            </div>
        </div>
    );
}

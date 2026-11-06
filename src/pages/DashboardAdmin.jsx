import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
    AreaChart, Area, LineChart, Line, Legend, XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer
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
    LogOut,
    Activity,
    Search,
    ChevronLeft,
    ChevronRight,
    X,
    TrendingUp,
    Clock,
    BarChart3,
    PieChart
} from 'lucide-react';

const CORES = ['#00ff88', '#4ecdc4', '#ffe66d', '#c3447a', '#a78bfa', '#f472b6'];

export default function DashboardAdmin() {
    const navigate = useNavigate();
    const API_URL = import.meta.env.VITE_API_URL;

    const [loading, setLoading] = useState(false);
    const [erro, setErro] = useState(null);
    const [resumo, setResumo] = useState(null);
    const [crescimento, setCrescimento] = useState([]);
    const [usuariosPorPlano, setUsuariosPorPlano] = useState([]);
    const [canaisAquisicao, setCanaisAquisicao] = useState([]);
    const [idiomas, setIdiomas] = useState([]);
    const [atividadeDiaria, setAtividadeDiaria] = useState([]);
    const [usoPorModo, setUsoPorModo] = useState([]);

    // Lista de usuários individuais - o dashboard até aqui só tinha números
    // agregados, nunca um usuário específico pra abrir e ver a evolução dele.
    const [usuarios, setUsuarios] = useState([]);
    const [carregandoUsuarios, setCarregandoUsuarios] = useState(false);
    const [erroUsuarios, setErroUsuarios] = useState('');
    const [buscaUsuario, setBuscaUsuario] = useState('');
    const [paginaUsuarios, setPaginaUsuarios] = useState(1);
    const [totalPaginasUsuarios, setTotalPaginasUsuarios] = useState(1);

    const [usuarioSelecionadoId, setUsuarioSelecionadoId] = useState(null);
    const [detalhesUsuario, setDetalhesUsuario] = useState(null);
    const [carregandoDetalhes, setCarregandoDetalhes] = useState(false);
    const [erroDetalhes, setErroDetalhes] = useState('');

    // Aba do menu lateral - antes tudo ficava empilhado numa página só e
    // comprida demais; agora cada aba mostra só o conteúdo dela.
    const [abaSelecionada, setAbaSelecionada] = useState('visao_geral');
    const ABAS = [
        { id: 'visao_geral', titulo: 'Visão geral', icone: BarChart3 },
        { id: 'engajamento', titulo: 'Engajamento', icone: Activity },
        { id: 'usuarios', titulo: 'Usuários', icone: Users },
        { id: 'distribuicao', titulo: 'Distribuição', icone: PieChart },
    ];

    // Login próprio do dashboard (DashboardAdminLogin.jsx), independente da
    // conta de usuário do app - ver model/DashboardAuth.php. Token ausente
    // ou rejeitado (403, sessão expirada) manda de volta pro login; nunca
    // tenta reaproveitar o token da conta normal do Zaldemy.
    const adminToken = localStorage.getItem("dashboard_admin_token");
    const autorizado = !!adminToken;

    useEffect(() => {
        if (!autorizado) {
            navigate('/dashboard-admin-login', { replace: true });
        }
    }, [autorizado]);

    function sairDoAdmin() {
        fetch(`${API_URL}/controller/dashboardAuth.php`, {
            method: 'POST',
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ action: 'logout', token: adminToken })
        }).catch(() => { });

        localStorage.removeItem("dashboard_admin_token");
        navigate('/dashboard-admin-login', { replace: true });
    }

    async function carregarUsuarios(pagina = 1, busca = buscaUsuario) {
        setCarregandoUsuarios(true);
        setErroUsuarios('');
        try {
            const response = await fetch(`${API_URL}/controller/dashboard.php`, {
                method: 'POST',
                headers: {
                    "Authorization": "Bearer " + adminToken,
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({ action: 'listar_usuarios', pagina, por_pagina: 20, busca })
            });
            const data = await response.json();

            if (response.status === 403) {
                sairDoAdmin();
                return;
            }

            // Sem essa checagem, uma resposta de erro (ex: backend ainda sem
            // essa action, deploy desatualizado) caía direto em "usuarios: []"
            // e a tela mostrava "nenhum usuário encontrado" como se a busca
            // tivesse batido zero, escondendo o erro de verdade.
            if (!response.ok || data.error) {
                setErroUsuarios(data.error || 'Não foi possível carregar os usuários.');
                setUsuarios([]);
                return;
            }

            setUsuarios(data.usuarios || []);
            setPaginaUsuarios(data.pagina || 1);
            setTotalPaginasUsuarios(data.total_paginas || 1);
        } catch (error) {
            console.error('Erro ao carregar usuários:', error);
            setErroUsuarios('Erro de conexão ao carregar os usuários.');
        } finally {
            setCarregandoUsuarios(false);
        }
    }

    async function abrirDetalhesUsuario(id) {
        setUsuarioSelecionadoId(id);
        setDetalhesUsuario(null);
        setErroDetalhes('');
        setCarregandoDetalhes(true);
        try {
            const response = await fetch(`${API_URL}/controller/dashboard.php`, {
                method: 'POST',
                headers: {
                    "Authorization": "Bearer " + adminToken,
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({ action: 'detalhes_usuario', user_id: id })
            });
            const data = await response.json();

            // Mesmo cuidado de carregarUsuarios - uma resposta de erro aqui
            // (ex: deploy desatualizado) não pode ser tratada como
            // detalhesUsuario de verdade, senão o modal tenta ler
            // data.usuario.nome de um objeto sem essa chave e quebra.
            if (!response.ok || data.error) {
                setErroDetalhes(data.error || 'Não foi possível carregar os detalhes.');
                return;
            }

            setDetalhesUsuario(data);
        } catch (error) {
            console.error('Erro ao carregar detalhes do usuário:', error);
            setErroDetalhes('Erro de conexão ao carregar os detalhes.');
        } finally {
            setCarregandoDetalhes(false);
        }
    }

    function buscarUsuarios(e) {
        e.preventDefault();
        carregarUsuarios(1, buscaUsuario);
    }

    async function carregar() {
        setLoading(true);
        setErro(null);

        try {
            const response = await fetch(`${API_URL}/controller/dashboard.php`, {
                method: 'POST',
                headers: {
                    "Authorization": "Bearer " + adminToken,
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({ action: 'dashboard', dias: 30 })
            });

            const data = await response.json();

            // Sessão de admin expirada/rejeitada (ver DashboardAuth::validarSessaoAtiva)
            // - manda de volta pro login em vez de só mostrar erro genérico.
            if (response.status === 403) {
                sairDoAdmin();
                return;
            }

            if (!response.ok) {
                setErro(data.error || 'Não foi possível carregar o dashboard.');
                return;
            }

            setResumo(data.resumo || null);
            setCrescimento(data.crescimento || []);
            setUsuariosPorPlano(data.usuarios_por_plano || []);
            setCanaisAquisicao(data.canais_aquisicao || []);
            setIdiomas(data.idiomas_mais_aprendidos || []);
            setAtividadeDiaria(data.atividade_diaria || []);
            setUsoPorModo(data.uso_por_modo_treino || []);
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
            carregarUsuarios(1, '');
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

    // Sem token: o useEffect acima já redireciona pro login - evita
    // renderizar o dashboard por 1 frame antes do redirect acontecer.
    if (!autorizado) {
        return (
            <div className="h-dvh flex flex-col items-center justify-center from-gray-900 to-gray-800 bg-gradient-to-br text-center px-6">
                <ShieldAlert className="w-12 h-12 text-gray-500 mb-3" />
            </div>
        );
    }

    return (
        <div className="h-dvh flex flex-col from-gray-900 to-gray-800 bg-gradient-to-br">
            <div className="flex-1 min-h-0 flex flex-col p-3 md:p-6 max-w-6xl mx-auto w-full px-6 pb-[90px]">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3 mb-4 shrink-0">
                    <div>
                        <h1 className="text-2xl md:text-3xl font-bold text-white">Dashboard do sistema</h1>
                        <p className="text-sm text-gray-400 mt-1">Visão geral de usuários, conteúdo e aquisição</p>
                    </div>

                    <div className="flex items-center gap-2">
                        <button
                            onClick={carregar}
                            className="bg-gray-700 hover:bg-gray-600 text-white p-2 rounded-lg transition-colors"
                        >
                            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                        </button>
                        <button
                            onClick={sairDoAdmin}
                            className="bg-gray-700 hover:bg-gray-600 text-white p-2 rounded-lg transition-colors"
                            title="Sair"
                        >
                            <LogOut className="w-4 h-4" />
                        </button>
                    </div>
                </div>

                {erro && (
                    <div className="mb-4 bg-red-500/10 border border-red-500/30 text-red-300 text-sm rounded-lg p-3 shrink-0">
                        {erro}
                    </div>
                )}

                {/* KPIs - sempre visíveis, independente da aba selecionada */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-6 mb-4 shrink-0">
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

                <div className="flex-1 min-h-0 flex flex-col md:flex-row gap-4">
                    {/* Menu lateral - linha horizontal rolável no celular, coluna
                        fixa à esquerda a partir de md. */}
                    <nav className="flex md:flex-col gap-2 overflow-x-auto md:overflow-visible shrink-0 md:w-48 pb-1 md:pb-0">
                        {ABAS.map((aba) => {
                            const Icone = aba.icone;
                            const ativa = abaSelecionada === aba.id;
                            return (
                                <button
                                    key={aba.id}
                                    onClick={() => setAbaSelecionada(aba.id)}
                                    className={`flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm font-medium whitespace-nowrap transition-colors border ${ativa
                                        ? 'bg-[#4cb8c4]/15 text-[#4cb8c4] border-[#4cb8c4]/40'
                                        : 'text-gray-400 border-transparent hover:bg-gray-800/50 hover:text-white'
                                        }`}
                                >
                                    <Icone className="w-4 h-4" />
                                    {aba.titulo}
                                </button>
                            );
                        })}
                    </nav>

                    <div className="flex-1 min-h-0 overflow-y-auto scrollbar-hide space-y-4">
                    {abaSelecionada === 'visao_geral' && (
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
                    )}

                    {/* Engajamento: quem está treinando/jogando/usando IA de fato,
                        não só quem se cadastrou - pedido explícito pra acompanhar
                        uso real do app dia a dia. */}
                    {abaSelecionada === 'engajamento' && (
                    <>
                    <Secao titulo="Atividade diária por tipo de treino (30 dias)" icone={Activity} cor="text-emerald-400">
                        <div className="h-56 md:h-72">
                            {loading ? (
                                <div className="flex items-center justify-center h-full">
                                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-400"></div>
                                </div>
                            ) : atividadeDiaria.length > 0 ? (
                                <ResponsiveContainer width="100%" height="100%">
                                    <LineChart data={atividadeDiaria}>
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
                                        />
                                        <Legend wrapperStyle={{ fontSize: '12px' }} />
                                        <Line type="monotone" dataKey="treino_geral" name="Flashcards/treino geral" stroke={CORES[0]} strokeWidth={2} dot={false} />
                                        <Line type="monotone" dataKey="jogos" name="Jogos" stroke={CORES[1]} strokeWidth={2} dot={false} />
                                        <Line type="monotone" dataKey="treino_ia" name="Treino com IA" stroke={CORES[2]} strokeWidth={2} dot={false} />
                                    </LineChart>
                                </ResponsiveContainer>
                            ) : (
                                <div className="flex flex-col items-center justify-center h-full text-gray-400">
                                    <AlertCircle className="w-12 h-12 mb-2 text-gray-600" />
                                    <p className="text-sm">Sem dados no período</p>
                                </div>
                            )}
                        </div>
                        <p className="text-gray-500 text-xs mt-2">Usuários únicos por dia em cada tipo de atividade.</p>
                    </Secao>

                    <Secao titulo="Uso por modo de treino (30 dias)" icone={BookOpen} cor="text-orange-400">
                        <ListaComBarra dados={usoPorModo} vazio="Nenhum uso registrado no período" />
                    </Secao>
                    </>
                    )}

                    {abaSelecionada === 'distribuicao' && (
                    <>
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
                    </>
                    )}

                    {abaSelecionada === 'usuarios' && (
                    <Secao titulo="Usuários" icone={Users} cor="text-cyan-400">
                        <form onSubmit={buscarUsuarios} className="flex gap-2 mb-4">
                            <div className="relative flex-1">
                                <Search className="w-4 h-4 text-gray-500 absolute left-3 top-1/2 -translate-y-1/2" />
                                <input
                                    type="text"
                                    placeholder="Buscar por nome, apelido ou e-mail..."
                                    value={buscaUsuario}
                                    onChange={(e) => setBuscaUsuario(e.target.value)}
                                    className="w-full bg-gray-900 border border-gray-600 rounded-lg pl-9 pr-3 py-2 text-white text-sm"
                                />
                            </div>
                            <button
                                type="submit"
                                className="bg-cyan-600 hover:bg-cyan-500 text-white text-sm font-medium px-4 py-2 rounded-lg"
                            >
                                Buscar
                            </button>
                        </form>

                        {erroUsuarios && (
                            <div className="mb-3 bg-red-500/10 border border-red-500/30 text-red-300 text-sm rounded-lg p-3">
                                {erroUsuarios}
                            </div>
                        )}

                        {carregandoUsuarios ? (
                            <div className="flex items-center justify-center py-10">
                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-400"></div>
                            </div>
                        ) : erroUsuarios ? null : usuarios.length === 0 ? (
                            <div className="text-center py-6 text-gray-400 text-sm">
                                <AlertCircle className="w-10 h-10 mx-auto mb-2 text-gray-600" />
                                <p>Nenhum usuário encontrado</p>
                            </div>
                        ) : (
                            <div className="space-y-2">
                                {usuarios.map((u) => (
                                    <button
                                        key={u.id}
                                        onClick={() => abrirDetalhesUsuario(u.id)}
                                        className="w-full flex items-center justify-between gap-3 bg-gray-900/50 hover:bg-gray-900 border border-gray-700 rounded-lg px-3 py-2.5 text-left transition-colors"
                                    >
                                        <div className="min-w-0">
                                            <p className="text-white text-sm font-medium truncate">{u.nome || u.apelido}</p>
                                            <p className="text-gray-500 text-xs truncate">{u.email}</p>
                                        </div>
                                        <div className="flex items-center gap-3 shrink-0">
                                            <span className="text-xs text-gray-400 hidden sm:inline">{u.total_categorias} cat · {u.total_frases} frases</span>
                                            <span className="text-xs px-2 py-1 rounded-full bg-gray-700 text-gray-300 capitalize">{u.plano_nome}</span>
                                        </div>
                                    </button>
                                ))}
                            </div>
                        )}

                        {totalPaginasUsuarios > 1 && (
                            <div className="flex items-center justify-center gap-3 mt-4">
                                <button
                                    onClick={() => carregarUsuarios(paginaUsuarios - 1)}
                                    disabled={paginaUsuarios <= 1}
                                    className="p-1.5 rounded-lg bg-gray-700 hover:bg-gray-600 disabled:opacity-40 text-white"
                                >
                                    <ChevronLeft className="w-4 h-4" />
                                </button>
                                <span className="text-sm text-gray-400">{paginaUsuarios} / {totalPaginasUsuarios}</span>
                                <button
                                    onClick={() => carregarUsuarios(paginaUsuarios + 1)}
                                    disabled={paginaUsuarios >= totalPaginasUsuarios}
                                    className="p-1.5 rounded-lg bg-gray-700 hover:bg-gray-600 disabled:opacity-40 text-white"
                                >
                                    <ChevronRight className="w-4 h-4" />
                                </button>
                            </div>
                        )}
                    </Secao>
                    )}
                    </div>
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

            {usuarioSelecionadoId && (
                <div
                    className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4"
                    onClick={() => setUsuarioSelecionadoId(null)}
                >
                    <div
                        className="bg-gray-800 border border-gray-700 rounded-2xl w-full max-w-lg max-h-[85vh] overflow-y-auto scrollbar-hide"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="sticky top-0 bg-gray-800 border-b border-gray-700 flex items-center justify-between p-4">
                            <h3 className="text-white font-semibold">Detalhes do usuário</h3>
                            <button
                                onClick={() => setUsuarioSelecionadoId(null)}
                                className="text-gray-400 hover:text-white p-1"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="p-4 space-y-4">
                            {erroDetalhes ? (
                                <div className="bg-red-500/10 border border-red-500/30 text-red-300 text-sm rounded-lg p-3">
                                    {erroDetalhes}
                                </div>
                            ) : carregandoDetalhes || !detalhesUsuario ? (
                                <div className="flex items-center justify-center py-10">
                                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-400"></div>
                                </div>
                            ) : (
                                <>
                                    <div>
                                        <p className="text-white text-lg font-semibold">{detalhesUsuario.usuario.nome || detalhesUsuario.usuario.apelido}</p>
                                        <p className="text-gray-400 text-sm">{detalhesUsuario.usuario.email}</p>
                                        <div className="flex flex-wrap gap-2 mt-2">
                                            <span className="text-xs px-2 py-1 rounded-full bg-gray-700 text-gray-300 capitalize">{detalhesUsuario.usuario.plano_nome}</span>
                                            {detalhesUsuario.usuario.email_verified && (
                                                <span className="text-xs px-2 py-1 rounded-full bg-green-500/20 text-green-400">E-mail verificado</span>
                                            )}
                                            {detalhesUsuario.usuario.idioma_nativo && detalhesUsuario.usuario.idioma_aprendendo && (
                                                <span className="text-xs px-2 py-1 rounded-full bg-gray-700 text-gray-300">
                                                    {detalhesUsuario.usuario.idioma_nativo} → {detalhesUsuario.usuario.idioma_aprendendo}
                                                </span>
                                            )}
                                        </div>
                                        <p className="text-gray-500 text-xs mt-2">
                                            Cadastrado em {new Date(detalhesUsuario.usuario.create_date).toLocaleDateString('pt-BR')}
                                        </p>
                                    </div>

                                    <div className="grid grid-cols-3 gap-3">
                                        <div className="bg-gray-900/50 rounded-lg p-3 text-center">
                                            <p className="text-xl font-bold text-white">{detalhesUsuario.total_categorias}</p>
                                            <p className="text-xs text-gray-400">Categorias</p>
                                        </div>
                                        <div className="bg-gray-900/50 rounded-lg p-3 text-center">
                                            <p className="text-xl font-bold text-white">{detalhesUsuario.total_frases}</p>
                                            <p className="text-xs text-gray-400">Frases</p>
                                        </div>
                                        <div className="bg-gray-900/50 rounded-lg p-3 text-center">
                                            <Clock className="w-4 h-4 text-gray-500 mx-auto mb-1" />
                                            <p className="text-xs text-gray-400">
                                                {detalhesUsuario.ultimo_treino
                                                    ? new Date(detalhesUsuario.ultimo_treino).toLocaleDateString('pt-BR')
                                                    : 'Nunca treinou'}
                                            </p>
                                        </div>
                                    </div>

                                    <div>
                                        <div className="flex items-center gap-2 mb-3">
                                            <TrendingUp className="w-4 h-4 text-emerald-400" />
                                            <h4 className="text-sm font-semibold text-white">Evolução das frases</h4>
                                        </div>
                                        <ListaComBarra dados={detalhesUsuario.distribuicao_treino} vazio="Nenhuma frase cadastrada" />
                                    </div>

                                    <div>
                                        <div className="flex items-center gap-2 mb-3">
                                            <Activity className="w-4 h-4 text-orange-400" />
                                            <h4 className="text-sm font-semibold text-white">Atividade nos últimos {detalhesUsuario.dias_considerados} dias</h4>
                                        </div>
                                        <ListaComBarra dados={detalhesUsuario.uso_por_modo} vazio="Sem atividade no período" />
                                    </div>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

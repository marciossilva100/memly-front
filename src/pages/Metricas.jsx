import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import {
    AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer,
    PieChart, Pie, Cell
} from "recharts";
import {
    TrendingUp,
    Target,
    Award,
    Clock,
    RefreshCw,
    BookOpen,
    CheckCircle,
    XCircle,
    ChevronDown,
    ChevronUp,
    AlertCircle,
    PieChart as PieChartIcon,
    BarChart3,
    Layers
} from 'lucide-react';

export default function Metricas() {
    const [dadosGrafico, setDadosGrafico] = useState([]);
    const [dadosCategorias, setDadosCategorias] = useState([]);
    const [frasesPorCategoria, setFrasesPorCategoria] = useState({});
    const [loading, setLoading] = useState(false);
    const [loadingFrases, setLoadingFrases] = useState(false);
    const [periodo, setPeriodo] = useState('30d');
const API_URL = import.meta.env.VITE_API_URL;
    // Estados para controlar os dropdowns
    const [dropdownsAbertos, setDropdownsAbertos] = useState({
        resumo: true, // Começa aberto pra mostrar o básico
        grafico: false,
        categorias: false,
        frases: false
    });

    // Estado para controlar qual categoria está expandida
    const [categoriaExpandida, setCategoriaExpandida] = useState(null);

    const [metricasGerais, setMetricasGerais] = useState({
        totalAcertos: 0,
        totalQuestoes: 0,
        taxaAcerto: 0,
        streakAtual: 0
    });

    const navigate = useNavigate();
    const cores = ['#00ff88', '#ff6b6b', '#4ecdc4', '#ffe66d', '#c3447a', '#a78bfa', '#f472b6'];

    // Buscar métricas do dashboard
    async function carregarDashboard() {
        setLoading(true);

        try {
            const response = await fetch(`${API_URL}/controller/metricas.php`, {
                method: 'POST',
                headers: {
                    "Authorization": "Bearer " + localStorage.getItem("token"),
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    action: 'dashboard',
                    periodo: periodo
                })
            });

            const data = await response.json();

            if (response.ok) {
                setDadosGrafico(data.grafico || []);
                setDadosCategorias(data.categorias || []);

                setMetricasGerais({
                    totalQuestoes: data.resumo?.total || 0,
                    totalAcertos: data.resumo?.acertos || 0,
                    taxaAcerto: data.resumo?.taxa_acerto || 0,
                    streakAtual: data.streak || 0
                });
            }
        } catch (error) {
            console.error('Erro ao carregar dashboard:', error);
        } finally {
            setLoading(false);
        }
    }

    // Buscar frases organizadas por categoria
    async function carregarFrasesPorCategoria() {
        setLoadingFrases(true);

        try {
            const response = await fetch(`${API_URL}/controller/metricas.php?action=listar_frases_metricas`, {
                method: 'GET',
                headers: {
                    "Authorization": "Bearer " + localStorage.getItem("token"),
                    "Content-Type": "application/json"
                }
            });

            const data = await response.json();

            if (response.ok && data.frases) {
                // Organizar frases por categoria
                const agrupadas = {};
                data.frases.forEach(frase => {
                    const categoria = frase.categoria || 'Sem categoria';
                    if (!agrupadas[categoria]) {
                        agrupadas[categoria] = [];
                    }
                    agrupadas[categoria].push(frase);
                });
                setFrasesPorCategoria(agrupadas);
            }
        } catch (error) {
            console.error('Erro ao carregar frases:', error);
        } finally {
            setLoadingFrases(false);
        }
    }

    // Alternar dropdown
    const toggleDropdown = (key) => {
        setDropdownsAbertos(prev => ({
            ...prev,
            [key]: !prev[key]
        }));
    };

    useEffect(() => {
        carregarDashboard();
        carregarFrasesPorCategoria();
    }, [periodo]);

    // Card de métrica
    const CardMetrica = ({ titulo, valor, icone: Icone, cor, subtexto }) => (
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

    // Componente de Dropdown
    const DropdownSection = ({ titulo, icone: Icone, aberto, onToggle, children, cor = "text-green-400" }) => (
        <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl border border-gray-700 overflow-hidden">
            <button
                onClick={onToggle}
                className="w-full px-4 md:px-6 py-3 md:py-4 flex items-center justify-between hover:bg-gray-700/50 transition-colors"
            >
                <div className="flex items-center gap-2">
                    <Icone className={`w-5 h-5 ${cor}`} />
                    <h3 className="text-base md:text-lg font-semibold text-white">{titulo}</h3>
                </div>
                {aberto ? <ChevronUp className="w-5 h-5 text-gray-400" /> : <ChevronDown className="w-5 h-5 text-gray-400" />}
            </button>

            {aberto && (
                <div className="p-4 md:p-6 border-t border-gray-700">
                    {children}
                </div>
            )}
        </div>
    );

    // Componente de Categoria (com suas frases)
    const CategoriaSection = ({ categoria, frases, isExpandida, onToggle }) => {
        // Calcular média da categoria
        const totalFrases = frases.length;
        const frasesComTentativas = frases.filter(f => f.total_tentativas > 0);
        const mediaCategoria = frasesComTentativas.length > 0
            ? Math.round(frasesComTentativas.reduce((acc, f) => acc + (f.taxa_acerto || 0), 0) / frasesComTentativas.length)
            : 0;

        return (
            <div className="border border-gray-700 rounded-lg overflow-hidden">
                <button
                    onClick={onToggle}
                    className="w-full px-4 py-3 bg-gray-700/30 flex items-center justify-between hover:bg-gray-700/50 transition-colors"
                >
                    <div className="flex items-center gap-3">
                        <span className="font-medium text-white">{categoria}</span>
                        <span className="text-xs text-gray-400">
                            {totalFrases} {totalFrases === 1 ? 'frase' : 'frases'}
                        </span>
                        {frasesComTentativas.length > 0 && (
                            <span className={`text-xs px-2 py-0.5 rounded-full ${mediaCategoria >= 70 ? 'bg-green-500/20 text-green-400' :
                                    mediaCategoria >= 40 ? 'bg-yellow-500/20 text-yellow-400' :
                                        'bg-red-500/20 text-red-400'
                                }`}>
                                {mediaCategoria}% média
                            </span>
                        )}
                    </div>
                    {isExpandida ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
                </button>

                {isExpandida && (
                    <div className="p-3 space-y-2 bg-gray-800/30">
                        {frases.map((frase, idx) => (
                            <div key={frase.id || idx} className="bg-gray-700/30 rounded-lg p-3 text-sm">
                                <div className="flex flex-col md:flex-row md:items-center justify-between gap-2">
                                    <div className="flex-1">
                                        <p className="text-white font-medium">{frase.frase}</p>
                                        <p className="text-gray-400 text-xs mt-0.5">{frase.traducao}</p>
                                    </div>

                                    <div className="flex items-center gap-3">
                                        {frase.total_tentativas > 0 ? (
                                            <>
                                                <div className="text-center min-w-[40px]">
                                                    <p className="text-gray-400 text-xs">Taxa</p>
                                                    <span className={`text-xs font-semibold ${frase.taxa_acerto >= 70 ? 'text-green-500' :
                                                            frase.taxa_acerto >= 40 ? 'text-yellow-500' :
                                                                'text-red-500'
                                                        }`}>
                                                        {frase.taxa_acerto}%
                                                    </span>
                                                </div>
                                                <div className="text-center min-w-[40px]">
                                                    <p className="text-gray-400 text-xs">Tent.</p>
                                                    <span className="text-white text-xs font-semibold">
                                                        {frase.total_tentativas}
                                                    </span>
                                                </div>
                                                {frase.ultima_resposta !== undefined && (
                                                    <div>
                                                        {frase.ultima_resposta ? (
                                                            <CheckCircle className="w-4 h-4 text-green-500" />
                                                        ) : (
                                                            <XCircle className="w-4 h-4 text-red-500" />
                                                        )}
                                                    </div>
                                                )}
                                            </>
                                        ) : (
                                            <span className="text-xs text-gray-500">Não iniciada</span>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        );
    };

    return (
        <div className="h-dvh  from-gray-900 to-gray-800 bg-gradient-to-br">
            <div className="p-3 md:p-6 max-w-5xl mx-auto  bg-gradient-to-br px-6">
                {/* Cabeçalho com voltar */}
                <div className="mb-4">
                    <button
                        onClick={() => navigate(-1)}
                        className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors"
                    >
                        <i className="bi bi-arrow-left text-2xl text-white"></i>
                     
                    </button>
                </div>

                {/* Header com período */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3 mb-6">
                    <div>
                        <h1 className="text-2xl md:text-3xl font-bold text-white flex items-center gap-2">
                            <TrendingUp className="w-6 h-6 md:w-8 md:h-8 text-green-400" />
                            Métricas
                        </h1>
                        <p className="text-sm text-gray-400 mt-1">
                            {metricasGerais.totalQuestoes > 0
                                ? `${metricasGerais.totalQuestoes} questões respondidas`
                                : 'Comece a estudar para ver suas métricas'}
                        </p>
                    </div>

                    <div className="flex gap-2">
                        <select
                            value={periodo}
                            onChange={(e) => setPeriodo(e.target.value)}
                            className="bg-gray-700 text-white text-sm border border-gray-600 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-green-400"
                        >
                            <option value="7d">7 dias</option>
                            <option value="30d">30 dias</option>
                            <option value="90d">90 dias</option>
                        </select>

                        <button
                            onClick={() => {
                                carregarDashboard();
                                carregarFrasesPorCategoria();
                            }}
                            className="bg-gray-700 hover:bg-gray-600 text-white p-2 rounded-lg transition-colors"
                        >
                            <RefreshCw className={`w-4 h-4 ${loading || loadingFrases ? 'animate-spin' : ''}`} />
                        </button>
                    </div>
                </div>

                {/* Cards de Resumo - Sempre visíveis */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-6 mb-4">
                    <CardMetrica
                        titulo="Taxa de Acerto"
                        valor={metricasGerais.taxaAcerto ? `${metricasGerais.taxaAcerto}%` : '0%'}
                        icone={Target}
                        cor="from-green-500 to-green-600"
                        subtexto={`${metricasGerais.totalAcertos}/${metricasGerais.totalQuestoes}`}
                    />
                    <CardMetrica
                        titulo="Streak"
                        valor={metricasGerais.streakAtual > 0 ? `${metricasGerais.streakAtual}d` : '0d'}
                        icone={Award}
                        cor="from-orange-500 to-orange-600"
                        subtexto="dias seguidos"
                    />
                </div>

                {/* Dropdowns */}
                <div className="space-y-3">
                    {/* Gráfico de Desempenho */}
                    <DropdownSection
                        titulo="Evolução do Desempenho"
                        icone={BarChart3}
                        aberto={dropdownsAbertos.grafico}
                        onToggle={() => toggleDropdown('grafico')}
                        cor="text-blue-400"
                    >
                        <div className="h-64 md:h-80">
                            {loading ? (
                                <div className="flex items-center justify-center h-full">
                                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-400"></div>
                                </div>
                            ) : dadosGrafico.length > 0 ? (
                                <ResponsiveContainer width="100%" height="100%">
                                    <AreaChart data={dadosGrafico}>
                                        <defs>
                                            <linearGradient id="colorAcerto" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#00ff88" stopOpacity={0.3} />
                                                <stop offset="95%" stopColor="#00ff88" stopOpacity={0} />
                                            </linearGradient>
                                        </defs>
                                        <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                                        <XAxis
                                            dataKey="data"
                                            stroke="#9CA3AF"
                                            tick={{ fontSize: 12 }}
                                        />
                                        <YAxis
                                            domain={[0, 100]}
                                            stroke="#9CA3AF"
                                            tick={{ fontSize: 12 }}
                                            tickFormatter={(value) => `${value}%`}
                                        />
                                        <Tooltip
                                            contentStyle={{
                                                backgroundColor: '#1F2937',
                                                border: 'none',
                                                borderRadius: '8px',
                                                fontSize: '12px'
                                            }}
                                        />
                                        <Area
                                            type="monotone"
                                            dataKey="taxa_acerto"
                                            stroke="#00ff88"
                                            strokeWidth={2}
                                            fill="url(#colorAcerto)"
                                        />
                                    </AreaChart>
                                </ResponsiveContainer>
                            ) : (
                                <div className="flex flex-col items-center justify-center h-full text-gray-400">
                                    <AlertCircle className="w-12 h-12 mb-2 text-gray-600" />
                                    <p className="text-sm">Nenhum dado no período</p>
                                </div>
                            )}
                        </div>
                    </DropdownSection>

                    {/* Categorias */}
                    {/* Categorias */}
                    <DropdownSection
                        titulo="Categorias"
                        icone={PieChartIcon}
                        aberto={dropdownsAbertos.categorias}
                        onToggle={() => toggleDropdown('categorias')}
                        cor="text-purple-400"
                    >
                        {dadosCategorias.length > 0 ? (
                            <div className="space-y-4">
                                {/* Gráfico de Pizza */}
                                <div className="h-48 md:h-64">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <PieChart>
                                            <Pie
                                                data={dadosCategorias}
                                                cx="50%"
                                                cy="50%"
                                                innerRadius={40}
                                                outerRadius={60}
                                                paddingAngle={2}
                                                dataKey="value"
                                                label={({ name, percent }) =>
                                                    `${(percent * 100).toFixed(0)}%`
                                                }
                                                labelLine={false}
                                            >
                                                {dadosCategorias.map((entry, index) => (
                                                    <Cell key={`cell-${index}`} fill={cores[index % cores.length]} />
                                                ))}
                                            </Pie>
                                            <Tooltip
                                                formatter={(value, name, props) => [
                                                    `${value} questões`,
                                                    props.payload.name
                                                ]}
                                                contentStyle={{
                                                    backgroundColor: '#1F2937',
                                                    border: 'none',
                                                    borderRadius: '8px',
                                                    fontSize: '12px'
                                                }}
                                            />
                                        </PieChart>
                                    </ResponsiveContainer>
                                </div>

                                {/* Lista de Categorias */}
                                <div className="space-y-2">
                                    <h4 className="text-sm font-medium text-gray-400 mb-2">Detalhamento por categoria:</h4>
                                    {dadosCategorias.map((categoria, index) => {
                                        // Calcular porcentagem do total
                                        const totalQuestoes = dadosCategorias.reduce((acc, cat) => acc + cat.value, 0);
                                        const porcentagem = ((categoria.value / totalQuestoes) * 100).toFixed(1);

                                        return (
                                            <div key={index} className="bg-gray-700/30 rounded-lg p-3">
                                                <div className="flex items-center justify-between mb-2">
                                                    <div className="flex items-center gap-2">
                                                        <div className={`w-3 h-3 rounded-full`} style={{ backgroundColor: cores[index % cores.length] }}></div>
                                                        <span className="text-white font-medium">{categoria.name}</span>
                                                    </div>
                                                    <span className="text-sm text-gray-300">
                                                        {categoria.value} {categoria.value === 1 ? 'questão' : 'questões'}
                                                    </span>
                                                </div>

                                                {/* Barra de progresso */}
                                                <div className="w-full bg-gray-600 rounded-full h-1.5">
                                                    <div
                                                        className="h-1.5 rounded-full"
                                                        style={{
                                                            width: `${porcentagem}%`,
                                                            backgroundColor: cores[index % cores.length]
                                                        }}
                                                    ></div>
                                                </div>

                                                {/* Porcentagem */}
                                                <div className="flex justify-end mt-1">
                                                    <span className="text-xs text-gray-400">{porcentagem}% do total</span>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>

                                {/* Total de questões */}
                                <div className="mt-4 pt-3 border-t border-gray-700 text-center">
                                    <p className="text-sm text-gray-400">
                                        Total: <span className="text-white font-semibold">
                                            {dadosCategorias.reduce((acc, cat) => acc + cat.value, 0)} questões
                                        </span>
                                    </p>
                                </div>
                            </div>
                        ) : (
                            <div className="text-center py-8 text-gray-400 text-sm">
                                <AlertCircle className="w-12 h-12 mx-auto mb-2 text-gray-600" />
                                <p>Nenhuma categoria encontrada</p>
                                <p className="text-xs mt-1">As categorias aparecerão aqui quando você responder questões</p>
                            </div>
                        )}
                    </DropdownSection>

                    {/* Frases por Categoria */}
                    <DropdownSection
                        titulo="Frases por Categoria"
                        icone={Layers}
                        aberto={dropdownsAbertos.frases}
                        onToggle={() => toggleDropdown('frases')}
                        cor="text-green-400"
                    >
                        {loadingFrases ? (
                            <div className="flex justify-center py-8">
                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-400"></div>
                            </div>
                        ) : Object.keys(frasesPorCategoria).length > 0 ? (
                            <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
                                {Object.entries(frasesPorCategoria).map(([categoria, frases]) => (
                                    <CategoriaSection
                                        key={categoria}
                                        categoria={categoria}
                                        frases={frases}
                                        isExpandida={categoriaExpandida === categoria}
                                        onToggle={() => setCategoriaExpandida(
                                            categoriaExpandida === categoria ? null : categoria
                                        )}
                                    />
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-8 text-gray-400 text-sm">
                                Nenhuma frase encontrada
                            </div>
                        )}
                    </DropdownSection>
                </div>
            </div>
        </div>
    );
}
import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";

import {
    AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer,
    BarChart, Bar, PieChart, Pie, Cell, Legend
} from "recharts";
import {
    TrendingUp,
    Users,
    Target,
    Award,
    Clock,
    Calendar,
    Download,
    RefreshCw
} from 'lucide-react';

export default function Metricas() {
    const [dadosGrafico, setDadosGrafico] = useState([]);
    const [dadosComparativos, setDadosComparativos] = useState([]);
    const [dadosCategorias, setDadosCategorias] = useState([]);
    const [loading, setLoading] = useState(false);
    const [periodo, setPeriodo] = useState('30d');
    const navigate = useNavigate();

    const [metricasGerais, setMetricasGerais] = useState({
        totalAcertos: 0,
        totalQuestoes: 0,
        tempoMedio: 0,
        streakAtual: 0
    });

    const cores = ['#00ff88', '#ff6b6b', '#4ecdc4', '#ffe66d', '#c3447a'];

    async function listMetricas() {
        setLoading(true);

        try {
            const response = await fetch('https://api.zaldemy.com/controller/metricas.php', {
                method: 'POST',
                headers: {
                    "Authorization": "Bearer " + localStorage.getItem("token"),
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    action: 'metricas_desempenho',
                    periodo: periodo
                })
            });

            const data = await response.json();

            if (data) {
                setDadosGrafico(data.grafico || []);
                setDadosComparativos(data.comparativos || gerarDadosMockComparativos());
                setDadosCategorias(data.categorias || gerarDadosMockCategorias());

                // Calcular métricas gerais
                const total = data.grafico?.reduce((acc, item) => acc + (item.total_questoes || 0), 0) || 0;
                const acertos = data.grafico?.reduce((acc, item) => acc + (item.acertos || 0), 0) || 0;

                setMetricasGerais({
                    totalAcertos: acertos,
                    totalQuestoes: total,
                    tempoMedio: data.tempo_medio || 45,
                    streakAtual: data.streak || 7
                });
            }
        } catch (error) {
            console.error('Erro ao carregar métricas:', error);
            // Carregar dados mock em caso de erro
            setDadosGrafico(gerarDadosMockGrafico());
            setDadosComparativos(gerarDadosMockComparativos());
            setDadosCategorias(gerarDadosMockCategorias());
            setMetricasGerais({
                totalAcertos: 156,
                totalQuestoes: 234,
                tempoMedio: 45,
                streakAtual: 7
            });
        } finally {
            setLoading(false);
        }
    }

    // Funções para gerar dados mock
    function gerarDadosMockGrafico() {
        return [
            { data: '01/03', taxa_acerto: 75, questoes: 12 },
            { data: '02/03', taxa_acerto: 82, questoes: 15 },
            { data: '03/03', taxa_acerto: 68, questoes: 10 },
            { data: '04/03', taxa_acerto: 90, questoes: 18 },
            { data: '05/03', taxa_acerto: 85, questoes: 14 },
            { data: '06/03', taxa_acerto: 78, questoes: 16 },
            { data: '07/03', taxa_acerto: 92, questoes: 20 },
        ];
    }

    function gerarDadosMockComparativos() {
        return [
            { nome: 'Segunda', atual: 75, anterior: 70 },
            { nome: 'Terça', atual: 82, anterior: 68 },
            { nome: 'Quarta', atual: 68, anterior: 72 },
            { nome: 'Quinta', atual: 90, anterior: 65 },
            { nome: 'Sexta', atual: 85, anterior: 80 },
        ];
    }

    function gerarDadosMockCategorias() {
        return [
            { name: 'Matemática', value: 35 },
            { name: 'Português', value: 28 },
            { name: 'Ciências', value: 22 },
            { name: 'História', value: 15 },
        ];
    }

    useEffect(() => {
        listMetricas();
    }, [periodo]);

    const CardMetrica = ({ titulo, valor, icone: Icone, cor, subtexto }) => (
        <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-gray-700 hover:border-gray-600 transition-all">
            <div className="flex items-center justify-between">
                <div>
                    <p className="text-gray-400 text-sm font-medium">{titulo}</p>
                    <p className="text-3xl font-bold text-white mt-2">{valor}</p>
                    {subtexto && <p className="text-sm text-gray-500 mt-1">{subtexto}</p>}
                </div>
                <div className={`p-3 rounded-lg bg-gradient-to-br ${cor}`}>
                    <Icone className="w-6 h-6 text-white" />
                </div>
            </div>
        </div>
    );

    return (
        <div className="h-dvh  from-gray-900 to-gray-800">
            
            <div className="bg-gradient-to-br p-6">
                 <div className="relative mb-4 ">
                <div
                    className="left-0  cursor-pointer"
                    onClick={() => navigate(-1)}
                >
                    <i className="bi bi-arrow-left text-2xl text-white"></i>
                </div>
            </div>

                {/* Header */}
                <div className="max-w-7xl mx-auto mb-8 ">
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                        <div>
                            <h1 className="text-3xl font-bold text-white flex items-center gap-2">
                                <TrendingUp className="w-8 h-8 text-green-400" />
                                Métricas de Desempenho
                            </h1>
                            <p className="text-gray-400 mt-1">Acompanhe sua evolução nos estudos</p>
                        </div>

                        <div className="flex gap-3">
                            <select
                                value={periodo}
                                onChange={(e) => setPeriodo(e.target.value)}
                                className="bg-gray-700 text-white border border-gray-600 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-green-400"
                            >
                                <option value="7d">Últimos 7 dias</option>
                                <option value="30d">Últimos 30 dias</option>
                                <option value="90d">Últimos 90 dias</option>
                                <option value="12m">Últimos 12 meses</option>
                            </select>

                            <button
                                onClick={() => listMetricas()}
                                className="bg-gray-700 hover:bg-gray-600 text-white p-2 rounded-lg transition-colors"
                            >
                                <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
                            </button>

                            <button className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors">
                                <Download className="w-4 h-4" />
                                Exportar
                            </button>
                        </div>
                    </div>
                </div>

                {/* Cards de Métricas */}
                <div className="max-w-7xl mx-auto mb-8">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        <CardMetrica
                            titulo="Taxa de Acerto"
                            valor={`${dadosGrafico.length ? Math.round(dadosGrafico.reduce((acc, item) => acc + item.taxa_acerto, 0) / dadosGrafico.length) : 82}%`}
                            icone={Target}
                            cor="from-green-500 to-green-600"
                            subtexto={`${dadosGrafico.length} dias analisados`}
                        />

                        <CardMetrica
                            titulo="Questões Respondidas"
                            valor={metricasGerais.totalQuestoes}
                            icone={Users}
                            cor="from-blue-500 to-blue-600"
                            subtexto={`${metricasGerais.totalAcertos} acertos`}
                        />

                        <CardMetrica
                            titulo="Tempo Médio"
                            valor={`${metricasGerais.tempoMedio}s`}
                            icone={Clock}
                            cor="from-purple-500 to-purple-600"
                            subtexto="por questão"
                        />

                        <CardMetrica
                            titulo="Streak Atual"
                            valor={`${metricasGerais.streakAtual} dias`}
                            icone={Award}
                            cor="from-orange-500 to-orange-600"
                            subtexto="🔥 Melhor: 15 dias"
                        />
                    </div>
                </div>

                {/* Gráficos */}
                <div className="max-w-7xl mx-auto">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                        {/* Gráfico de Área - Desempenho */}
                        <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-gray-700">
                            <div className="flex justify-between items-center mb-4">
                                <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                                    <TrendingUp className="w-5 h-5 text-green-400" />
                                    Evolução da Taxa de Acerto
                                </h3>
                                <span className="text-sm text-gray-400">vs. média anterior</span>
                            </div>

                            <div className="h-80">
                                {loading ? (
                                    <div className="flex items-center justify-center h-full">
                                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-400"></div>
                                    </div>
                                ) : (
                                    <ResponsiveContainer width="100%" height="100%">
                                        <AreaChart data={dadosGrafico}>
                                            <defs>
                                                <linearGradient id="colorAcerto" x1="0" y1="0" x2="0" y2="1">
                                                    <stop offset="5%" stopColor="#00ff88" stopOpacity={0.3} />
                                                    <stop offset="95%" stopColor="#00ff88" stopOpacity={0} />
                                                </linearGradient>
                                            </defs>
                                            <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                                            <XAxis dataKey="data" stroke="#9CA3AF" />
                                            <YAxis domain={[0, 100]} stroke="#9CA3AF" />
                                            <Tooltip
                                                contentStyle={{
                                                    backgroundColor: '#1F2937',
                                                    border: 'none',
                                                    borderRadius: '8px',
                                                    color: '#fff'
                                                }}
                                            />
                                            <Area
                                                type="monotone"
                                                dataKey="taxa_acerto"
                                                stroke="#00ff88"
                                                strokeWidth={2}
                                                fill="url(#colorAcerto)"
                                                name="Taxa de Acerto %"
                                            />
                                        </AreaChart>
                                    </ResponsiveContainer>
                                )}
                            </div>
                        </div>

                        {/* Gráfico de Barras - Comparativo */}
                        <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-gray-700">
                            <div className="flex justify-between items-center mb-4">
                                <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                                    <Calendar className="w-5 h-5 text-blue-400" />
                                    Comparativo Semanal
                                </h3>
                                <span className="text-sm text-gray-400">Atual vs. Anterior</span>
                            </div>

                            <div className="h-80">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={dadosComparativos}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                                        <XAxis dataKey="nome" stroke="#9CA3AF" />
                                        <YAxis stroke="#9CA3AF" />
                                        <Tooltip
                                            contentStyle={{
                                                backgroundColor: '#1F2937',
                                                border: 'none',
                                                borderRadius: '8px',
                                                color: '#fff'
                                            }}
                                        />
                                        <Legend />
                                        <Bar dataKey="atual" fill="#00ff88" name="Semana Atual" />
                                        <Bar dataKey="anterior" fill="#60A5FA" name="Semana Anterior" />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* Gráfico de Pizza - Categorias */}
                        <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-gray-700">
                            <div className="flex justify-between items-center mb-4">
                                <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                                    <Target className="w-5 h-5 text-purple-400" />
                                    Distribuição por Categoria
                                </h3>
                                <span className="text-sm text-gray-400">Total de questões</span>
                            </div>

                            <div className="h-80">
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie
                                            data={dadosCategorias}
                                            cx="50%"
                                            cy="50%"
                                            innerRadius={60}
                                            outerRadius={100}
                                            paddingAngle={5}
                                            dataKey="value"
                                        >
                                            {dadosCategorias.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={cores[index % cores.length]} />
                                            ))}
                                        </Pie>
                                        <Tooltip
                                            contentStyle={{
                                                backgroundColor: '#1F2937',
                                                border: 'none',
                                                borderRadius: '8px',
                                                color: '#fff'
                                            }}
                                        />
                                        <Legend />
                                    </PieChart>
                                </ResponsiveContainer>
                            </div>
                        </div>

                        {/* Estatísticas Rápidas */}
                        <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-gray-700">
                            <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                                <Award className="w-5 h-5 text-yellow-400" />
                                Estatísticas Rápidas
                            </h3>

                            <div className="space-y-4">
                                {[
                                    { label: 'Melhor dia', value: '92% em 07/03', progress: 92 },
                                    { label: 'Média geral', value: '81%', progress: 81 },
                                    { label: 'Questões por dia', value: '15', progress: 65 },
                                    { label: 'Consistência', value: '78%', progress: 78 },
                                ].map((item, index) => (
                                    <div key={index}>
                                        <div className="flex justify-between text-sm mb-1">
                                            <span className="text-gray-400">{item.label}</span>
                                            <span className="text-white font-medium">{item.value}</span>
                                        </div>
                                        <div className="w-full bg-gray-700 rounded-full h-2">
                                            <div
                                                className="bg-gradient-to-r from-green-400 to-green-500 h-2 rounded-full transition-all duration-500"
                                                style={{ width: `${item.progress}%` }}
                                            />
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <div className="mt-6 pt-6 border-t border-gray-700">
                                <div className="flex justify-between items-center">
                                    <span className="text-gray-400">Meta diária</span>
                                    <span className="text-white font-medium">20 questões</span>
                                </div>
                                <div className="w-full bg-gray-700 rounded-full h-2.5 mt-2">
                                    <div
                                        className="bg-gradient-to-r from-blue-400 to-blue-500 h-2.5 rounded-full"
                                        style={{ width: '75%' }}
                                    />
                                </div>
                                <p className="text-sm text-gray-500 mt-2">15/20 questões concluídas hoje</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
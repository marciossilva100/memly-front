import { Sprout, TrendingUp, Trophy } from "lucide-react";

// cefr: só rótulo visual (padrão CEFR, pedido do usuário) - o backend
// (Nivel::nomeParaPrompt) já mapeia cada um desses 3 níveis pra mesma faixa
// na hora de montar o prompt da IA (iniciante=A1/A2, intermediário=B1/B2,
// avançado=C1/C2); não existe granularidade real pra separar A1 de A2 (ou
// B1 de B2) sem reformular como a IA gera o conteúdo pra cada nível.
// Usado por Configuracoes.jsx (seletor) e Header.jsx (indicador na Home).
export const NIVEIS = [
    { id: 1, icon: Sprout, key: "iniciante", cefr: "A1-A2" },
    { id: 2, icon: TrendingUp, key: "intermediario", cefr: "B1-B2" },
    { id: 3, icon: Trophy, key: "avancado", cefr: "C1-C2" },
];

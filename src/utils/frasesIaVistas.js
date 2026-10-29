// Frases geradas automaticamente pela IA (1 por dia, por categoria - ver
// CategoriaFraseDiariaIA no backend) ficam marcadas como "novas" (selo na
// listagem de frases, indicador no card da categoria na Home) até o usuário
// interagir com elas OU até essa janela de dias passar, o que vier primeiro
// - sem isso, uma frase que o usuário nunca abre ficaria marcada como "nova"
// pra sempre. O estado de "já vista" é compartilhado (mesma chave) entre
// Home.jsx e Frases.jsx, pra marcar como vista num lugar sumir no outro.
export const NOVA_FRASE_IA_JANELA_DIAS = 3;
const FRASES_IA_VISTAS_STORAGE_KEY = "zaldemy_frases_ia_vistas";

export function carregarFrasesIaVistas() {
    try {
        return new Set(JSON.parse(localStorage.getItem(FRASES_IA_VISTAS_STORAGE_KEY) || "[]"));
    } catch {
        return new Set();
    }
}

export function salvarFrasesIaVistas(set) {
    try {
        localStorage.setItem(FRASES_IA_VISTAS_STORAGE_KEY, JSON.stringify([...set]));
    } catch {
        // localStorage indisponível - o selo só não some entre sessões, sem quebrar nada
    }
}

// Renderiza um texto com trechos destacados (fundo colorido) - usado pra
// mostrar quais palavras da pergunta/frase gerada por IA vêm do vocabulário
// que o usuário já estuda. `tokens` vem do backend (destacarPalavrasConhecidas
// em DailyQuestionOpenAI/FraseDoDia); se não vier (ou vier vazio), cai no
// texto puro sem destaque.
export default function TextoDestacado({ tokens, texto }) {
  if (!Array.isArray(tokens) || tokens.length === 0) {
    return texto;
  }

  return tokens.map((token, i) =>
    token.destaque ? (
      <span key={i} className="bg-[#4cb8c4]/10">
        {token.texto}
      </span>
    ) : (
      <span key={i}>{token.texto}</span>
    )
  );
}

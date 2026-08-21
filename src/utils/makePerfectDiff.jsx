// Pontuação que não deve reprovar a resposta por si só (ex: esquecer o
// ponto final, ou trocar vírgula por nada) - só a palavra em si importa.
const PONTUACAO_IGNORADA = new Set([".", ",", ";", ":", "!", "?"]);

// Remove acentos/diacríticos (á -> a, ç -> c, ã -> a...) pra comparar só a
// letra em si, não a decoração dela - decompõe o caractere acentuado em
// letra base + marca de acento (NFD) e descarta a marca.
function normalizarParaComparar(char) {
  return char
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

export function makePerfectDiff(correct, user) {

  // 🔹 Remove apenas espaços do começo e do fim
  const correctTrimmed = correct.trim();
  const userTrimmed = user.trim();

  const result = [];
  const max = Math.max(correctTrimmed.length, userTrimmed.length);

  for (let i = 0; i < max; i++) {
    const correctChar = correctTrimmed[i] || "";
    const userChar = userTrimmed[i] || "";

    // Se a posição é de pontuação (em qualquer um dos dois lados), não
    // conta como erro - digitar ou esquecer um ponto/vírgula não deve
    // reprovar quem acertou a palavra.
    const ignoravel = PONTUACAO_IGNORADA.has(correctChar) || PONTUACAO_IGNORADA.has(userChar);

    result.push({
      char: userChar,
      match: ignoravel || normalizarParaComparar(correctChar) === normalizarParaComparar(userChar),
    });
  }

  const isCorrect = result.every((item) => item.match);

  return {
    diff: result,
    isCorrect,
  };
}

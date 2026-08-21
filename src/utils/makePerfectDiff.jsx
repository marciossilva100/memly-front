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

function saoEquivalentes(a, b) {
  if (PONTUACAO_IGNORADA.has(a) || PONTUACAO_IGNORADA.has(b)) return true;
  return normalizarParaComparar(a) === normalizarParaComparar(b);
}

export function makePerfectDiff(correct, user) {

  // 🔹 Remove espaços do começo/fim e reduz espaços duplos/triplos no meio
  // a um só - espaço a mais no meio (comum digitando rápido no celular) não
  // deve reprovar quem acertou a palavra, mesmo lado do raciocínio da
  // pontuação ignorada acima.
  const correctTrimmed = correct.trim().replace(/\s+/g, " ");
  const userTrimmed = user.trim().replace(/\s+/g, " ");

  const m = correctTrimmed.length;
  const n = userTrimmed.length;

  // Distância de edição (Levenshtein) entre a resposta certa e a digitada,
  // com custo 0 pra qualquer operação envolvendo pontuação ignorada - sem
  // isso, uma vírgula faltando no meio da frase desalinhava a comparação
  // posição-a-posição de antes, fazendo letras certas depois dela
  // aparecerem como erro. Com o alinhamento de verdade, essa diferença é
  // "absorvida" ali mesmo, sem propagar pro resto da frase.
  const dp = Array.from({ length: m + 1 }, () => new Array(n + 1).fill(0));

  for (let i = 1; i <= m; i++) {
    dp[i][0] = dp[i - 1][0] + (PONTUACAO_IGNORADA.has(correctTrimmed[i - 1]) ? 0 : 1);
  }
  for (let j = 1; j <= n; j++) {
    dp[0][j] = dp[0][j - 1] + (PONTUACAO_IGNORADA.has(userTrimmed[j - 1]) ? 0 : 1);
  }

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      const cChar = correctTrimmed[i - 1];
      const uChar = userTrimmed[j - 1];

      const custoSubstituir = saoEquivalentes(cChar, uChar) ? 0 : 1;
      const custoRemover = PONTUACAO_IGNORADA.has(cChar) ? 0 : 1; // correto tem, usuário não digitou
      const custoInserir = PONTUACAO_IGNORADA.has(uChar) ? 0 : 1; // usuário digitou a mais

      dp[i][j] = Math.min(
        dp[i - 1][j - 1] + custoSubstituir,
        dp[i - 1][j] + custoRemover,
        dp[i][j - 1] + custoInserir
      );
    }
  }

  // Reconstrói o alinhamento de trás pra frente, escolhendo a operação que
  // gerou o valor mínimo em cada ponto (preferindo substituir/igualar
  // quando empata, pra manter o alinhamento "reto" sempre que possível).
  const result = [];
  let i = m;
  let j = n;

  while (i > 0 || j > 0) {
    if (i > 0 && j > 0) {
      const cChar = correctTrimmed[i - 1];
      const uChar = userTrimmed[j - 1];
      const custoSubstituir = saoEquivalentes(cChar, uChar) ? 0 : 1;

      if (dp[i][j] === dp[i - 1][j - 1] + custoSubstituir) {
        result.unshift({ char: uChar, match: custoSubstituir === 0 });
        i--; j--;
        continue;
      }
    }

    if (i > 0 && (j === 0 || dp[i][j] === dp[i - 1][j] + (PONTUACAO_IGNORADA.has(correctTrimmed[i - 1]) ? 0 : 1))) {
      // o correto tem um caractere que o usuário não digitou - string vazia
      // aqui não aparece na tela (não dá pra colorir de vermelho um
      // caractere que não existe), então uma letra ou palavra inteira
      // faltando ficava invisível no diff, sem nenhum indício visual do
      // erro. Um marcador ("_") ocupa o lugar visualmente sem fingir que o
      // usuário digitou algo que não digitou.
      const cChar = correctTrimmed[i - 1];
      const ignoravel = PONTUACAO_IGNORADA.has(cChar);
      result.unshift({ char: ignoravel ? "" : "_", match: ignoravel });
      i--;
      continue;
    }

    // usuário digitou um caractere extra que não existe na resposta certa
    const uChar = userTrimmed[j - 1];
    result.unshift({ char: uChar, match: PONTUACAO_IGNORADA.has(uChar) });
    j--;
  }

  return {
    diff: result,
    isCorrect: dp[m][n] === 0,
  };
}

export function makePerfectDiff(correct, user) {

  // 🔹 Remove apenas espaços do começo e do fim
  const correctTrimmed = correct.trim();
  const userTrimmed = user.trim();

  const result = [];
  const max = Math.max(correctTrimmed.length, userTrimmed.length);

  for (let i = 0; i < max; i++) {
    const correctChar = correctTrimmed[i] || "";
    const userChar = userTrimmed[i] || "";

    result.push({
      char: userChar,
      match: correctChar.toLowerCase() === userChar.toLowerCase(),
    });
  }

  const isCorrect = result.every((item) => item.match);

  return {
    diff: result,
    isCorrect,
  };
}
export async function translateText(text, sourceLang, targetLang) {
  try {
    const response = await fetch("https://libretranslate.de/translate", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        q: text,
        source: sourceLang,
        target: targetLang,
        format: "text"
      })
    });

    const data = await response.json();
    return data.translatedText;

  } catch (error) {
    console.error("Translation error:", error?.message || error);
    return null;
  }
}
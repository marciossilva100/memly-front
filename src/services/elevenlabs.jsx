import { ElevenLabsClient } from "@elevenlabs/elevenlabs-js";

const apikey = "sk_4d60d1d1cf02c4a5947b7f473f2738abfc1596203d2431f0";
const elevenlabs = new ElevenLabsClient({
  apiKey: apikey,
});

export async function gerarAudio(texto) {
  const audioStream = await elevenlabs.textToSpeech.convert(
    "cgSgspJ2msm6clMCkdW9",
    {
      text: texto,
      modelId: "eleven_multilingual_v2",
      outputFormat: "mp3_44100_128",
        voiceSettings: {
      stability: 0.7,
      similarity_boost: 0.8,
      style: 0.2,
      use_speaker_boost: true,
    }
    }
  );

  // converter stream para blob
  const chunks = [];
  for await (const chunk of audioStream) {
    chunks.push(chunk);
  }

  const blob = new Blob(chunks, { type: "audio/mpeg" });
  const url = URL.createObjectURL(blob);

  return url; // 🔥 agora retorna algo utilizável no React
}

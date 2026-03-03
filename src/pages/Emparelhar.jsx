import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";

const HEADER_HEIGHT = 40; // ajuste se necessário

export default function JogoFrases() {
  const { id } = useParams();

  const [nativas, setNativas] = useState([]);
  const [traduzidas, setTraduzidas] = useState([]);

  const [selecionadaEsquerda, setSelecionadaEsquerda] = useState(null);
  const [selecionadaDireita, setSelecionadaDireita] = useState(null);

  const [erroEsquerdaId, setErroEsquerdaId] = useState(null);
  const [erroDireitaId, setErroDireitaId] = useState(null);

  const [sucessoEsquerdaId, setSucessoEsquerdaId] = useState(null);
  const [sucessoDireitaId, setSucessoDireitaId] = useState(null);

  useEffect(() => {
    fetch("http://localhost:8081/controller/frases.php", {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "frases",
        category_id: id
      })
    })
      .then(res => res.json())
      .then(data => {
        const limitado = data.slice(0, 5); // garante no máximo 5
        setNativas(shuffleArray(limitado));
        setTraduzidas(shuffleArray(limitado));
        resetEstados();
      });
  }, [id]);

  function resetEstados() {
    setSelecionadaEsquerda(null);
    setSelecionadaDireita(null);
    setErroEsquerdaId(null);
    setErroDireitaId(null);
    setSucessoEsquerdaId(null);
    setSucessoDireitaId(null);
  }

  useEffect(() => {
    if (!selecionadaEsquerda || !selecionadaDireita) return;

    const acertou = selecionadaEsquerda.id === selecionadaDireita.id;

    if (acertou) {
      setSucessoEsquerdaId(selecionadaEsquerda.id);
      setSucessoDireitaId(selecionadaDireita.id);
    } else {
      setErroEsquerdaId(selecionadaEsquerda.id);
      setErroDireitaId(selecionadaDireita.id);
    }

    setTimeout(() => {
      if (acertou) {
        setNativas(prev =>
          prev.filter(item => item.id !== selecionadaEsquerda.id)
        );
        setTraduzidas(prev =>
          prev.filter(item => item.id !== selecionadaDireita.id)
        );
      }
      resetEstados();
    }, 450);
  }, [selecionadaEsquerda, selecionadaDireita]);

  return (
    <div className="bg-slate-50 flex justify-center">
      <div
        className="w-full max-w-5xl bg-white rounded-xl shadow p-6"
        style={{ height: `calc(100vh - ${HEADER_HEIGHT}px)` }}
      >
        <div className="grid grid-cols-2 gap-8 h-full">

          {/* ESQUERDA */}
          <div className="grid grid-rows-5 gap-3 h-full">
            {nativas.map(frase => (
              <button
                key={frase.id}
                onClick={() => setSelecionadaEsquerda(frase)}
                className={`
                  h-full w-full flex items-center
                  p-4 text-left rounded-lg border transition justify-center
                  ${sucessoEsquerdaId === frase.id
                    ? "bg-green-100 border-green-300"
                    : erroEsquerdaId === frase.id
                      ? "bg-red-100 border-red-300"
                      : selecionadaEsquerda?.id === frase.id && !selecionadaDireita
                        ? "bg-blue-100 border-blue-400"
                        : "hover:bg-slate-100"}
                `}
              >
                {frase.texto_nativo}
              </button>
            ))}
          </div>

          {/* DIREITA */}
          <div className="grid grid-rows-5 gap-3 h-full">
            {traduzidas.map(frase => (
              <button
                key={frase.id}
                onClick={() => setSelecionadaDireita(frase)}
                className={`
                  h-full w-full flex items-center
                  p-4 text-left rounded-lg border transition justify-center
                  ${sucessoDireitaId === frase.id
                    ? "bg-green-100 border-green-300"
                    : erroDireitaId === frase.id
                      ? "bg-red-100 border-red-300"
                      : selecionadaDireita?.id === frase.id && !selecionadaEsquerda
                        ? "bg-blue-100 border-blue-400"
                        : ""}
                `}
              >
                {frase.texto_traduzido}
              </button>
            ))}
          </div>

        </div>
      </div>
    </div>
  );
}

function shuffleArray(array) {
  return [...array].sort(() => Math.random() - 0.5);
}

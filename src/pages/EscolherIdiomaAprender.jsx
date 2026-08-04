import { useState, useEffect, useRef } from "react"
import { idiomas } from "../data/idiomas"
import { Navigate, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useTranslation } from "react-i18next";
import imgChapeuFormatura from "../assets/img/chapeu_formatura-v2.png"

// 🌍 Bandeiras
const flags = {
  pt: "https://flagcdn.com/w40/br.png",
  en: "https://flagcdn.com/w40/us.png",
  es: "https://flagcdn.com/w40/es.png",
  fr: "https://flagcdn.com/w40/fr.png",
  de: "https://flagcdn.com/w40/de.png",
  it: "https://flagcdn.com/w40/it.png",
  zh: "https://flagcdn.com/w40/cn.png",
  ja: "https://flagcdn.com/w40/jp.png",
  ru: "https://flagcdn.com/w40/ru.png",
  ar: "https://flagcdn.com/w40/sa.png",
  hi: "https://flagcdn.com/w40/in.png",
  ko: "https://flagcdn.com/w40/kr.png",
  nl: "https://flagcdn.com/w40/nl.png",
  tr: "https://flagcdn.com/w40/tr.png",
  pl: "https://flagcdn.com/w40/pl.png",
};

export default function EscolherIdiomaAprender() {
  const { t } = useTranslation();
  const { user, setUser, checkAuth } = useAuth();

  const navigate = useNavigate();
  const location = useLocation();
  const [erro, setErro] = useState('')
  const [idioma, setIdioma] = useState("")
  const [languageList, setLanguageList] = useState([])
  const [finishStep, setFinishStep] = useState(false)
  const API_URL = import.meta.env.VITE_API_URL;
  const [openSelect, setOpenSelect] = useState(false)
  const selectRef = useRef(null)
  const [form, setForm] = useState({
    learning_language: ''
  })

  // Se veio pelo botão de voltar pra trocar o idioma, pré-seleciona o que já
  // estava escolhido (até o usuário escolher outro) em vez de aparecer em
  // branco - computado direto no render, sem useEffect/setState.
  const idiomaAtualId = languageList.find((l) => l.sigla === user?.learning_language)?.id ?? '';
  const valorSelecionado = form.learning_language || idiomaAtualId;
  const idiomaSelecionado = languageList.find(
    (l) => l.id == valorSelecionado
  );

  // Não faz sentido aprender o mesmo idioma que já é o nativo
  const idiomasParaAprender = languageList.filter(
    (l) => l.sigla !== user?.native_language
  );

  useEffect(() => {
    if (user?.step > 1 && !location.state?.fromBack) {
      navigate(user?.nivel ? "/referenciausuario" : "/escolhernivel", { replace: true });
    }
  }, [user]);

    useEffect(() => {
        console.log("USER ATUALIZADO:", user);
    }, [user]);

  useEffect(() => {
    fetch(`${API_URL}/controller/language.php`,
      {
        method: 'POST',
        headers: {
          "Authorization": "Bearer " + localStorage.getItem("token")
        },

        body: JSON.stringify({
          action: 'list_languages_learning',
        })
      }
    ).then(res => res.json())
      .then(data => {
        setLanguageList(data)
        // console.log(data)
      }).catch(() => {
        setErro(t("server_connection_error"));
      });
  }, [])


  async function languageRegister() {
    try {
      const res = await fetch(`${API_URL}/controller/language.php`, {
        method: 'POST',
        headers: {
          "Authorization": "Bearer " + localStorage.getItem("token")
        },
        body: JSON.stringify({
          action: 'set_learning_language',
          learning_language: valorSelecionado,
        })
      });

      const data = await res.json();

      if (data.erro) {
        setErro(data.erro);
        return;
      }

      // 🔥 garante idioma válido
      const idiomaSelecionado = languageList.find(
        (l) => l.id == valorSelecionado
      );

      // 🔥 atualiza local sem quebrar
      setUser(prev => ({
        ...(prev || {}),
        step: 2,
        learning_language: idiomaSelecionado?.sigla || null
      }));

      // 🔥 SINCRONIZA COM BACKEND (ESSENCIAL)
      await checkAuth(true);

      // 🔥 navega só depois de sincronizar
      navigate("/escolhernivel");

    } catch (error) {
      console.log(error);
      setErro(t("server_connection_error"));
    }
  }

  useEffect(() => {
    function handleClickOutside(e) {
      if (selectRef.current && !selectRef.current.contains(e.target)) {
        setOpenSelect(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);


  // function handleChange(e) {
  //   setErro('');

  //   const { name, value } = e.target;

  //   const selectedLanguage = languageList.find(
  //     (lang) => lang.id == value
  //   );

  //   setForm((prev) => ({
  //     ...prev,
  //     [name]: value,
  //     language: selectedLanguage?.idioma,
  //     acronym: selectedLanguage?.sigla
  //   }));
  // }

  function handleSubmit(e) {
    e.preventDefault();

    if (!valorSelecionado) {
      setErro(t("choose_a_language"))
      return
    }
    languageRegister();
  }


  return (
    <div
      className="
        h-dvh
        overflow-hidden
        flex
        flex-col
        px-10
        pt-6
        pb-[env(safe-area-inset-bottom)] from-gray-900 to-gray-800 bg-gradient-to-br
      "
    >
      <form action="" onSubmit={(e) => handleSubmit(e)}>

        <div className="relative mb-2 mt-2">
          <div
            className="left-0 cursor-pointer inline-block"
            onClick={() => navigate("/escolheridioma", { state: { fromBack: true } })}
          >
            <i className="bi bi-arrow-left text-2xl text-white"></i>
          </div>
        </div>

        {/* TOPO */}
        <div className="w-full max-w-md mx-auto text-center mb-6">
          {<div className="flex justify-center mb-3">
            <img
              src={imgChapeuFormatura}
              alt="Coruja"
              className="w-28"
            />
          </div>}
          <h4 className="text-lg font-medium text-white">
            {t("choose_learning_language_prompt")}
          </h4>
        </div>

        {/* SELECT */}
        <div className="w-full max-w-md mx-auto">
          <div className="relative">
            <div
              ref={selectRef}
              className="relative h-12 flex items-center rounded-2xl border border-blue-500 w-full"
            >
              {/* BOTÃO */}
              <div
                onClick={() => setOpenSelect(!openSelect)}
                className="flex items-center gap-2 px-4 w-full cursor-pointer"
              >
                {idiomaSelecionado ? (
                  <>
                    <img
                      src={flags[idiomaSelecionado.sigla] || "https://flagcdn.com/w40/un.png"}
                      className="w-5 h-5 rounded-full"
                    />
                    <span className="text-sm text-white">
                      {idiomaSelecionado.idioma}
                    </span>
                  </>
                ) : (
                  <span className="text-sm text-white">
                    {t("select_a_language")}
                  </span>
                )}


              </div>

              {/* DROPDOWN */}
              {openSelect && (
                <div className="absolute top-14 left-0 w-full bg-gray-900 border border-blue-500 rounded-xl shadow-lg z-50 max-h-60 overflow-auto">
                  {idiomasParaAprender.map((item) => (
                    <div
                      key={item.id}
                      onClick={() => {
                        setForm((prev) => ({
                          ...prev,
                          learning_language: item.id,
                          language: item.idioma,
                          acronym: item.sigla
                        }));

                        setOpenSelect(false);
                      }}
                      className="flex items-center gap-2 px-4 py-3 hover:bg-gray-700 cursor-pointer text-white"
                    >
                      <img
                        src={flags[item.sigla] || "https://flagcdn.com/w40/un.png"}
                        className="w-5 h-5 rounded-full"
                      />
                      <span className="text-sm">{item.idioma}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="pointer-events-none absolute inset-y-0 right-4 flex items-center">
              <svg
                className="w-4 h-4 text-blue-500"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M5.23 7.21a.75.75 0 011.06.02L10 11.17l3.71-3.94a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z"
                  clipRule="evenodd"
                />
              </svg>
            </div>

          </div>
          {/* Erro */}
          {erro && (
            <div className="bg-red-100 text-red-700 text-sm px-3 py-1 rounded mt-4">
              {erro}
            </div>
          )}
        </div>

        {/* BOTÃO */}
        <div className="w-lg mt-auto pb-4 fixed bottom-0 left-0 w-full px-10">
          <button
            type="submit"
            className="
          block
          w-full
          bg-[#4cb8c4]
          bottom-0
          text-white
          font-medium
          py-3
          rounded-full
          transition
          text-center
        "
          >
            {t("confirm")}
          </button>

        </div>
      </form>
    </div>
  )
}

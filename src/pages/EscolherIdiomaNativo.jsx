import { useEffect, useState } from "react"
import imgCoruja from "../assets/img/coruja.png"
import { idiomas } from "../data/idiomas"
import { useAuth } from "../context/AuthContext";

import imgMemly from "../assets/img/mascote-memly.png"
import { useNavigate } from "react-router-dom";


export default function EscolherIdiomaNativo() {
  const { user, setUser } = useAuth();
  const [erro, setErro] = useState('')
  const [languageList, setLanguageList] = useState([])
  const navigate = useNavigate();

  const [form, setForm] = useState({
    native_language: ''
  })

  useEffect(() => {
    console.log(user)
    if (user.step > 0) {
      navigate("/escolheridiomaaprender", {
        state: { email: form.email }
      })
    }
    return
  }, [])

  useEffect(() => {
    fetch('http://localhost:8081/controller/language.php',
      {
        method: 'POST',
        credentials: "include",
        headers: {
          'Content-Type': 'application/json'
        },

        body: JSON.stringify({
          action: 'list_languages',
        })
      }
    ).then(res => res.json())
      .then(data => {
        setLanguageList(data)
        // console.log(data)
      }).catch(() => {
        setErro('Erro ao conectar com o servidor');
      });
  }, [])

  function languageRegister() {

    //   setLoading(true)
    fetch('http://localhost:8081/controller/language.php', {
      method: 'POST',
      credentials: "include",
      headers: {
        'Content-Type': 'application/json'
      },

      body: JSON.stringify({
        action: 'set_native_language',
        native_language: form.native_language,
      })
    })
      .then(res => res.json())
      .then(data => {

        console.log(data);

        if (data.erro) {
          //   setLoading(false)
          setErro(data.erro);
          return
        }
        //  setFinish(true)
        // setLoading(false)

        setUser(prev => ({
          ...prev,
          step: 1,
          native_language: form.acronym
        }));

        navigate("/escolheridiomaaprender", {
          state: { email: form.email }
        })

      })
      .catch(() => {
        setErro('Erro ao conectar com o servidor');
      });

  }

  function handleChange(e) {
    setErro('');

    const { name, value } = e.target;

    const selectedLanguage = languageList.find(
      (lang) => lang.id == value
    );

    setForm((prev) => ({
      ...prev,
      [name]: value,
      language: selectedLanguage?.idioma,
      acronym: selectedLanguage?.sigla
    }));
  }

  function handleSubmit(e) {
    e.preventDefault();

    if (!form.native_language) {
      setErro('Escolha um idioma')
      return
    }
    languageRegister();
  }

  return (
    <div
      className="
    
        h-[100svh]
        overflow-hidden
        flex
        flex-col
        px-10
        pt-6
        pb-[env(safe-area-inset-bottom)]
      "
    >
      <form action="" onSubmit={(e) => handleSubmit(e)}>

        {/* TOPO */}
        <div className="w-lg max-w-md mx-auto text-center mb-6">
          <div className="flex justify-center mb-3">
            <img
              src={imgMemly}
              alt="Coruja"
              className="w-28 "
            />
          </div>
          <h4 className="text-lg font-medium text-slate-700">
            Escolha seu idioma nativo
          </h4>
        </div>

        {/* SELECT */}
        <div className="w-full max-w-md mx-auto">
          <div className="relative">
            <select
              name="native_language"
              value={form.native_language}
              onChange={(e) => handleChange(e)}
              className="
              w-full
              h-10
              px-4
              pr-12
              rounded-2xl
              border
              border-blue-500
              bg-white
              focus:outline-none
              focus:ring-2
              focus:ring-blue-500
              appearance-none
            "
            >
              <option value="">Selecione um idioma</option>
              {languageList.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.idioma}
                </option>
              ))}
            </select>

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
          bg-avocado-500
          bottom-0
          text-white
          font-medium
          py-3
          rounded-full
          transition
          text-center
        "
          >
            Confirmar
          </button>

        </div>
      </form>

    </div>
  )
}

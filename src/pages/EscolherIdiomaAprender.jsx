import { useState, useEffect } from "react"
import imgCoruja from "../assets/img/coruja.png"
import { idiomas } from "../data/idiomas"
import imgMemly from "../assets/img/mascote-memly.png"
import {Navigate, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import imgChapeuFormatura from "../assets/img/chapeu_formatura.png"


export default function EscolherIdiomaAprender() {
  const { user, setUser } = useAuth();

  const navigate = useNavigate();
  const [erro, setErro] = useState('')
  const [idioma, setIdioma] = useState("")
  const [languageList, setLanguageList] = useState([])
  const [finishStep, setFinishStep] = useState(false)
const API_URL = import.meta.env.VITE_API_URL;
  const [form, setForm] = useState({
    learning_language: ''
  })

  if (user?.step > 1) {
    return <Navigate to="/referenciausuario" replace />
  }

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
        setErro('Erro ao conectar com o servidor');
      });
  }, [])


  function languageRegister() {

    //   setLoading(true)
    fetch(`${API_URL}/controller/language.php`, {
      method: 'POST',
      headers: {
        "Authorization": "Bearer " + localStorage.getItem("token")
      },
      body: JSON.stringify({
        action: 'set_learning_language',
        learning_language: form.learning_language,
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
          step: 2,
          learning_language: form.acronym
        }));

        console.log('passou aqui 2')

        navigate("/referenciausuario", {
          state: { email: form.email }
        })

      })
      .catch((error) => {
        console.log(error);
        setErro(error.message);
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

    if (!form.learning_language) {
      setErro('Escolha um idioma')
      return
    }
    languageRegister();
  }


  return (
    <div
      className="
        h-[calc(100svh-41px)]
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
        <div className="w-full max-w-md mx-auto text-center mb-6">
          {<div className="flex justify-center mb-3">
            <img
              src={imgChapeuFormatura}
              alt="Coruja"
              className="w-28"
            />
          </div>}
          <h4 className="text-lg font-medium text-slate-700">
            Escolha o idioma que você quer aprender.
          </h4>
        </div>

        {/* SELECT */}
        <div className="w-full max-w-md mx-auto">
          <div className="relative">
            <select
              value={form.learning_language}
              onChange={(e) => handleChange(e)}
              name='learning_language'
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
            Confirmar
          </button>

        </div>
      </form>
    </div>
  )
}

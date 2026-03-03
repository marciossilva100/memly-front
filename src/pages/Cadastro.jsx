import { useEffect, useState } from 'react'
import { useParams, useNavigate } from "react-router-dom";

import { Link } from "react-router-dom";

import imgLogin from '../assets/img/img-login.png'
import imgGoogle from '../assets/img/google.png'
import imgFacebook from '../assets/img/logo-face.webp'
import imgCoruja from '../assets/img/coruja-cadastro.png'
import imgMemly from "../assets/img/mascote-memly.png"

export default function Cadastro({ setTitulo }) {
    /* 
        const [nome, setNome] = useState('')
        const [email, setEmail] = useState('')
        const [password, setPassword] = useState('')
        const [passwordConfirm, setPasswordConfirm] = useState('') */
    const [loading, setLoading] = useState(false);
    const [finish, setFinish] = useState(false)
    const [form, setForm] = useState({
        name: 'marcios',
        email: 'marciossilva.dev@gmail.com',
        password: '123123',
        confirm_password: '123123'
    })
    const [erro, setErro] = useState('')
    const navigate = useNavigate();

    useEffect(() => {
        setTitulo('Cadastro')
    }, [])

    const handleChange = (e) => {
        setForm({
            ...form, [e.target.name]: e.target.value
        })
    }



    function handleSubmit(e) {
        e.preventDefault()

        if (!form.name) {
            setErro('O nome deve ser preenchido')
            return
        }

        if (!form.email) {
            setErro('O email deve ser preenchido')
            return
        }

        if (!form.password) {
            setErro('Digite a senha')
            return
        }

        if (!form.confirm_password) {
            setErro('Digite a senha para confirmar')
            return
        }


        setErro('')

        cadastrar();

    }

    function cadastrar() {
        setLoading(true)
        fetch('http://localhost:8081/controller/auth.php', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },

            body: JSON.stringify({
                action: 'register',
                name: form.name,
                email: form.email,
                password: form.password,
                confirm_password: form.confirm_password
            })
        })
            .then(res => res.json())
            .then(data => {

                console.log(data);

                if (data.erro) {
                    setLoading(false)
                    setErro(data.erro);
                    return
                }
                setFinish(true)
                setLoading(false)

                navigate(`/verificaremail`, {
                    state: { email:form.email }
                })

            })
            .catch(() => {
                setErro('Erro ao conectar com o servidor');
            });
    }

    if (loading) {
        return (
            <div className="flex h-[calc(100vh-110px)] items-center justify-center bg-white-100">
                <img
                    src={imgMemly}
                    alt="Carregando"
                    className="w-28 animate-pulse"
                />
            </div>
        );
    }

    if (finish) return;

    return (
        <div className="max-w-6xl mx-auto px-4 px-8">
            <div className="flex justify-center">
                <div className="w-full max-w-md text-center mt-4">

                    <div className="flex justify-center">
                        <img className="logo-coruja" src={imgMemly} alt="Cadastro" />
                    </div>

                    <form onSubmit={handleSubmit} className="mt-6 space-y-4">

                        {/* Nome */}
                        <div className="flex items-center border rounded-full overflow-hidden py-3">
                            <span className="px-3 text-gray-500">
                                <i className="bi bi-envelope ps-2"></i>
                            </span>
                            <input
                                type="text"
                                className="w-full px-1 outline-none"
                                placeholder="Nome"
                                name='name'
                                value={form.name}
                                onChange={(e) => {
                                    handleChange(e);
                                    // setNome(e.target.value)
                                    setErro('');
                                }}
                            />
                        </div>

                        {/* Email */}
                        <div className="flex items-center border rounded-full overflow-hidden py-3">
                            <span className="px-3 text-gray-500">
                                <i className="bi bi-envelope ps-2"></i>
                            </span>
                            <input
                                type="email"
                                className="w-full px-1 outline-none"
                                placeholder="Email"
                                name='email'
                                value={form.email}
                                onChange={(e) => {
                                    handleChange(e)
                                    setErro('')
                                }}
                            />
                        </div>

                        {/* Senha */}
                        <div className="flex items-center border rounded-full overflow-hidden py-3">
                            <span className="px-3 text-gray-500">
                                <i className="bi bi-lock ps-2"></i>
                            </span>
                            <input
                                type="password"
                                className="w-full px-1 outline-none"
                                placeholder="Senha"
                                name='password'
                                value={form.password}
                                onChange={(e) => {
                                    handleChange(e)
                                    setErro('')
                                }}
                            />
                        </div>

                        {/* Confirmar senha */}
                        <div className="flex items-center border rounded-full overflow-hidden py-3">
                            <span className="px-3 text-gray-500">
                                <i className="bi bi-lock ps-2"></i>
                            </span>
                            <input
                                type="password"
                                className="w-full px-1 outline-none"
                                placeholder="Confirmar senha"
                                name='confirm_password'
                                value={form.confirm_password}
                                onChange={(e) => {
                                    handleChange(e)
                                    setErro('')
                                }}
                            />
                        </div>

                        {/* Erro */}
                        {erro && (
                            <div className="bg-red-100 text-red-700 text-sm px-3 py-1 rounded">
                                {erro}
                            </div>
                        )}

                        {/* Botão */}
                        <button
                            type="submit"
                            className="w-full bg-avocado-500 text-white py-2 rounded-full fw-700 "
                        >
                            Cadastrar
                        </button>
                    </form>

                    {/* Divisor */}
                    <div className="flex items-center my-6 ">
                        <div className="flex-grow border-t"></div>
                        <span className="mx-3 text-gray-400 text-sm">
                            Ou cadastre-se com
                        </span>
                        <div className="flex-grow border-t"></div>
                    </div>

                    {/* Google */}
                    <button className="text-sm w-full border border-gray-300 py-3 rounded-full flex items-center justify-center gap-3">
                        <img src={imgGoogle} alt="Google icone" width={20} />
                        <span className="ff-inter ">Entrar com Google</span> 
                    </button>

                    <br />

                    {/* Facebook */}
                    <button className="text-sm w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-full flex items-center justify-center gap-3">
                        <img src={imgFacebook} alt="Facebook icone" width={20} />
                        <span className="ff-inter">Entrar com Facebook</span>
                    </button>

                    <br />

                    <p className="text-sm">
                        Já tem uma conta?{' '}
                        <Link to="/login" className="underline text-primary">
                            Entrar
                        </Link>
                    </p>

                </div>
            </div>
        </div>
    )
}

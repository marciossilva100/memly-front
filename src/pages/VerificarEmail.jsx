import { useEffect, useState } from 'react'
import { Link, useNavigate, useLocation } from "react-router-dom";
import imgLogin from '../assets/img/img-login.png'
import imgGoogle from '../assets/img/google.png'
import imgFacebook from '../assets/img/logo-face.webp'
import imgCoruja from '../assets/img/coruja.png'
import imgMemly from "../assets/img/mascote-memly.png"

export default function VerificarEmail() {
    const navigate = useNavigate();

    const location = useLocation();
    const emailOriginal = location.state?.email;
    const emailMascarado = emailOriginal
        ? mascararEmail(emailOriginal)
        : null;


    useEffect(() => {

    }, [])

    function reenviarEmail(){
        return;
    }


    function mascararEmail(email) {
        const [usuario, dominio] = email.split("@");

        const inicio = usuario.slice(0, 2);
        const oculto = "*".repeat(usuario.length - 2);

        return `${inicio}${oculto}@${dominio}`;
    }


    return (
        <div className="max-w-6xl mx-auto px-8 section-login mt-8">
            <div className="flex justify-center">
                <div className="w-full max-w-md text-center mt-4">
                    <h2 className='text-slate-800 '>Cadastro realizado!</h2>

                    <p className='text-slate-800'>
                        Enviamos um link de verificação para <strong>{emailMascarado}</strong>.
                    </p>

                    <p className='text-slate-800'>
                        Clique no link no seu email para ativar sua conta.
                        Verifique também sua caixa de spam.
                    </p>

                    <div className='grid gap-3 mt-5'>
                        <button className='bg-avocado-500 px-5 py-2 rounded-full font-medium text-white' onClick={reenviarEmail}>
                            Reenviar email
                        </button>

                        <button className='bg-avocado-500 px-5 py-2 rounded-full font-medium text-white' onClick={() => navigate('/login')}>
                            Já confirmei
                        </button>
                    </div>

                </div>
            </div>
        </div>
    )
}

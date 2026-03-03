import { useEffect, useState, useRef } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import imgMemly from "../assets/img/mascote-memly.png"

export default function EmailVerificado() {

    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const [status, setStatus] = useState("verificando");

    // 🔒 Proteção contra execução dupla (React 18 StrictMode)
    const hasRun = useRef(false);

    useEffect(() => {

        // Impede rodar duas vezes no modo desenvolvimento
        if (hasRun.current) return;
        hasRun.current = true;

        const token = searchParams.get("token");

        if (!token) {
            setStatus("erro");
            return;
        }

        fetch("http://localhost:8081/controller/verify.php?token=" + token)
            .then(res => {
                if (!res.ok) {
                    throw new Error("Erro HTTP");
                }
                return res.json();
            })
            .then(data => {

                if (data.success === true) {
                    setStatus("sucesso");

                    setTimeout(() => {
                        navigate("/login");
                    }, 3000);

                } else {
                    setStatus("erro");
                }

            })
            .catch((err) => {
                console.error("Erro:", err);
                setStatus("erro");
            });

    }, [searchParams, navigate]);

    // ============================
    // RENDER
    // ============================

    

    if (status === "verificando") {
        return (
            <div className="text-center mt-10">
                <p>Verificando seu email...</p>
            </div>
        );
    }

    if (status === "erro") {
        return (
            <div className="text-center mt-10">
               
                <h2 className="text-red-600">
                    Link inválido ou expirado.
                </h2>
                <button
                    className="mt-4 px-4 py-2 bg-blue-600 text-white rounded"
                    onClick={() => navigate("/login")}
                >
                    Ir para Login
                </button>
            </div>
        );
    }

    return (
        <div className="text-center mt-10">
             <div className="flex justify-center mb-5">
                    <img className="logo-coruja" src={imgMemly} alt="Cadastro" />
                </div>
            <h2 className="text-green-600 text-lg">
                Email confirmado com sucesso!
            </h2>
            <p className="mt-2">
                Redirecionando para o login...
            </p>
        </div>
    );
}

import { useNavigate } from "react-router-dom";
import { Mail } from "lucide-react";

export default function Contato() {
    const navigate = useNavigate();
    const email = "adm@zaldemy.com";

    return (
        <div className="h-dvh flex flex-col from-gray-900 to-gray-800 bg-gradient-to-br">
            <div className="flex-1 overflow-y-auto scrollbar-hide px-5 pb-10">
                <div className="relative mb-4 mt-4">
                    <div
                        className="left-0 cursor-pointer inline-block"
                        onClick={() => navigate(-1)}
                    >
                        <i className="bi bi-arrow-left text-2xl text-white"></i>
                    </div>
                </div>

                <div className="max-w-2xl mx-auto text-white">
                    <div className="flex items-center gap-2 mb-1">
                        <Mail className="w-6 h-6 text-[#4cb8c4]" />
                        <h1 className="text-2xl font-bold">Contato</h1>
                    </div>

                    <p className="text-sm text-gray-300 mt-4">
                        Tem alguma dúvida, sugestão ou problema com o Zaldemy? Fale com a gente:
                    </p>

                    <a
                        href={`mailto:${email}`}
                        className="mt-6 flex items-center justify-center gap-2 w-full bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-full py-3 text-lg text-white"
                    >
                        <Mail className="w-5 h-5 text-[#4cb8c4]" />
                        {email}
                    </a>
                </div>
            </div>
        </div>
    );
}

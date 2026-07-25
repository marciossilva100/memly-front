import { Link } from "react-router-dom";
import {
    Languages,
    Sparkles,
    Layers,
    Volume2,
    BarChart3,
    Share2,
    Smartphone,
    Menu,
    X,
} from "lucide-react";
import { useState } from "react";
import imgZaldemy from "../assets/img/zaldemy.png";
import imgMemly from "../assets/img/mascote-memly.png";

const recursos = [
    {
        icone: Languages,
        titulo: "Aprenda no seu ritmo",
        descricao:
            "Escolha seu idioma nativo e o idioma que quer aprender. Você pode trocar de idioma de aprendizado quando quiser.",
    },
    {
        icone: Layers,
        titulo: "Categorias e frases suas",
        descricao:
            "Crie suas próprias categorias de frases, organizadas do seu jeito, focadas no vocabulário que realmente importa pra você.",
    },
    {
        icone: Sparkles,
        titulo: "Treino com Inteligência Artificial",
        descricao:
            "Pratique conversação e receba frases geradas por IA para expandir seu vocabulário de forma natural.",
    },
    {
        icone: Volume2,
        titulo: "Pronúncia com áudio",
        descricao:
            "Cada frase tem áudio gerado automaticamente, no seu idioma nativo e no idioma que você está aprendendo.",
    },
    {
        icone: BarChart3,
        titulo: "Acompanhe seu progresso",
        descricao:
            "Veja suas estatísticas de treino, acertos, erros e evolução em cada categoria ao longo do tempo.",
    },
    {
        icone: Share2,
        titulo: "Compartilhe com a comunidade",
        descricao:
            "Torne suas categorias públicas e pratique com o conteúdo criado por outros usuários do Zaldemy.",
    },
];

export default function LandingPage() {
    const [menuAberto, setMenuAberto] = useState(false);

    return (
        <div className="from-gray-900 to-gray-800 bg-gradient-to-br min-h-screen text-white">

            {/* NAV */}
            <header className="sticky top-0 z-50 backdrop-blur-md bg-gray-900/70 border-b border-gray-800">
                <div className="max-w-6xl mx-auto px-5 py-3 flex items-center justify-between">
                    <img src={imgZaldemy} alt="Zaldemy" className="h-8" />

                    <nav className="hidden md:flex items-center gap-8 text-sm">
                        <a href="#recursos" className="text-gray-300 hover:text-white transition-colors">
                            Recursos
                        </a>
                        <Link to="/faq" className="text-gray-300 hover:text-white transition-colors">
                            FAQ
                        </Link>
                        <Link to="/contato" className="text-gray-300 hover:text-white transition-colors">
                            Contato
                        </Link>
                    </nav>

                    <div className="hidden md:flex items-center gap-3">
                        <Link
                            to="/login"
                            className="text-sm text-white px-5 py-2 rounded-full border border-gray-700 hover:bg-white/5 transition-colors"
                        >
                            Entrar
                        </Link>
                        <Link
                            to="/cadastrar"
                            className="text-sm text-white px-5 py-2 rounded-full bg-[#4cb8c4] hover:brightness-110 transition"
                        >
                            Criar conta grátis
                        </Link>
                    </div>

                    <button
                        type="button"
                        className="md:hidden text-white"
                        onClick={() => setMenuAberto(!menuAberto)}
                    >
                        {menuAberto ? <X /> : <Menu />}
                    </button>
                </div>

                {menuAberto && (
                    <div className="md:hidden border-t border-gray-800 px-5 py-4 flex flex-col gap-4 text-sm">
                        <a href="#recursos" onClick={() => setMenuAberto(false)} className="text-gray-300">
                            Recursos
                        </a>
                        <Link to="/faq" onClick={() => setMenuAberto(false)} className="text-gray-300">
                            FAQ
                        </Link>
                        <Link to="/contato" onClick={() => setMenuAberto(false)} className="text-gray-300">
                            Contato
                        </Link>
                        <Link
                            to="/login"
                            className="text-center text-white px-5 py-2 rounded-full border border-gray-700"
                        >
                            Entrar
                        </Link>
                        <Link
                            to="/cadastrar"
                            className="text-center text-white px-5 py-2 rounded-full bg-[#4cb8c4]"
                        >
                            Criar conta grátis
                        </Link>
                    </div>
                )}
            </header>

            {/* HERO */}
            <section className="max-w-6xl mx-auto px-5 pt-16 pb-20 grid md:grid-cols-2 gap-10 items-center">
                <div>
                    <h1 className="text-4xl md:text-5xl font-extrabold leading-tight">
                        Aprenda idiomas do{" "}
                        <span className="text-[#4cb8c4]">seu jeito</span>
                    </h1>
                    <p className="text-gray-300 text-lg mt-5 max-w-md">
                        O Zaldemy é o app de aprendizado de idiomas onde você monta suas
                        próprias categorias e frases, treina com áudio real e ainda conta
                        com inteligência artificial pra praticar do seu jeito.
                    </p>

                    <div className="flex flex-col sm:flex-row gap-3 mt-8">
                        <Link
                            to="/cadastrar"
                            className="text-center bg-[#4cb8c4] text-white px-8 py-3 rounded-full text-lg font-semibold hover:brightness-110 transition"
                        >
                            Começar agora, é grátis
                        </Link>
                        <Link
                            to="/login"
                            className="text-center text-white px-8 py-3 rounded-full text-lg border border-gray-700 hover:bg-white/5 transition-colors"
                        >
                            Já tenho conta
                        </Link>
                    </div>
                </div>

                <div className="flex justify-center">
                    <img
                        src={imgMemly}
                        alt="Mascote Zaldemy"
                        className="w-64 md:w-80 drop-shadow-2xl"
                    />
                </div>
            </section>

            {/* RECURSOS */}
            <section id="recursos" className="max-w-6xl mx-auto px-5 py-16">
                <div className="text-center mb-12">
                    <h2 className="text-3xl font-bold">Tudo que você precisa pra aprender</h2>
                    <p className="text-gray-400 mt-3 max-w-xl mx-auto">
                        Ferramentas pensadas pra tornar o aprendizado de um novo idioma
                        mais simples, personalizado e constante.
                    </p>
                </div>

                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
                    {recursos.map((item, index) => {
                        const Icone = item.icone;
                        return (
                            <div
                                key={index}
                                className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-2xl p-6"
                            >
                                <div className="w-11 h-11 rounded-xl bg-[#4cb8c4]/15 flex items-center justify-center mb-4">
                                    <Icone className="text-[#4cb8c4]" size={22} />
                                </div>
                                <h3 className="font-semibold text-lg">{item.titulo}</h3>
                                <p className="text-gray-400 text-sm mt-2 leading-relaxed">
                                    {item.descricao}
                                </p>
                            </div>
                        );
                    })}
                </div>
            </section>

            {/* APP */}
            <section className="max-w-6xl mx-auto px-5 py-16">
                <div className="rounded-3xl bg-gray-800/40 border border-gray-700 px-8 py-12 flex flex-col md:flex-row items-center justify-between gap-8">
                    <div className="flex items-center gap-4">
                        <div className="w-14 h-14 rounded-2xl bg-[#4cb8c4]/15 flex items-center justify-center shrink-0">
                            <Smartphone className="text-[#4cb8c4]" size={28} />
                        </div>
                        <div>
                            <h3 className="text-xl font-semibold">Leve o Zaldemy com você</h3>
                            <p className="text-gray-400 text-sm mt-1 max-w-md">
                                Instale o Zaldemy direto do navegador ou baixe o app para
                                Android e continue seus estudos de onde parou.
                            </p>
                        </div>
                    </div>

                    <Link
                        to="/cadastrar"
                        className="shrink-0 bg-[#4cb8c4] text-white px-8 py-3 rounded-full text-lg font-semibold hover:brightness-110 transition"
                    >
                        Criar minha conta
                    </Link>
                </div>
            </section>

            {/* FOOTER */}
            <footer className="border-t border-gray-800 mt-8">
                <div className="max-w-6xl mx-auto px-5 py-8 flex flex-col sm:flex-row items-center justify-between gap-4">
                    <img src={imgZaldemy} alt="Zaldemy" className="h-7 opacity-80" />

                    <div className="flex flex-wrap justify-center gap-x-6 gap-y-2 text-sm text-gray-400">
                        <Link to="/faq" className="hover:text-white transition-colors">FAQ</Link>
                        <Link to="/contato" className="hover:text-white transition-colors">Contato</Link>
                        <Link to="/termosdeuso" className="hover:text-white transition-colors">Termos de Uso</Link>
                        <Link to="/politicaprivacidade" className="hover:text-white transition-colors">Privacidade</Link>
                    </div>

                    <p className="text-xs text-gray-500">
                        © {new Date().getFullYear()} Zaldemy. Todos os direitos reservados.
                    </p>
                </div>
            </footer>
        </div>
    );
}

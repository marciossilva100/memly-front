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
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import imgZaldemy from "../assets/img/zaldemy.png";
import imgChapeuFormatura from "../assets/img/chapeu_formatura.png";

const iconesRecursos = [Languages, Layers, Sparkles, Volume2, BarChart3, Share2];

export default function LandingPage() {
    const { t } = useTranslation();
    const [menuAberto, setMenuAberto] = useState(false);

    // As telas internas do app usam overflow:hidden no body (rolagem própria,
    // tela única). A landing page é uma página longa de verdade, então
    // liberamos a rolagem do body só enquanto ela estiver montada.
    useEffect(() => {
        const original = document.body.style.overflow;
        document.body.style.overflow = "auto";
        return () => {
            document.body.style.overflow = original;
        };
    }, []);

    const recursos = [1, 2, 3, 4, 5, 6].map((n, index) => ({
        icone: iconesRecursos[index],
        titulo: t(`landing_feature${n}_title`),
        descricao: t(`landing_feature${n}_desc`),
    }));

    return (
        <div className="from-gray-900 to-gray-800 bg-gradient-to-br min-h-screen text-white">

            {/* NAV */}
            <header className="sticky top-0 z-50 backdrop-blur-md bg-gray-900/70 border-b border-gray-800">
                <div className="max-w-6xl mx-auto px-5 py-3 flex items-center justify-between">
                    <img src={imgZaldemy} alt="Zaldemy" className="h-8" />

                    <nav className="hidden md:flex items-center gap-8 text-sm">
                        <a href="#recursos" className="text-gray-300 hover:text-white transition-colors">
                            {t("landing_nav_features")}
                        </a>
                        <Link to="/faq" className="text-gray-300 hover:text-white transition-colors">
                            {t("faq")}
                        </Link>
                        <Link to="/contato" className="text-gray-300 hover:text-white transition-colors">
                            {t("contact")}
                        </Link>
                    </nav>

                    <div className="hidden md:flex items-center gap-3">
                        <Link
                            to="/login"
                            className="text-sm text-white px-5 py-2 rounded-full border border-gray-700 hover:bg-white/5 transition-colors"
                        >
                            {t("sign_in")}
                        </Link>
                        <Link
                            to="/cadastrar"
                            className="text-sm text-white px-5 py-2 rounded-full bg-[#4cb8c4] hover:brightness-110 transition"
                        >
                            {t("landing_signup_button")}
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
                            {t("landing_nav_features")}
                        </a>
                        <Link to="/faq" onClick={() => setMenuAberto(false)} className="text-gray-300">
                            {t("faq")}
                        </Link>
                        <Link to="/contato" onClick={() => setMenuAberto(false)} className="text-gray-300">
                            {t("contact")}
                        </Link>
                        <Link
                            to="/login"
                            className="text-center text-white px-5 py-2 rounded-full border border-gray-700"
                        >
                            {t("sign_in")}
                        </Link>
                        <Link
                            to="/cadastrar"
                            className="text-center text-white px-5 py-2 rounded-full bg-[#4cb8c4]"
                        >
                            {t("landing_signup_button")}
                        </Link>
                    </div>
                )}
            </header>

            {/* HERO */}
            <section className="max-w-6xl mx-auto px-5 pt-16 pb-20 grid md:grid-cols-2 gap-10 items-center">
                <div>
                    <h1 className="text-4xl md:text-5xl font-extrabold leading-tight">
                        {t("landing_hero_title_1")}{" "}
                        <span className="text-[#4cb8c4]">{t("landing_hero_title_2")}</span>
                    </h1>
                    <p className="text-gray-300 text-lg mt-5 max-w-md">
                        {t("landing_hero_description")}
                    </p>

                    <div className="flex flex-col sm:flex-row gap-3 mt-8">
                        <Link
                            to="/cadastrar"
                            className="text-center bg-[#4cb8c4] text-white px-8 py-3 rounded-full text-lg font-semibold hover:brightness-110 transition"
                        >
                            {t("landing_hero_cta_primary")}
                        </Link>
                        <Link
                            to="/login"
                            className="text-center text-white px-8 py-3 rounded-full text-lg border border-gray-700 hover:bg-white/5 transition-colors"
                        >
                            {t("landing_hero_cta_secondary")}
                        </Link>
                    </div>
                </div>

                <div className="flex justify-center">
                    <div className="relative w-64 h-64 md:w-80 md:h-80 flex items-center justify-center">
                        <div className="absolute inset-0 rounded-full bg-[#4cb8c4]/15 blur-2xl" />
                        <div className="relative w-full h-full rounded-full bg-gray-800/60 border border-gray-700 flex items-center justify-center p-14">
                            <img
                                src={imgChapeuFormatura}
                                alt="Zaldemy"
                                className="w-full h-full object-contain"
                            />
                        </div>
                    </div>
                </div>
            </section>

            {/* RECURSOS */}
            <section id="recursos" className="max-w-6xl mx-auto px-5 py-16">
                <div className="text-center mb-12">
                    <h2 className="text-3xl font-bold">{t("landing_features_title")}</h2>
                    <p className="text-gray-400 mt-3 max-w-xl mx-auto">
                        {t("landing_features_subtitle")}
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
                            <h3 className="text-xl font-semibold">{t("landing_app_title")}</h3>
                            <p className="text-gray-400 text-sm mt-1 max-w-md">
                                {t("landing_app_description")}
                            </p>
                        </div>
                    </div>

                    <Link
                        to="/cadastrar"
                        className="shrink-0 bg-[#4cb8c4] text-white px-8 py-3 rounded-full text-lg font-semibold hover:brightness-110 transition"
                    >
                        {t("landing_app_cta")}
                    </Link>
                </div>
            </section>

            {/* FOOTER */}
            <footer className="border-t border-gray-800 mt-8">
                <div className="max-w-6xl mx-auto px-5 py-8 flex flex-col sm:flex-row items-center justify-between gap-4">
                    <img src={imgZaldemy} alt="Zaldemy" className="h-7 opacity-80" />

                    <div className="flex flex-wrap justify-center gap-x-6 gap-y-2 text-sm text-gray-400">
                        <Link to="/faq" className="hover:text-white transition-colors">{t("faq")}</Link>
                        <Link to="/contato" className="hover:text-white transition-colors">{t("contact")}</Link>
                        <Link to="/termosdeuso" className="hover:text-white transition-colors">{t("terms_of_use")}</Link>
                        <Link to="/politicaprivacidade" className="hover:text-white transition-colors">{t("privacy_policy")}</Link>
                    </div>

                    <p className="text-xs text-gray-500">
                        © {new Date().getFullYear()} Zaldemy. {t("landing_footer_rights")}
                    </p>
                </div>
            </footer>
        </div>
    );
}

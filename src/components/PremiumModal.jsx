import React, { useState } from 'react';
import { useTranslation } from "react-i18next";
import { isNativePlatform } from "../utils/googleNativeAuth";

import {
  Sparkles,
  Infinity,
  FileText,
  MessageSquare,
  CheckCircle,
  Zap,
  ChevronRight,
  Star,
  Shield,
  Rocket,
  Target,
  Gem,
  Volume2,
  Mic2,
  WavesIcon,
  X
} from 'lucide-react';

const PremiumModal = ({ isOpen, onClose, motivo }) => {
  const { t } = useTranslation();
  const [assinando, setAssinando] = useState(false);
  const [erroAssinatura, setErroAssinatura] = useState('');
  const API_URL = import.meta.env.VITE_API_URL;

  // Vender assinatura de dentro do app Android (mesmo abrindo o checkout do
  // Stripe num navegador embutido) conta como "venda dentro do app" pra
  // política da Google Play - só é permitido via Google Play Billing, que
  // ainda não está implementado. Por isso esse fluxo só roda na versão web.
  async function assinar() {
    setAssinando(true);
    setErroAssinatura('');

    try {
      const res = await fetch(`${API_URL}/controller/assinatura.php`, {
        method: 'POST',
        headers: {
          "Content-Type": "application/json",
          "Authorization": "Bearer " + localStorage.getItem("token")
        },
        body: JSON.stringify({ action: 'criar_checkout' })
      });

      const data = await res.json();

      if (!data.success || !data.url) {
        setErroAssinatura(data.message || t("server_connection_error"));
        return;
      }

      window.location.href = data.url;
    } catch (error) {
      console.error(error);
      setErroAssinatura(t("server_connection_error"));
    } finally {
      setAssinando(false);
    }
  }

  const premiumFeatures = [
    {
      icon: <Infinity className="w-5 h-5" />,
      title: t("unlimited_flashcards_title"),
      description: t("unlimited_flashcards_desc")
    },
    {
      icon: <FileText className="w-5 h-5" />,
      title: t("detailed_reports_title"),
      description: t("detailed_reports_desc")
    },
    {
      icon: <Mic2 className="w-5 h-5" />,
      title: t("ai_texts_title"),
      description: t("ai_texts_desc")
    },
    {
      icon: <MessageSquare className="w-5 h-5" />,
      title: t("auto_questions_title"),
      description: t("auto_questions_desc")
    },
    {
      icon: <CheckCircle className="w-5 h-5" />,
      title: t("realtime_correction_title"),
      description: t("realtime_correction_desc")
    },
    {
      icon: <Zap className="w-5 h-5" />,
      title: t("smart_cache_title"),
      description: t("smart_cache_desc")
    }
  ];

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Overlay com blur */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Container do Modal */}
      <div className="flex min-h-full items-center justify-center p-3 mt-3">
        {/* Card do Modal */}
        <div className="relative bg-gray-900 rounded-3xl shadow-2xl max-w-4xl w-full h-[calc(100vh-30px)] overflow-y-auto scrollbar-hide border border-gray-700">

          {/* Botão de fechar */}
          <button
            onClick={onClose}
            className="fixed top-3 right-3 z-10 bg-gray-800/80 hover:bg-gray-700 text-gray-300 hover:text-white rounded-full p-2 shadow-lg transition-all hover:scale-110 border border-gray-700"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Conteúdo do Modal */}
          <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-3xl">


            {/* Main Content */}
            <div className="px-2 py-8">

              {motivo && (
                <div className="mx-2 mb-6 bg-amber-500/10 border border-amber-500/30 text-amber-300 text-sm font-medium rounded-xl p-3 text-center">
                  {motivo === "audio" ? t("premium_reason_audio") : null}
                  {motivo === "categorias" ? t("premium_reason_categorias") : null}
                  {motivo === "limite_gratuito" ? t("premium_reason_limite_gratuito") : null}
                </div>
              )}

              {/* Cabeçalho da seção Premium */}
              <div className="text-center mb-8">

                <div className="inline-flex items-center bg-[#4cb8c4]/10 text-[#4cb8c4] px-4 py-2 rounded-full mb-4 border border-[#4cb8c4]/20">
                  <Gem className="w-4 h-4 mr-2 text-[#4cb8c4]" />
                  <span className="text-sm font-semibold">{t("premium_badge")}</span>
                </div>
                <h1 className="text-3xl font-bold text-white mb-3">
                  {t("premium_headline_part1")}{' '}
                  <span className="bg-gradient-to-r from-[#4cb8c4] to-[#085078] bg-clip-text text-transparent">
                    {t("premium_headline_part2")}
                  </span>
                </h1>
                <p className="text-lg text-gray-300 max-w-2xl mx-auto">
                  {t("premium_subtitle")}
                </p>
              </div>

              {/* Card do Plano Premium */}
              <div className="relative">
                <div className="bg-gray-800/50 backdrop-blur-sm rounded-2xl shadow-xl overflow-hidden border border-gray-700 relative">
                  {/* Badge de destaque */}
                  <div className="bg-gradient-to-r from-[#4cb8c4] to-[#085078] text-white text-center py-2 text-xs font-semibold relative overflow-hidden">
                    <div className="absolute inset-0 bg-white/10 animate-pulse"></div>
                    <span className="relative z-10 flex items-center justify-center">
                      <Rocket className="w-3 h-3 mr-1" />
                      {t("premium_ribbon")}
                    </span>
                  </div>

                  <div className="p-6 lg:p-8">
                    {/* Preço e benefício principal */}
                    <div className="flex flex-col lg:flex-row items-center justify-between gap-4 mb-6">
                      <div className="text-center lg:text-left">
                        <div className="flex items-center justify-center lg:justify-start mb-1">
                          <span className="text-5xl font-bold text-white">US$ 4,90</span>
                          <span className="text-gray-300 ml-2">{t("per_month")}</span>
                        </div>
                        <div className="flex items-center justify-center lg:justify-start space-x-2">
                          <Star className="w-4 h-4 text-[#4cb8c4] fill-current" />
                          <p className="text-sm text-gray-300">{t("save_up_to")}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 bg-[#4cb8c4]/10 px-5 py-2 rounded-xl border border-[#4cb8c4]/20">
                        <Target className="w-5 h-5 text-[#4cb8c4]" />
                        <div>
                          <p className="text-xs text-gray-300">{t("exclusive_content")}</p>
                          <p className="font-bold text-[#4cb8c4] text-sm">{t("based_on_vocabulary")}</p>
                        </div>
                      </div>
                    </div>

                    {/* Destaque para qualidade de áudio */}
                    <div className="mb-6 bg-gray-900/50 rounded-xl p-4 border border-gray-700">
                      <div className="flex items-center gap-2 mb-3">
                        <div className="bg-[#4cb8c4]/10 p-1.5 rounded-lg">
                          <Mic2 className="w-4 h-4 text-[#4cb8c4]" />
                        </div>
                        <h3 className="font-semibold text-[#4cb8c4] text-sm">{t("superior_audio_quality")}</h3>
                      </div>

                      <div className="grid sm:grid-cols-2 gap-3">
                        {/* Plano Free */}
                        <div className="bg-gray-800/60 rounded-lg p-3 border border-gray-700">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-xs font-medium text-gray-300">{t("free_plan")}</span>
                            <Volume2 className="w-3 h-3 text-gray-400" />
                          </div>
                          <p className="text-xs text-gray-400 mb-1">{t("standard_voice")}</p>
                          <div className="flex items-center gap-1">
                            <WavesIcon className="w-3 h-3 text-gray-500" />
                            <WavesIcon className="w-3 h-3 text-gray-500" />
                            <WavesIcon className="w-3 h-3 text-gray-500" />
                            <span className="text-xs text-gray-400 ml-1">{t("standard_quality")}</span>
                          </div>
                        </div>

                        {/* Plano Premium */}
                        <div className="bg-gradient-to-r from-[#4cb8c4]/10 to-[#085078]/10 rounded-lg p-3 border border-[#4cb8c4]/30">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-xs font-medium text-[#4cb8c4]">{t("premium_plan")}</span>
                            <div className="flex items-center gap-1">
                              <Sparkles className="w-3 h-3 text-[#4cb8c4]" />
                              <Mic2 className="w-3 h-3 text-[#4cb8c4]" />
                            </div>
                          </div>
                          <p className="text-xs text-gray-300 mb-1">{t("ultra_realistic_audio")}</p>
                          <div className="flex items-center gap-1">
                            <WavesIcon className="w-3 h-3 text-[#4cb8c4]" />
                            <WavesIcon className="w-3 h-3 text-[#4cb8c4]" />
                            <WavesIcon className="w-3 h-3 text-[#4cb8c4]" />
                            <WavesIcon className="w-3 h-3 text-[#4cb8c4]" />
                            <span className="text-xs text-[#4cb8c4] ml-1">{t("premium_quality")}</span>
                          </div>
                        </div>
                      </div>

                      <p className="text-xs text-gray-400 mt-2 italic">
                        {t("audio_quality_note")}
                      </p>
                    </div>

                    {/* Grid de funcionalidades Premium */}
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3 mb-6">
                      {premiumFeatures.map((feature, index) => (
                        <div
                          key={index}
                          className="group p-3 bg-gray-900/50 rounded-xl border border-gray-700 hover:border-[#4cb8c4] transition-all"
                        >
                          <div className="flex items-start space-x-2">
                            <div className="flex-shrink-0 w-8 h-8 bg-[#4cb8c4]/10 rounded-lg flex items-center justify-center text-[#4cb8c4] group-hover:scale-110 transition-transform">
                              {feature.icon}
                            </div>
                            <div>
                              <h3 className="font-semibold text-white text-sm">
                                {feature.title}
                              </h3>
                              <p className="text-xs text-gray-300">{feature.description}</p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Botão de assinatura - só funciona na web (Stripe). No
                        app Android, vender aqui exigiria Google Play Billing
                        (ainda não implementado), então só mostra o aviso. */}
                    {isNativePlatform() ? (
                      <div className="w-full bg-gray-800/50 border border-gray-700 text-gray-300 text-sm text-center py-4 px-6 rounded-xl mb-4">
                        {t("subscribe_on_website_hint")}
                      </div>
                    ) : (
                      <button
                        onClick={assinar}
                        disabled={assinando}
                        className="w-full bg-gradient-to-r from-[#4cb8c4] to-[#085078] hover:from-[#3da5b0] hover:to-[#064060] disabled:opacity-60 text-white font-bold py-4 px-6 rounded-xl transition-all transform hover:scale-[1.02] shadow-xl hover:shadow-2xl flex items-center justify-center space-x-2 group mb-4"
                      >
                        <Sparkles className="w-4 h-4 group-hover:rotate-12 transition-transform" />
                        <span>{assinando ? t("redirecting_to_checkout") : t("activate_premium_button")}</span>
                        <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                      </button>
                    )}

                    {erroAssinatura && (
                      <p className="text-center text-red-400 text-xs mb-4">{erroAssinatura}</p>
                    )}

                    {/* Selos de garantia */}
                    <div className="flex flex-wrap justify-center gap-4">
                      <div className="flex items-center text-xs text-gray-400">
                        <Shield className="w-3 h-3 text-[#4cb8c4] mr-1" />
                        {t("secure_payment")}
                      </div>
                      <div className="flex items-center text-xs text-gray-400">
                        <CheckCircle className="w-3 h-3 text-[#4cb8c4] mr-1" />
                        {t("cancel_anytime")}
                      </div>
                      <div className="flex items-center text-xs text-gray-400">
                        <Star className="w-3 h-3 text-[#4cb8c4] mr-1 fill-current" />
                        {t("money_back_guarantee")}
                      </div>
                    </div>

                    {/* Saída discreta - fecha sem assinar */}
                    <div className="text-center mt-4">
                      <button
                        onClick={onClose}
                        className="text-xs text-gray-400 hover:text-gray-200 underline underline-offset-2 transition-colors"
                      >
                        {t("continue_without_premium_voice")}
                      </button>
                    </div>
                  </div>
                </div>
              </div>

            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PremiumModal;

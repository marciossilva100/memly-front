import React from 'react';
import { useTranslation } from "react-i18next";

import {
  Sparkles,
  Infinity,
  FileText,
  MessageSquare,
  CheckCircle,
  BarChart3,
  Zap,
  Brain,
  ChevronRight,
  Star,
  Shield,
  Award,
  Rocket,
  Target,
  Gem,
  Waves,
  Volume2,
  Mic2,
  WavesIcon,
  X
} from 'lucide-react';

const PremiumModal = ({ isOpen, onClose, setOpenFrase, motivo }) => {
  const { t } = useTranslation();
  const premiumFeatures = [
    {
      icon: <Infinity className="w-5 h-5" />,
      title: t("unlimited_flashcards_title"),
      description: t("unlimited_flashcards_desc")
    },
    {
      icon: <FileText className="w-5 h-5" />,
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
      icon: <BarChart3 className="w-5 h-5" />,
      title: t("detailed_reports_title"),
      description: t("detailed_reports_desc")
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
        className="fixed inset-0 bg-black/50 backdrop-blur-sm transition-opacity"
        onClick={() => {
          onClose();
          setOpenFrase(true);
        }}
      />

      {/* Container do Modal */}
      <div className="flex min-h-full items-center justify-center p-3 mt-3">
        {/* Card do Modal */}
        <div className="relative bg-white rounded-3xl shadow-2xl max-w-4xl w-full h-[calc(100vh-30px)] overflow-y-auto scrollbar-hide ">

          {/* Botão de fechar */}
          <button
            onClick={() => {
              onClose();
              setOpenFrase(true);
            }}
            className="fixed top-3 right-3 z-10 bg-white/90 hover:bg-white text-gray-500 hover:text-gray-700 rounded-full p-2 shadow-lg transition-all hover:scale-110 border border-gray-200"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Conteúdo do Modal */}
          <div className="bg-gradient-to-br from-[#4cb8c4]/10 via-blue-50 to-[#085078]/10 rounded-3xl">


            {/* Main Content */}
            <div className="px-2 py-8">

              {motivo && (
                <div className="mx-2 mb-6 bg-amber-50 border border-amber-200 text-amber-800 text-sm font-medium rounded-xl p-3 text-center">
                  {motivo === "audio" ? t("premium_reason_audio") : null}
                  {motivo === "categorias" ? t("premium_reason_categorias") : null}
                </div>
              )}

              {/* Cabeçalho da seção Premium */}
              <div className="text-center mb-8">

                <div className="inline-flex items-center bg-[#4cb8c4]/10 text-[#085078] px-4 py-2 rounded-full mb-4 border border-[#4cb8c4]/20 shadow-sm">
                  <Gem className="w-4 h-4 mr-2 text-[#4cb8c4]" />
                  <span className="text-sm font-semibold">{t("premium_badge")}</span>
                </div>
                <h1 className="text-3xl font-bold text-gray-900 mb-3">
                  {t("premium_headline_part1")}{' '}
                  <span className="bg-gradient-to-r from-[#4cb8c4] to-[#085078] bg-clip-text text-transparent">
                    {t("premium_headline_part2")}
                  </span>
                </h1>
                <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                  {t("premium_subtitle")}
                </p>
                <button className="bg-gradient-to-r from-[#4cb8c4] to-[#085078] hover:from-[#3da5b0] hover:to-[#064060] text-white px-4 py-2 rounded-lg text-lg font-semibold transition-all shadow-md hover:shadow-lg mt-4">
                  {t("start_free")}
                </button>
              </div>

              {/* Card do Plano Premium */}
              <div className="relative">
                {/* Elementos decorativos com as cores da marca */}
                <div className="absolute -top-4 -left-4 w-24 h-24 bg-[#4cb8c4] rounded-full opacity-20 blur-2xl"></div>
                <div className="absolute -bottom-4 -right-4 w-32 h-32 bg-[#085078] rounded-full opacity-20 blur-2xl"></div>
                <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-48 h-48 bg-[#60a5fa] rounded-full opacity-10 blur-3xl"></div>

                <div className="bg-white rounded-2xl shadow-xl overflow-hidden border-2 border-[#4cb8c4]/20 relative">
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
                          <span className="text-5xl font-bold text-gray-900">US$ 4,90</span>
                          <span className="text-gray-500 ml-2">{t("per_month")}</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Star className="w-4 h-4 text-[#4cb8c4] fill-current" />
                          <p className="text-sm text-gray-600">{t("save_up_to")}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 bg-[#4cb8c4]/10 px-5 py-2 rounded-xl border border-[#4cb8c4]/20">
                        <Target className="w-5 h-5 text-[#085078]" />
                        <div>
                          <p className="text-xs text-gray-600">{t("exclusive_content")}</p>
                          <p className="font-bold text-[#085078] text-sm">{t("based_on_vocabulary")}</p>
                        </div>
                      </div>
                    </div>

                    {/* Destaque para qualidade de áudio */}
                    <div className="mb-6 bg-gradient-to-r from-blue-50 to-[#4cb8c4]/5 rounded-xl p-4 border border-[#4cb8c4]/20">
                      <div className="flex items-center gap-2 mb-3">
                        <div className="bg-[#085078]/10 p-1.5 rounded-lg">
                          <Mic2 className="w-4 h-4 text-[#085078]" />
                        </div>
                        <h3 className="font-semibold text-[#085078] text-sm">{t("superior_audio_quality")}</h3>
                      </div>

                      <div className="grid sm:grid-cols-2 gap-3">
                        {/* Plano Free */}
                        <div className="bg-white/60 rounded-lg p-3 border border-gray-200">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-xs font-medium text-gray-700">{t("free_plan")}</span>
                            <Volume2 className="w-3 h-3 text-gray-400" />
                          </div>
                          <p className="text-xs text-gray-500 mb-1">{t("standard_voice")}</p>
                          <div className="flex items-center gap-1">
                            <WavesIcon className="w-3 h-3 text-gray-300" />
                            <WavesIcon className="w-3 h-3 text-gray-300" />
                            <WavesIcon className="w-3 h-3 text-gray-300" />
                            <span className="text-xs text-gray-400 ml-1">{t("standard_quality")}</span>
                          </div>
                        </div>

                        {/* Plano Premium com ElevenLabs */}
                        <div className="bg-gradient-to-r from-[#4cb8c4]/10 to-[#085078]/10 rounded-lg p-3 border border-[#4cb8c4]/30">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-xs font-medium text-[#085078]">{t("premium_plan")}</span>
                            <div className="flex items-center gap-1">
                              <Sparkles className="w-3 h-3 text-[#4cb8c4]" />
                              <Mic2 className="w-3 h-3 text-[#085078]" />
                            </div>
                          </div>
                          <p className="text-xs font-medium text-[#4cb8c4] mb-1">ElevenLabs</p>
                          <p className="text-xs text-gray-600 mb-1">{t("ultra_realistic_audio")}</p>
                          <div className="flex items-center gap-1">
                            <WavesIcon className="w-3 h-3 text-[#4cb8c4]" />
                            <WavesIcon className="w-3 h-3 text-[#4cb8c4]" />
                            <WavesIcon className="w-3 h-3 text-[#4cb8c4]" />
                            <WavesIcon className="w-3 h-3 text-[#4cb8c4]" />
                            <span className="text-xs text-[#085078] ml-1">{t("premium_quality")}</span>
                          </div>
                        </div>
                      </div>

                      <p className="text-xs text-gray-500 mt-2 italic">
                        {t("audio_quality_note")}
                      </p>
                    </div>

                    {/* Grid de funcionalidades Premium */}
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3 mb-6">
                      {premiumFeatures.map((feature, index) => (
                        <div
                          key={index}
                          className="group p-3 bg-gradient-to-br from-gray-50 to-white rounded-xl border border-gray-200 hover:border-[#4cb8c4] hover:shadow-md transition-all"
                        >
                          <div className="flex items-start space-x-2">
                            <div className="flex-shrink-0 w-8 h-8 bg-gradient-to-br from-[#4cb8c4]/20 to-[#085078]/20 rounded-lg flex items-center justify-center text-[#085078] group-hover:scale-110 transition-transform group-hover:text-[#4cb8c4]">
                              {feature.icon}
                            </div>
                            <div>
                              <h3 className="font-semibold text-gray-900 text-sm group-hover:text-[#085078] transition-colors">
                                {feature.title}
                              </h3>
                              <p className="text-xs text-gray-500">{feature.description}</p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Benefícios exclusivos */}
                    <div className="grid sm:grid-cols-3 gap-3 mb-6">
                      <div className="bg-gradient-to-br from-[#4cb8c4]/10 to-[#085078]/10 rounded-xl p-3 text-center border border-[#4cb8c4]/20">
                        <Brain className="w-5 h-5 text-[#085078] mx-auto mb-1" />
                        <p className="text-xs font-semibold text-gray-700">{t("adaptive_ai")}</p>
                        <p className="text-xs text-gray-500">{t("adaptive_ai_desc")}</p>
                      </div>
                      <div className="bg-gradient-to-br from-[#4cb8c4]/10 to-[#085078]/10 rounded-xl p-3 text-center border border-[#4cb8c4]/20">
                        <Zap className="w-5 h-5 text-[#085078] mx-auto mb-1" />
                        <p className="text-xs font-semibold text-gray-700">{t("smart_cache_label")}</p>
                        <p className="text-xs text-gray-500">{t("smart_cache_label_desc")}</p>
                      </div>
                      <div className="bg-gradient-to-br from-[#4cb8c4]/10 to-[#085078]/10 rounded-xl p-3 text-center border border-[#4cb8c4]/20">
                        <Award className="w-5 h-5 text-[#085078] mx-auto mb-1" />
                        <p className="text-xs font-semibold text-gray-700">{t("exclusive_content_label")}</p>
                        <p className="text-xs text-gray-500">{t("exclusive_content_desc")}</p>
                      </div>
                    </div>

                    {/* Botão de assinatura */}
                    <button className="w-full bg-gradient-to-r from-[#4cb8c4] to-[#085078] hover:from-[#3da5b0] hover:to-[#064060] text-white font-bold py-4 px-6 rounded-xl transition-all transform hover:scale-[1.02] shadow-xl hover:shadow-2xl flex items-center justify-center space-x-2 group mb-4">
                      <Sparkles className="w-4 h-4 group-hover:rotate-12 transition-transform" />
                      <span>{t("activate_premium_button")}</span>
                      <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    </button>

                    {/* Selos de garantia */}
                    <div className="flex flex-wrap justify-center gap-4">
                      <div className="flex items-center text-xs text-gray-500">
                        <Shield className="w-3 h-3 text-[#4cb8c4] mr-1" />
                        {t("secure_payment")}
                      </div>
                      <div className="flex items-center text-xs text-gray-500">
                        <CheckCircle className="w-3 h-3 text-[#4cb8c4] mr-1" />
                        {t("cancel_anytime")}
                      </div>
                      <div className="flex items-center text-xs text-gray-500">
                        <Star className="w-3 h-3 text-[#60a5fa] mr-1 fill-current" />
                        {t("money_back_guarantee")}
                      </div>
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
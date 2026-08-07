import { useState } from 'react';
import { useTranslation } from "react-i18next";
import { isNativePlatform } from "../utils/googleNativeAuth";

import {
  Sparkles,
  Infinity as InfinityIcon,
  FileText,
  MessageSquare,
  CheckCircle,
  Zap,
  ChevronRight,
  Shield,
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

  // Cada item aqui é uma promessa que já foi conferida contra o código real
  // (limite de categorias, limite de frases/dia, quotas de IA etc.) - não
  // adicione nada aqui sem confirmar que o backend realmente cumpre.
  const premiumFeatures = [
    {
      icon: <InfinityIcon className="w-5 h-5" />,
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
      icon: <Target className="w-5 h-5" />,
      title: t("based_on_vocabulary_title"),
      description: t("based_on_vocabulary_desc")
    },
    {
      icon: <Zap className="w-5 h-5" />,
      title: t("smart_cache_title"),
      description: t("smart_cache_desc")
    }
  ];

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto scrollbar-hide">
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

      {/* items-start, não items-center: centralizar verticalmente com
          align-items:center + overflow trava a rolagem do conteúdo que
          fica ACIMA do centro em alguns navegadores (reproduzido no Safari
          do iPhone SE) - o conteúdo que passa da tela fica inacessível
          mesmo com overflow-y:auto no container. Com items-start, a
          rolagem sempre funciona; o padding vertical mantém a aparência
          equilibrada quando o conteúdo cabe inteiro na tela. */}
      <div className="flex min-h-full items-start justify-center p-3 py-8">
        <div className="relative w-full max-w-md bg-gradient-to-b from-gray-900 to-gray-800 rounded-3xl shadow-2xl border border-gray-700 max-h-[calc(100dvh-4rem)] overflow-y-auto scrollbar-hide">

          <button
            onClick={onClose}
            className="sticky top-3 float-right mr-3 z-10 bg-gray-800/90 hover:bg-gray-700 text-gray-300 hover:text-white rounded-full p-2 shadow-lg transition-colors border border-gray-700"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="px-6 pt-6 pb-8">

            {motivo && (
              <div className="mb-6 bg-amber-500/10 border border-amber-500/30 text-amber-200 text-sm font-medium rounded-xl p-3 text-center">
                {motivo === "audio" ? t("premium_reason_audio") : null}
                {motivo === "categorias" ? t("premium_reason_categorias") : null}
                {motivo === "categoria_ia" ? t("premium_reason_categoria_ia") : null}
                {motivo === "jogo_chuva" ? t("premium_reason_jogo_chuva") : null}
                {motivo === "perguntas_ia" ? t("premium_reason_perguntas_ia") : null}
                {motivo === "frase_dia_ia" ? t("premium_reason_frase_dia_ia") : null}
              </div>
            )}

            {/* Cabeçalho */}
            <div className="text-center mb-6">
              <div className="inline-flex items-center bg-[#4cb8c4]/10 text-[#4cb8c4] px-4 py-1.5 rounded-full mb-4 border border-[#4cb8c4]/20">
                <Gem className="w-4 h-4 mr-2" />
                <span className="text-sm font-semibold">{t("premium_badge")}</span>
              </div>
              <h1 className="text-2xl font-bold text-white mb-2">
                {t("premium_headline_part1")}{' '}
                <span className="bg-gradient-to-r from-[#4cb8c4] to-[#085078] bg-clip-text text-transparent">
                  {t("premium_headline_part2")}
                </span>
              </h1>
              <p className="text-base text-gray-300">
                {t("premium_subtitle")}
              </p>
            </div>

            {/* Preço */}
            <div className="text-center mb-6">
              <span className="text-4xl font-bold text-white">US$ 4,90</span>
              <span className="text-gray-300 ml-1">{t("per_month")}</span>
            </div>

            {/* Qualidade de áudio: free x premium */}
            <div className="mb-6 bg-gray-800/50 rounded-xl p-4 border border-gray-700">
              <div className="flex items-center gap-2 mb-3">
                <Mic2 className="w-4 h-4 text-[#4cb8c4]" />
                <h3 className="font-semibold text-[#4cb8c4] text-sm">{t("superior_audio_quality")}</h3>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="bg-gray-900/60 rounded-lg p-3 border border-gray-700">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-medium text-gray-200">{t("free_plan")}</span>
                    <Volume2 className="w-3 h-3 text-gray-400" />
                  </div>
                  <p className="text-xs text-gray-300 mb-1">{t("standard_voice")}</p>
                  <div className="flex items-center gap-1">
                    <WavesIcon className="w-3 h-3 text-gray-500" />
                    <WavesIcon className="w-3 h-3 text-gray-500" />
                    <WavesIcon className="w-3 h-3 text-gray-500" />
                    <span className="text-xs text-gray-400 ml-1">{t("standard_quality")}</span>
                  </div>
                </div>

                <div className="bg-gradient-to-br from-[#4cb8c4]/15 to-[#085078]/15 rounded-lg p-3 border border-[#4cb8c4]/30">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-medium text-[#4cb8c4]">{t("premium_plan")}</span>
                    <Sparkles className="w-3 h-3 text-[#4cb8c4]" />
                  </div>
                  <p className="text-xs text-gray-100 mb-1">{t("ultra_realistic_audio")}</p>
                  <div className="flex items-center gap-1">
                    <WavesIcon className="w-3 h-3 text-[#4cb8c4]" />
                    <WavesIcon className="w-3 h-3 text-[#4cb8c4]" />
                    <WavesIcon className="w-3 h-3 text-[#4cb8c4]" />
                    <WavesIcon className="w-3 h-3 text-[#4cb8c4]" />
                    <span className="text-xs text-[#4cb8c4] ml-1">{t("premium_quality")}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Lista de funcionalidades */}
            <div className="flex flex-col gap-3 mb-6">
              {premiumFeatures.map((feature, index) => (
                <div
                  key={index}
                  className="flex items-start gap-3 p-3 bg-gray-800/50 rounded-xl border border-gray-700"
                >
                  <div className="shrink-0 w-9 h-9 bg-[#4cb8c4]/10 rounded-lg flex items-center justify-center text-[#4cb8c4]">
                    {feature.icon}
                  </div>
                  <div>
                    <h3 className="font-semibold text-white text-sm">
                      {feature.title}
                    </h3>
                    <p className="text-sm text-gray-300">{feature.description}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Botão de assinatura - só funciona na web (Stripe). No app
                Android, vender aqui exigiria Google Play Billing (ainda não
                implementado), então só mostra o aviso. */}
            {isNativePlatform() ? (
              <div className="w-full bg-gray-800/50 border border-gray-700 text-gray-200 text-sm text-center py-4 px-6 rounded-xl mb-4">
                {t("subscribe_on_website_hint")}
              </div>
            ) : (
              <button
                onClick={assinar}
                disabled={assinando}
                className="w-full bg-gradient-to-r from-[#4cb8c4] to-[#085078] hover:from-[#3da5b0] hover:to-[#064060] disabled:opacity-60 text-white font-bold py-3.5 px-6 rounded-xl transition-all shadow-lg flex items-center justify-center gap-2 group mb-4"
              >
                <Sparkles className="w-4 h-4" />
                <span>{assinando ? t("redirecting_to_checkout") : t("activate_premium_button")}</span>
                <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </button>
            )}

            {erroAssinatura && (
              <p className="text-center text-red-400 text-xs mb-4">{erroAssinatura}</p>
            )}

            {/* Confiança - só o que o app realmente cumpre hoje */}
            <div className="flex flex-wrap justify-center gap-4 mb-1">
              <div className="flex items-center text-xs text-gray-400">
                <Shield className="w-3 h-3 text-[#4cb8c4] mr-1" />
                {t("secure_payment")}
              </div>
              <div className="flex items-center text-xs text-gray-400">
                <CheckCircle className="w-3 h-3 text-[#4cb8c4] mr-1" />
                {t("cancel_anytime")}
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
  );
};

export default PremiumModal;

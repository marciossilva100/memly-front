import React from 'react';
import imgZaldemy from "../assets/img/zaldemy.png"

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

const PremiumModal = ({ isOpen, onClose }) => {
  const premiumFeatures = [
    {
      icon: <Infinity className="w-5 h-5" />,
      title: "Flashcards ilimitados",
      description: "Sem limites de cards ativos para seu vocabulário"
    },
    {
      icon: <FileText className="w-5 h-5" />,
      title: "Textos personalizados com IA",
      description: "Conteúdo gerado exclusivamente com suas palavras"
    },
    {
      icon: <MessageSquare className="w-5 h-5" />,
      title: "Perguntas automáticas",
      description: "IA cria exercícios contextualizados para você"
    },
    {
      icon: <CheckCircle className="w-5 h-5" />,
      title: "Correção em tempo real",
      description: "Feedback instantâneo em todos os exercícios"
    },
    {
      icon: <BarChart3 className="w-5 h-5" />,
      title: "Relatórios detalhados",
      description: "Métricas completas do seu progresso"
    },
    {
      icon: <Zap className="w-5 h-5" />,
      title: "Cache inteligente",
      description: "Experiência otimizada e sem custos extras"
    }
  ];

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Overlay com blur */}
      <div 
        className="fixed inset-0 bg-black/50 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />
      
      {/* Container do Modal */}
      <div className="flex min-h-full items-center justify-center p-3 mt-3">
        {/* Card do Modal */}
        <div className="relative bg-white rounded-3xl shadow-2xl max-w-4xl w-full h-[calc(100vh-30px)] overflow-y-auto scrollbar-hide ">
          
          {/* Botão de fechar */}
          <button
            onClick={onClose}
            className="fixed top-3 right-3 z-10 bg-white/90 hover:bg-white text-gray-500 hover:text-gray-700 rounded-full p-2 shadow-lg transition-all hover:scale-110 border border-gray-200"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Conteúdo do Modal */}
          <div className="bg-gradient-to-br from-[#4cb8c4]/10 via-blue-50 to-[#085078]/10 rounded-3xl">
            

            {/* Main Content */}
            <div className="px-2 py-8">
              {/* Cabeçalho da seção Premium */}
              <div className="text-center mb-8">
              
                <div className="inline-flex items-center bg-[#4cb8c4]/10 text-[#085078] px-4 py-2 rounded-full mb-4 border border-[#4cb8c4]/20 shadow-sm">
                  <Gem className="w-4 h-4 mr-2 text-[#4cb8c4]" />
                  <span className="text-sm font-semibold">PLANO PREMIUM ZALDEMY+</span>
                </div>
                <h1 className="text-3xl font-bold text-gray-900 mb-3">
                  Acelere seu aprendizado{' '}
                  <span className="bg-gradient-to-r from-[#4cb8c4] to-[#085078] bg-clip-text text-transparent">
                    com IA
                  </span>
                </h1>
                <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                  Tenha acesso ilimitado a todos os recursos e transforme seu vocabulário em conhecimento fluente
                </p>
                   <button className="bg-gradient-to-r from-[#4cb8c4] to-[#085078] hover:from-[#3da5b0] hover:to-[#064060] text-white px-4 py-2 rounded-lg text-lg font-semibold transition-all shadow-md hover:shadow-lg mt-4">
                    Começar grátis
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
                      EXPERIÊNCIA COMPLETA • SEM ANÚNCIOS • CONTEÚDO PERSONALIZADO
                    </span>
                  </div>
                  
                  <div className="p-6 lg:p-8">
                    {/* Preço e benefício principal */}
                    <div className="flex flex-col lg:flex-row items-center justify-between gap-4 mb-6">
                      <div className="text-center lg:text-left">
                        <div className="flex items-center justify-center lg:justify-start mb-1">
                          <span className="text-5xl font-bold text-gray-900">US$ 5</span>
                          <span className="text-gray-500 ml-2">/mês</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Star className="w-4 h-4 text-[#4cb8c4] fill-current" />
                          <p className="text-sm text-gray-600">Economize até 80% comparado a outros apps</p>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-3 bg-[#4cb8c4]/10 px-5 py-2 rounded-xl border border-[#4cb8c4]/20">
                        <Target className="w-5 h-5 text-[#085078]" />
                        <div>
                          <p className="text-xs text-gray-600">Conteúdo exclusivo</p>
                          <p className="font-bold text-[#085078] text-sm">90% baseado no seu vocabulário</p>
                        </div>
                      </div>
                    </div>

                    {/* Destaque para qualidade de áudio */}
                    <div className="mb-6 bg-gradient-to-r from-blue-50 to-[#4cb8c4]/5 rounded-xl p-4 border border-[#4cb8c4]/20">
                      <div className="flex items-center gap-2 mb-3">
                        <div className="bg-[#085078]/10 p-1.5 rounded-lg">
                          <Mic2 className="w-4 h-4 text-[#085078]" />
                        </div>
                        <h3 className="font-semibold text-[#085078] text-sm">Áudio com qualidade superior</h3>
                      </div>
                      
                      <div className="grid sm:grid-cols-2 gap-3">
                        {/* Plano Free */}
                        <div className="bg-white/60 rounded-lg p-3 border border-gray-200">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-xs font-medium text-gray-700">Plano Free</span>
                            <Volume2 className="w-3 h-3 text-gray-400" />
                          </div>
                          <p className="text-xs text-gray-500 mb-1">voz padrão</p>
                          <div className="flex items-center gap-1">
                            <WavesIcon className="w-3 h-3 text-gray-300" />
                            <WavesIcon className="w-3 h-3 text-gray-300" />
                            <WavesIcon className="w-3 h-3 text-gray-300" />
                            <span className="text-xs text-gray-400 ml-1">qualidade padrão</span>
                          </div>
                        </div>

                        {/* Plano Premium com ElevenLabs */}
                        <div className="bg-gradient-to-r from-[#4cb8c4]/10 to-[#085078]/10 rounded-lg p-3 border border-[#4cb8c4]/30">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-xs font-medium text-[#085078]">Plano Premium</span>
                            <div className="flex items-center gap-1">
                              <Sparkles className="w-3 h-3 text-[#4cb8c4]" />
                              <Mic2 className="w-3 h-3 text-[#085078]" />
                            </div>
                          </div>
                          <p className="text-xs font-medium text-[#4cb8c4] mb-1">ElevenLabs</p>
                          <p className="text-xs text-gray-600 mb-1">áudios ultra-realistas</p>
                          <div className="flex items-center gap-1">
                            <WavesIcon className="w-3 h-3 text-[#4cb8c4]" />
                            <WavesIcon className="w-3 h-3 text-[#4cb8c4]" />
                            <WavesIcon className="w-3 h-3 text-[#4cb8c4]" />
                            <WavesIcon className="w-3 h-3 text-[#4cb8c4]" />
                            <span className="text-xs text-[#085078] ml-1">qualidade premium</span>
                          </div>
                        </div>
                      </div>
                      
                      <p className="text-xs text-gray-500 mt-2 italic">
                        ✨ No plano free você já tem acesso a pronúncias claras. No Premium, suas palavras ganham vida com vozes ultra-realistas do ElevenLabs!
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
                        <p className="text-xs font-semibold text-gray-700">IA Adaptativa</p>
                        <p className="text-xs text-gray-500">Aprende com seu progresso</p>
                      </div>
                      <div className="bg-gradient-to-br from-[#4cb8c4]/10 to-[#085078]/10 rounded-xl p-3 text-center border border-[#4cb8c4]/20">
                        <Zap className="w-5 h-5 text-[#085078] mx-auto mb-1" />
                        <p className="text-xs font-semibold text-gray-700">Cache Inteligente</p>
                        <p className="text-xs text-gray-500">Performance otimizada</p>
                      </div>
                      <div className="bg-gradient-to-br from-[#4cb8c4]/10 to-[#085078]/10 rounded-xl p-3 text-center border border-[#4cb8c4]/20">
                        <Award className="w-5 h-5 text-[#085078] mx-auto mb-1" />
                        <p className="text-xs font-semibold text-gray-700">Conteúdo Exclusivo</p>
                        <p className="text-xs text-gray-500">Feito sob medida para você</p>
                      </div>
                    </div>

                    {/* Botão de assinatura */}
                    <button className="w-full bg-gradient-to-r from-[#4cb8c4] to-[#085078] hover:from-[#3da5b0] hover:to-[#064060] text-white font-bold py-4 px-6 rounded-xl transition-all transform hover:scale-[1.02] shadow-xl hover:shadow-2xl flex items-center justify-center space-x-2 group mb-4">
                      <Sparkles className="w-4 h-4 group-hover:rotate-12 transition-transform" />
                      <span>Ativar Zaldemy+ por apenas US$ 5/mês</span>
                      <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    </button>
                    
                    {/* Selos de garantia */}
                    <div className="flex flex-wrap justify-center gap-4">
                      <div className="flex items-center text-xs text-gray-500">
                        <Shield className="w-3 h-3 text-[#4cb8c4] mr-1" />
                        Pagamento 100% seguro
                      </div>
                      <div className="flex items-center text-xs text-gray-500">
                        <CheckCircle className="w-3 h-3 text-[#4cb8c4] mr-1" />
                        Cancele quando quiser
                      </div>
                      <div className="flex items-center text-xs text-gray-500">
                        <Star className="w-3 h-3 text-[#60a5fa] mr-1 fill-current" />
                        7 dias de garantia
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Seção de projeções */}
              <div className="mt-8 text-center">
                <div className="inline-flex items-center gap-2 bg-white/60 backdrop-blur-sm px-5 py-2 rounded-full border border-[#4cb8c4]/20">
                  <span className="text-[#085078] font-bold text-sm">6.000+</span>
                  <span className="text-gray-600 text-xs">alunos ativos</span>
                  <span className="w-1 h-1 bg-[#4cb8c4] rounded-full"></span>
                  <span className="text-[#4cb8c4] font-bold text-sm">★★★★★</span>
                  <span className="text-gray-500 text-xs">(4.8)</span>
                </div>
                
                <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-3 max-w-2xl mx-auto">
                  <div className="bg-white/50 backdrop-blur-sm rounded-xl p-3 border border-[#4cb8c4]/20">
                    <p className="text-xl font-bold text-[#085078]">105</p>
                    <p className="text-xs text-gray-600">Premium no Ano 1</p>
                  </div>
                  <div className="bg-white/50 backdrop-blur-sm rounded-xl p-3 border border-[#4cb8c4]/20">
                    <p className="text-xl font-bold text-[#085078]">750</p>
                    <p className="text-xs text-gray-600">Premium no Ano 2</p>
                  </div>
                  <div className="bg-white/50 backdrop-blur-sm rounded-xl p-3 border border-[#4cb8c4]/20">
                    <p className="text-xl font-bold text-[#085078]">2.8k</p>
                    <p className="text-xs text-gray-600">Premium no Ano 3</p>
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
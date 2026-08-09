import { useNavigate } from "react-router-dom";
import { FileText } from "lucide-react";

// Conteúdo base dos Termos de Uso. Revisar com um advogado antes de publicar em produção.
export default function TermosDeUso() {
    const navigate = useNavigate();

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
                        <FileText className="w-6 h-6 text-green-400" />
                        <h1 className="text-2xl font-bold">Termos de Uso</h1>
                    </div>
                    <p className="text-sm text-gray-400 mb-6">Última atualização: julho de 2026</p>

                    <div className="space-y-5 text-sm leading-relaxed text-gray-200">
                        <section>
                            <h2 className="text-lg font-semibold text-white mb-1">1. Aceitação dos termos</h2>
                            <p>
                                Ao criar uma conta ou utilizar o Zaldemy ("app", "serviço"), você concorda com estes
                                Termos de Uso e com a nossa Política de Privacidade. Se você não concordar com algum
                                ponto, não utilize o serviço.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-lg font-semibold text-white mb-1">2. O que é o Zaldemy</h2>
                            <p>
                                O Zaldemy é um aplicativo de aprendizado de idiomas que permite criar e treinar
                                categorias e frases, praticar com flashcards, digitação, treino guiado por IA e
                                acompanhar métricas de desempenho ao longo do tempo.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-lg font-semibold text-white mb-1">3. Cadastro e conta</h2>
                            <p>
                                Para usar a maior parte das funcionalidades é necessário criar uma conta com e-mail e
                                senha, ou entrar com sua conta Google. Você é responsável por manter suas credenciais
                                em sigilo e por todas as atividades realizadas na sua conta.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-lg font-semibold text-white mb-1">4. Uso aceitável</h2>
                            <p>Ao usar o Zaldemy, você concorda em não:</p>
                            <ul className="list-disc list-inside mt-1 space-y-1">
                                <li>Enviar conteúdo ilegal, ofensivo, discriminatório ou que viole direitos de terceiros;</li>
                                <li>Tentar acessar contas de outros usuários ou áreas restritas do sistema;</li>
                                <li>Utilizar robôs, scraping ou qualquer meio automatizado não autorizado para extrair dados do app;</li>
                                <li>Interferir no funcionamento normal do serviço ou de sua infraestrutura.</li>
                            </ul>
                        </section>

                        <section>
                            <h2 className="text-lg font-semibold text-white mb-1">5. Conteúdo criado por você</h2>
                            <p>
                                As categorias e frases que você cria continuam sendo suas. Ao marcar uma categoria
                                como pública/compartilhada, você autoriza que outros usuários do Zaldemy possam
                                visualizá-la e adicioná-la à própria conta. Nesse caso, o apelido que você cadastrou
                                fica visível para outros usuários como identificação de quem compartilhou o
                                conteúdo - seu nome completo e demais dados pessoais não são exibidos.
                                Reservamo-nos o direito de remover conteúdo que viole estes termos.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-lg font-semibold text-white mb-1">6. Planos gratuito e Zaldemy+</h2>
                            <p>
                                O Zaldemy oferece um plano gratuito com funcionalidades essenciais e um plano pago
                                (Zaldemy+) com recursos adicionais, como treino com IA. Preços e benefícios podem ser
                                alterados mediante aviso prévio dentro do app. O cancelamento de um plano pago segue
                                as regras informadas no momento da contratação.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-lg font-semibold text-white mb-1">7. Serviços de terceiros</h2>
                            <p>
                                O Zaldemy utiliza serviços de terceiros para funcionar corretamente: Google (login
                                social, tradução automática e voz padrão), OpenAI (voz natural premium, transcrição
                                de áudio e recursos de IA como perguntas, correções e sugestões), Groq (recurso
                                "Treino com IA"), Stripe (processamento de pagamento da assinatura Zaldemy+),
                                ip-api.com (identificação de país por IP no cadastro), além de YouTube e Open
                                Library (busca de vídeos e livros). O uso desses recursos está sujeito também aos
                                termos dos respectivos provedores. Podemos adicionar ou trocar fornecedores
                                conforme o app evolui.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-lg font-semibold text-white mb-1">8. Propriedade intelectual</h2>
                            <p>
                                A marca Zaldemy, o design do app, os ícones e o código-fonte são de propriedade da
                                Zaldemy ou de seus licenciadores, sendo protegidos por leis de propriedade
                                intelectual. Nenhuma disposição destes termos concede a você direitos sobre essas
                                propriedades além do uso pessoal do serviço.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-lg font-semibold text-white mb-1">9. Isenção de responsabilidade</h2>
                            <p>
                                O Zaldemy é fornecido "como está". Fazemos o possível para manter o serviço estável e
                                disponível, mas não garantimos que ele estará livre de interrupções, erros ou perda
                                de dados. Traduções, correções e conteúdos gerados automaticamente podem conter
                                imprecisões.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-lg font-semibold text-white mb-1">10. Encerramento de conta</h2>
                            <p>
                                Você pode encerrar sua conta a qualquer momento diretamente em Configurações &gt;
                                Excluir Conta. Podemos suspender ou encerrar contas que violem estes Termos de Uso.
                                Consideramos violações graves, sujeitas a suspensão ou encerramento imediato: envio
                                de conteúdo ilegal ou discriminatório, tentativa de acesso não autorizado a contas
                                de terceiros, uso de bots/scraping, e tentativas de fraude no plano pago. Violações
                                leves poderão receber aviso prévio antes de qualquer suspensão.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-lg font-semibold text-white mb-1">11. Alterações destes termos</h2>
                            <p>
                                Podemos atualizar estes Termos de Uso periodicamente. Mudanças relevantes serão
                                comunicadas dentro do app. O uso contínuo do Zaldemy após uma atualização representa
                                aceitação dos novos termos.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-lg font-semibold text-white mb-1">12. Contato</h2>
                            <p>
                                Dúvidas sobre estes termos podem ser enviadas pelos canais de contato disponíveis
                                dentro do app, em Configurações.
                            </p>
                        </section>
                    </div>
                </div>
            </div>
        </div>
    );
}

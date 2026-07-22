import { useNavigate } from "react-router-dom";
import { Shield } from "lucide-react";

// Conteúdo base da Política de Privacidade. Revisar com um advogado antes de publicar em produção.
export default function PoliticaPrivacidade() {
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
                        <Shield className="w-6 h-6 text-green-400" />
                        <h1 className="text-2xl font-bold">Política de Privacidade</h1>
                    </div>
                    <p className="text-sm text-gray-400 mb-6">Última atualização: julho de 2026</p>

                    <div className="space-y-5 text-sm leading-relaxed text-gray-200">
                        <section>
                            <p>
                                Esta Política de Privacidade explica quais dados o Zaldemy coleta, como usamos essas
                                informações e quais são os seus direitos, em conformidade com a Lei Geral de
                                Proteção de Dados (LGPD).
                            </p>
                        </section>

                        <section>
                            <h2 className="text-lg font-semibold text-white mb-1">1. Dados que coletamos</h2>
                            <ul className="list-disc list-inside space-y-1">
                                <li>Dados de cadastro: nome, e-mail e senha (armazenada de forma criptografada);</li>
                                <li>Dados de login social, quando você entra com sua conta Google (nome e e-mail);</li>
                                <li>Preferências de idioma nativo e idioma que você está aprendendo;</li>
                                <li>Conteúdo que você cria: categorias e frases cadastradas ou importadas;</li>
                                <li>Dados de uso e progresso: respostas de treino, taxa de acerto, sequência de dias
                                    de estudo (streak) e histórico de atividade no app;</li>
                                <li>Informações técnicas básicas de acesso, como token de sessão armazenado no
                                    dispositivo.</li>
                            </ul>
                        </section>

                        <section>
                            <h2 className="text-lg font-semibold text-white mb-1">2. Como usamos seus dados</h2>
                            <p>Utilizamos os dados coletados para:</p>
                            <ul className="list-disc list-inside mt-1 space-y-1">
                                <li>Criar e manter sua conta e autenticar seu acesso;</li>
                                <li>Personalizar seu aprendizado (idiomas, categorias, métricas de desempenho);</li>
                                <li>Gerar áudio das frases e sugerir traduções durante o treino;</li>
                                <li>Exibir seu progresso e estatísticas na tela de Métricas;</li>
                                <li>Enviar comunicações importantes sobre sua conta ou o serviço;</li>
                                <li>Melhorar a qualidade e a segurança do app.</li>
                            </ul>
                        </section>

                        <section>
                            <h2 className="text-lg font-semibold text-white mb-1">3. Compartilhamento com terceiros</h2>
                            <p>
                                Não vendemos seus dados pessoais. Compartilhamos apenas o necessário com fornecedores
                                que ajudam o Zaldemy a funcionar, entre eles:
                            </p>
                            <ul className="list-disc list-inside mt-1 space-y-1">
                                <li>Google, para autenticação via login social;</li>
                                <li>Serviço de síntese de voz, para gerar o áudio das frases praticadas;</li>
                                <li>Serviço de tradução automática, para sugestões de tradução;</li>
                                <li>YouTube e Open Library, para buscar vídeos e livros usados nas práticas de
                                    leitura e escuta (nesse caso, apenas o termo de busca é enviado, sem dados
                                    pessoais identificáveis).</li>
                            </ul>
                        </section>

                        <section>
                            <h2 className="text-lg font-semibold text-white mb-1">4. Compartilhamento entre usuários</h2>
                            <p>
                                Quando você marca uma categoria como pública/compartilhada, o seu nome de cadastro
                                fica visível para outros usuários do Zaldemy, como identificação de quem
                                disponibilizou aquele conteúdo. Nenhum outro dado pessoal (como e-mail ou senha) é
                                exibido nessa situação.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-lg font-semibold text-white mb-1">5. Armazenamento local e cookies</h2>
                            <p>
                                Guardamos um token de acesso no armazenamento local do seu navegador para manter
                                você conectado. O Zaldemy também funciona como um app instalável (PWA) e pode
                                armazenar arquivos em cache no seu dispositivo para permitir uso offline.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-lg font-semibold text-white mb-1">6. Segurança</h2>
                            <p>
                                Adotamos medidas técnicas razoáveis para proteger seus dados, como senhas
                                criptografadas e conexões seguras (HTTPS). Nenhum sistema é 100% livre de falhas,
                                por isso recomendamos o uso de senhas fortes e exclusivas.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-lg font-semibold text-white mb-1">7. Seus direitos</h2>
                            <p>Você pode, a qualquer momento:</p>
                            <ul className="list-disc list-inside mt-1 space-y-1">
                                <li>Solicitar acesso aos dados que temos sobre você;</li>
                                <li>Corrigir dados incompletos, desatualizados ou incorretos;</li>
                                <li>Solicitar a exclusão da sua conta e dos dados associados;</li>
                                <li>Retirar seu consentimento para o uso de dados, quando aplicável.</li>
                            </ul>
                            <p className="mt-1">
                                Para exercer esses direitos, entre em contato pelos canais disponíveis em
                                Configurações.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-lg font-semibold text-white mb-1">8. Retenção de dados</h2>
                            <p>
                                Mantemos seus dados enquanto sua conta estiver ativa ou enquanto for necessário para
                                cumprir obrigações legais. Ao excluir sua conta, seus dados pessoais são removidos ou
                                anonimizados, exceto quando a lei exigir sua conservação por período adicional.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-lg font-semibold text-white mb-1">9. Crianças e adolescentes</h2>
                            <p>
                                O Zaldemy não é direcionado a menores de 13 anos. Caso um responsável legal identifique
                                que uma criança menor de 13 anos criou uma conta sem autorização, entre em contato
                                para que os dados sejam removidos.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-lg font-semibold text-white mb-1">10. Alterações desta política</h2>
                            <p>
                                Podemos atualizar esta Política de Privacidade periodicamente. Mudanças relevantes
                                serão comunicadas dentro do app antes de entrarem em vigor.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-lg font-semibold text-white mb-1">11. Contato</h2>
                            <p>
                                Para dúvidas sobre esta política ou sobre seus dados, entre em contato pelos canais
                                disponíveis dentro do app, em Configurações.
                            </p>
                        </section>
                    </div>
                </div>
            </div>
        </div>
    );
}

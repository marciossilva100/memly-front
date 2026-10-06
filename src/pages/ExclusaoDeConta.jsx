import { useNavigate } from "react-router-dom";
import { Trash2 } from "lucide-react";

// Página pública de exclusão de conta - exigida pelo Google Play mesmo pra
// quem não tem mais o app instalado ou não consegue fazer login. Por isso
// fica fora da tela de Configurações (que exige sessão ativa).
export default function ExclusaoDeConta() {
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
                        <Trash2 className="w-6 h-6 text-red-400" />
                        <h1 className="text-2xl font-bold">Exclusão de conta - Zaldemy</h1>
                    </div>
                    <p className="text-sm text-gray-400 mb-6">Última atualização: outubro de 2026</p>

                    <div className="space-y-5 text-sm leading-relaxed text-gray-200">
                        <section>
                            <p>
                                Você pode solicitar a exclusão da sua conta no Zaldemy e dos dados associados a ela a
                                qualquer momento, pelos meios abaixo.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-lg font-semibold text-white mb-1">Como solicitar</h2>
                            <p className="mb-1"><strong>Pelo app ou pelo site</strong> (se ainda tiver acesso à conta):</p>
                            <ul className="list-disc list-inside space-y-1">
                                <li>Faça login normalmente;</li>
                                <li>Acesse Configurações;</li>
                                <li>Toque em "Excluir conta" e confirme.</li>
                            </ul>
                            <p className="mt-3">
                                <strong>Sem acesso à conta</strong> (esqueceu a senha, perdeu acesso ao e-mail etc.):
                                envie um e-mail para{" "}
                                <a href="mailto:adm@zaldemy.com" className="text-sky-400 underline">
                                    adm@zaldemy.com
                                </a>{" "}
                                a partir do endereço cadastrado na conta, pedindo a exclusão. Respondemos e processamos
                                o pedido em até 5 dias úteis.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-lg font-semibold text-white mb-1">O que acontece com os seus dados</h2>
                            <p className="mb-1">Ao confirmar a exclusão:</p>
                            <ul className="list-disc list-inside space-y-1">
                                <li>
                                    Seu acesso é revogado imediatamente e seus dados de identificação (nome, e-mail,
                                    senha) são anonimizados na hora - a conta para de existir do ponto de vista de
                                    login, mesmo antes da limpeza definitiva abaixo;
                                </li>
                                <li>
                                    Todos os seus dados pessoais são apagados permanentemente do nosso banco de dados
                                    em até 30 dias, incluindo: categorias e frases cadastradas, histórico e
                                    estatísticas de treino, respostas e gravações transcritas dos exercícios de IA
                                    (Perguntas, Frase do Dia, Tradução Reversa), recordes dos jogos, histórico de
                                    dúvidas com a IA e inscrições de notificação push;
                                </li>
                                <li>
                                    Registros financeiros de assinaturas já processadas são mantidos pelo nosso
                                    provedor de pagamento (Stripe) pelo prazo exigido por lei fiscal, mesmo após a
                                    exclusão da conta - não ficam acessíveis a partir do Zaldemy depois disso.
                                </li>
                            </ul>
                        </section>

                        <section>
                            <p className="text-gray-400">
                                Mais detalhes sobre os dados que coletamos e como os usamos estão na nossa{" "}
                                <span
                                    className="text-sky-400 underline cursor-pointer"
                                    onClick={() => navigate("/politicaprivacidade")}
                                >
                                    Política de Privacidade
                                </span>
                                .
                            </p>
                        </section>
                    </div>
                </div>
            </div>
        </div>
    );
}

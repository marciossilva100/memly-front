import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { QRCodeSVG } from "qrcode.react";
import { Lock, ShieldCheck, KeyRound, Loader2 } from "lucide-react";

// Login próprio do /dashboard-admin - independente da conta de usuário do
// app de propósito (ver model/DashboardAuth.php). Sem i18n (tela só pra
// admin, mesmo padrão já usado em DashboardAdmin.jsx).
export default function DashboardAdminLogin() {
    const navigate = useNavigate();
    const API_URL = import.meta.env.VITE_API_URL;

    const [etapa, setEtapa] = useState("credenciais"); // 'credenciais' | 'configurar_totp' | 'codigo'
    const [usuario, setUsuario] = useState("");
    const [senha, setSenha] = useState("");
    const [codigo, setCodigo] = useState("");
    const [token, setToken] = useState(null);
    const [totpSecret, setTotpSecret] = useState(null);
    const [totpUri, setTotpUri] = useState(null);
    const [erro, setErro] = useState("");
    const [carregando, setCarregando] = useState(false);

    async function enviarCredenciais(e) {
        e.preventDefault();
        setErro("");
        setCarregando(true);

        try {
            const res = await fetch(`${API_URL}/controller/dashboardAuth.php`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ action: "login", usuario, senha }),
            });
            const data = await res.json();

            if (!data.success) {
                setErro(data.message || "Não foi possível entrar.");
                return;
            }

            setToken(data.token);

            if (data.precisa_configurar_totp) {
                setTotpSecret(data.totp_secret);
                setTotpUri(data.totp_uri);
                setEtapa("configurar_totp");
            } else {
                setEtapa("codigo");
            }
        } catch {
            setErro("Erro de conexão.");
        } finally {
            setCarregando(false);
        }
    }

    async function confirmarCodigo(e) {
        e.preventDefault();
        setErro("");
        setCarregando(true);

        try {
            const res = await fetch(`${API_URL}/controller/dashboardAuth.php`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ action: "verificar_totp", token, codigo }),
            });
            const data = await res.json();

            if (!data.success) {
                setErro(data.message || "Código inválido.");
                return;
            }

            localStorage.setItem("dashboard_admin_token", token);
            navigate("/dashboard-admin", { replace: true });
        } catch {
            setErro("Erro de conexão.");
        } finally {
            setCarregando(false);
        }
    }

    return (
        <div className="h-dvh flex items-center justify-center from-gray-900 to-gray-800 bg-gradient-to-br px-6">
            <div className="w-full max-w-sm bg-gray-800/50 backdrop-blur-sm rounded-2xl border border-gray-700 p-6">
                <div className="flex flex-col items-center mb-6">
                    <div className="p-3 rounded-xl bg-gradient-to-br from-[#4cb8c4]/20 to-[#085078]/20 mb-3">
                        <Lock className="w-6 h-6 text-[#4cb8c4]" />
                    </div>
                    <h1 className="text-xl font-bold text-white">Acesso administrativo</h1>
                    <p className="text-gray-400 text-sm mt-1 text-center">Login separado da conta do app, com autenticação em duas etapas.</p>
                </div>

                {erro && (
                    <div className="mb-4 bg-red-500/10 border border-red-500/30 text-red-300 text-sm rounded-lg p-3">
                        {erro}
                    </div>
                )}

                {etapa === "credenciais" && (
                    <form onSubmit={enviarCredenciais} className="space-y-4">
                        <div>
                            <label className="block text-xs text-gray-400 mb-1">Usuário</label>
                            <input
                                type="text"
                                autoFocus
                                value={usuario}
                                onChange={(e) => setUsuario(e.target.value)}
                                className="w-full bg-gray-900 border border-gray-600 rounded-lg px-3 py-2 text-white text-sm"
                            />
                        </div>
                        <div>
                            <label className="block text-xs text-gray-400 mb-1">Senha</label>
                            <input
                                type="password"
                                value={senha}
                                onChange={(e) => setSenha(e.target.value)}
                                className="w-full bg-gray-900 border border-gray-600 rounded-lg px-3 py-2 text-white text-sm"
                            />
                        </div>
                        <button
                            type="submit"
                            disabled={carregando}
                            className="w-full flex items-center justify-center gap-2 bg-[#4cb8c4] hover:brightness-110 disabled:brightness-75 text-white text-sm font-medium px-4 py-2.5 rounded-lg"
                        >
                            {carregando ? <Loader2 className="w-4 h-4 animate-spin" /> : <ShieldCheck className="w-4 h-4" />}
                            Entrar
                        </button>
                    </form>
                )}

                {etapa === "configurar_totp" && (
                    <div className="space-y-4">
                        <p className="text-gray-300 text-sm">
                            Primeiro acesso: escaneie o QR code com o Google Authenticator (ou similar) e digite o código gerado.
                        </p>
                        <div className="flex justify-center bg-white rounded-xl p-3">
                            <QRCodeSVG value={totpUri} size={180} />
                        </div>
                        <p className="text-gray-500 text-xs text-center break-all">
                            Não conseguiu escanear? Digite manualmente: <span className="text-gray-300">{totpSecret}</span>
                        </p>
                        <form onSubmit={confirmarCodigo} className="space-y-3">
                            <input
                                type="text"
                                inputMode="numeric"
                                maxLength={6}
                                autoFocus
                                placeholder="000000"
                                value={codigo}
                                onChange={(e) => setCodigo(e.target.value.replace(/\D/g, ""))}
                                className="w-full bg-gray-900 border border-gray-600 rounded-lg px-3 py-2 text-white text-center text-lg tracking-widest"
                            />
                            <button
                                type="submit"
                                disabled={carregando || codigo.length !== 6}
                                className="w-full flex items-center justify-center gap-2 bg-[#4cb8c4] hover:brightness-110 disabled:brightness-75 text-white text-sm font-medium px-4 py-2.5 rounded-lg"
                            >
                                {carregando ? <Loader2 className="w-4 h-4 animate-spin" /> : <KeyRound className="w-4 h-4" />}
                                Confirmar e ativar
                            </button>
                        </form>
                    </div>
                )}

                {etapa === "codigo" && (
                    <form onSubmit={confirmarCodigo} className="space-y-4">
                        <p className="text-gray-300 text-sm">Digite o código do seu app autenticador.</p>
                        <input
                            type="text"
                            inputMode="numeric"
                            maxLength={6}
                            autoFocus
                            placeholder="000000"
                            value={codigo}
                            onChange={(e) => setCodigo(e.target.value.replace(/\D/g, ""))}
                            className="w-full bg-gray-900 border border-gray-600 rounded-lg px-3 py-2 text-white text-center text-lg tracking-widest"
                        />
                        <button
                            type="submit"
                            disabled={carregando || codigo.length !== 6}
                            className="w-full flex items-center justify-center gap-2 bg-[#4cb8c4] hover:brightness-110 disabled:brightness-75 text-white text-sm font-medium px-4 py-2.5 rounded-lg"
                        >
                            {carregando ? <Loader2 className="w-4 h-4 animate-spin" /> : <KeyRound className="w-4 h-4" />}
                            Entrar
                        </button>
                    </form>
                )}
            </div>
        </div>
    );
}

import imgChapeuFormatura from "../assets/img/chapeu_formatura.png";
import { useAuth } from "../context/AuthContext";

function AuthGate({ children }) {
    const { loading } = useAuth();

    if (loading) {
        return (
            <div className="flex h-screen items-center justify-center bg-white">
                <img
                    src={imgChapeuFormatura}
                    alt="Carregando"
                    className="w-28 animate-pulse"
                />
            </div>
        );
    }

    return children;
}

export default AuthGate;
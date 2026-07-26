import { useEffect } from "react";

// O app usa overflow:hidden no body globalmente (telas fixas de tela única,
// cada uma com sua própria rolagem interna). Para páginas realmente longas
// (como a landing page), liberamos a rolagem nativa do body enquanto a
// página estiver montada - mais simples e mais confiável entre navegadores
// do que simular rolagem com flexbox + overflow num container aninhado.
export default function useEnableBodyScroll() {
    useEffect(() => {
        const original = document.body.style.overflow;
        document.body.style.overflow = "auto";
        return () => {
            document.body.style.overflow = original;
        };
    }, []);
}

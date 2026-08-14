import { useTranslation } from "react-i18next";
import HintBalloon from "./HintBalloon";

// Dica contextual apontando pro botão "Ver palavras que já estudo",
// compartilhada entre Perguntas.jsx e treinoIA.jsx (mesma dica, mesmo botão,
// mesmo comportamento nas duas telas - um usuário que já viu numa não
// precisa ver de novo na outra).
export default function VocabularioHintBalloon() {
    const { t } = useTranslation();

    return (
        <HintBalloon storageKey="zaldemy_dica_vocabulario_exibida">
            {t("vocabulary_hint_balloon")}
        </HintBalloon>
    );
}

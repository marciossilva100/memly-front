import { Dialog } from "@headlessui/react";
import { useState, useEffect } from "react";
import { translateText } from "../services/translateText"
import { useAuth } from "../context/AuthContext";
import { Play, PlayCircle, PlaySquare, Repeat, Check, Crown, Bot } from "lucide-react";
import { playAudio } from "../utils/audioPlayer";
import { containsProfanity } from "../utils/contentFilter";
import { useTranslation } from "react-i18next";


export default function ModalPhrase({ openPhrase, setOpenPhrase, category, listPhrase, onOpenPremium, phraseToEdit }) {
    const { t } = useTranslation();
    const { user, setUser } = useAuth();

    const [loading, setLoading] = useState(false)
    const [phrase, setPhrase] = useState('')
    const [translatedPhrase, setTranslatedPhrase] = useState('')
    const [loadingSugestao, setLoadingSugestao] = useState(false)
    const [loadingMelhorar, setLoadingMelhorar] = useState(false)

    const [errorPhrase, setErrorPhrase] = useState('')
    const [errorTranslatedPhrase, setErrorTranslatedPhrase] = useState('')
    const API_URL = import.meta.env.VITE_API_URL;
    const isEditing = Boolean(phraseToEdit?.id);

    useEffect(() => {
        if (openPhrase) {
            setPhrase(phraseToEdit?.texto_nativo || '');
            setTranslatedPhrase(phraseToEdit?.texto_traduzido || '');
            setErrorPhrase('');
            setErrorTranslatedPhrase('');
        }
    }, [openPhrase, phraseToEdit]);

    async function handleSubmit(e) {
        e.preventDefault()

        if (loading) return;

        if (!phrase) {
            setErrorPhrase(t("enter_text_or_word"))
            return
        }

        if (!translatedPhrase) {
            setErrorTranslatedPhrase(t("enter_translation"))
            return
        }

        if (containsProfanity(phrase)) {
            setErrorPhrase(t("inappropriate_content_error"))
            return
        }

        if (containsProfanity(translatedPhrase)) {
            setErrorTranslatedPhrase(t("inappropriate_content_error"))
            return
        }

        setLoading(true);

        try {
            const res = await fetch(`${API_URL}/controller/frases.php`, {
                method: 'POST',
                headers: {
                    "Authorization": "Bearer " + localStorage.getItem("token")
                },
                body: JSON.stringify({
                    action: isEditing ? 'edit_phrase' : 'add_phrase',
                    ...(isEditing && { id_phrase: phraseToEdit.id }),
                    phrase: phrase,
                    translatedPhrase: translatedPhrase,
                    category_id: category
                })
            });

            const data = await res.json();

            if (!data.success) {
                setErrorTranslatedPhrase(data.message);
                return;
            }

            setTranslatedPhrase('')
            setPhrase('')
            listPhrase()
            setOpenPhrase(false)

            onSuccess?.();
            onOpenModalSucesso(isEditing ? t("edited_successfully") : t("added_successfully"))

        } catch (error) {
            console.log(error?.message || "Erro inesperado")
        } finally {
            setLoading(false)
        }
    }

    // Sugestão gratuita (Google Translate via LibreTranslate.php) - disponível
    // pra todos os planos, tradução literal/instantânea.
    async function sugerirTraducao(e) {
        e.preventDefault();

        if (loadingSugestao || loadingMelhorar) return;

        setLoadingSugestao(true);
        setErrorTranslatedPhrase('');

        try {
            const res = await fetch(`${API_URL}/controller/libreTranslate.php`, {
                method: 'POST',
                headers: {
                    "Authorization": "Bearer " + localStorage.getItem("token")
                },
                body: JSON.stringify({
                    phrase: phrase,
                    sourceLang: user.native_language,
                    targetLang: user.learning_language
                })
            });

            const data = await res.json();

            if (!data.success) {
                setErrorTranslatedPhrase(data.message);
                return;
            }

            setTranslatedPhrase(data.message)

        } catch (error) {
            setErrorTranslatedPhrase(error?.message || t("unexpected_error"))
        } finally {
            setLoadingSugestao(false);
        }
    }

    // Melhoria por IA (gpt-5-nano) - tradução natural/idiomática, não literal.
    // Recurso premium/limitado (amostra vitalícia) - free vê o cadeado com
    // coroa e abre o PremiumModal ao clicar.
    async function melhorarComIA(e) {
        e.preventDefault();

        if (loadingSugestao || loadingMelhorar) return;

        setLoadingMelhorar(true);
        setErrorTranslatedPhrase('');

        try {
            const res = await fetch(`${API_URL}/controller/traducaoIA.php`, {
                method: 'POST',
                headers: {
                    "Authorization": "Bearer " + localStorage.getItem("token")
                },
                body: JSON.stringify({
                    action: 'melhorar',
                    phrase: phrase,
                    sourceLang: user.native_language,
                    targetLang: user.learning_language
                })
            });

            const data = await res.json();

            if (!data.success) {
                if (data.limite_atingido || data.premium_necessario) {
                    onOpenPremium?.();
                    return;
                }
                setErrorTranslatedPhrase(data.message);
                return;
            }

            setTranslatedPhrase(data.traducao)

        } catch (error) {
            setErrorTranslatedPhrase(error?.message || t("unexpected_error"))
        } finally {
            setLoadingMelhorar(false);
        }
    }

    return (
        <Dialog
            open={openPhrase}
            onClose={setOpenPhrase}
            className="relative z-50"
        >
            {/* Overlay */}
            <div className="fixed inset-0 backdrop-blur-[2px]" />

            {/* Container */}
            <div className="fixed inset-0 flex items-center justify-center p-4">
                <Dialog.Panel className="w-full max-w-md rounded-2xl from-gray-900 to-gray-800 bg-gradient-to-br border border-white/30 p-6 shadow-xl">
                    {/* <Dialog.Title className="text-sm font-semibold mb-2 text-slate-700">
                        Palavra ou frase em inglês
                    </Dialog.Title> */}
                    <form action="" onSubmit={handleSubmit}>
                        <div>
                            <div className="">
                                <label className="font-medium text-sm mb-3 text-white">{t("word_or_phrase_pt")}</label>
                            </div>
                            <textarea
                                onChange={(e) => {
                                    setPhrase(e.target.value);
                                    setErrorPhrase('');
                                }}
                                value={phrase}
                                placeholder={t("example_phrase_placeholder")}
                                className="mt-1 w-full rounded-xl border border-slate-300 px-4 py-2 text-lg !bg-transparent
                                    text-white
                                    focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20
                                    outline-none"
                            ></textarea>
                            {errorPhrase &&
                                <span className="text-sm text-red-500">{errorPhrase}</span>
                            }
                        </div>
                        <div className="mt-4">

                            <div className="flex justify-between">
                                <label className="font-medium text-sm mb-3 text-white">{t("translation")}</label>
                                {translatedPhrase && (
                                    <PlayCircle className="text-[#4cb8c4]" onClick={()=>playAudio(translatedPhrase,user)} />
                                )}

                            </div>


                            <textarea
                                onChange={(e) => {
                                    setTranslatedPhrase(e.target.value);

                                    setErrorTranslatedPhrase('');
                                }}
                                value={translatedPhrase}
                                placeholder=""
                                className="w-full rounded-xl border border-slate-300 px-4 py-2 text-lg !bg-transparent
                                    text-white
                                    focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20
                                    outline-none"
                            ></textarea>

                            {phrase?.length > 1 && (
                                <div className="flex flex-wrap gap-2 mt-3">
                                    <button
                                        type="button"
                                        disabled={loadingSugestao || loadingMelhorar}
                                        className="flex items-center text-sm bg-gray-700/60 hover:bg-gray-700 disabled:opacity-50 text-white px-4 py-1.5 rounded-full transition-colors"
                                        onClick={sugerirTraducao}
                                    >
                                        {loadingSugestao ? t("suggesting_translation") : t("suggest_translation")}
                                    </button>

                                    <button
                                        type="button"
                                        disabled={loadingSugestao || loadingMelhorar}
                                        className="flex items-center gap-1.5 text-sm bg-gradient-to-r from-[#4cb8c4] to-[#085078] hover:from-[#3da5b0] hover:to-[#064060] disabled:opacity-50 text-white px-4 py-1.5 rounded-full transition-colors"
                                        onClick={melhorarComIA}
                                    >
                                        {user.plano !== 1 && (
                                            <Crown size={16} className="text-yellow-400" />
                                        )}
                                        {loadingMelhorar ? t("improving_translation") : t("improve_with_ai")}
                                    </button>
                                </div>
                            )}

                            {errorTranslatedPhrase &&
                                <span className="text-sm text-red-500">{errorTranslatedPhrase}</span>
                            }
                        </div>

                        <div className="mt-6 flex justify-end gap-2">
                            <button
                                onClick={() => {
                                    setOpenPhrase(false);
                                    setTranslatedPhrase('');
                                    setPhrase('');
                                }}
                                className="text-lg text-white me-3"
                            >
                                {t("cancel")}
                            </button>

                            <button type="submit" disabled={loading} className="bg-blue-400 text-white px-4 py-2 rounded-full text-lg ">
                                {t("save")}
                            </button>
                        </div>
                    </form>
                </Dialog.Panel>
            </div>
        </Dialog>

    )
}
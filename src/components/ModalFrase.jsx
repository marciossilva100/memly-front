import { Dialog } from "@headlessui/react";
import { useState, useEffect } from "react";
import { translateText } from "../services/translateText"
import { useAuth } from "../context/AuthContext";
import { Play, PlayCircle, PlaySquare, Repeat, Check, Crown, Bot, Loader2 } from "lucide-react";
import { playAudio } from "../utils/audioPlayer";
import { containsProfanity } from "../utils/contentFilter";
import { useTranslation } from "react-i18next";


export default function ModalPhrase({ openPhrase, setOpenPhrase, category, listPhrase, onOpenPremium, phraseToEdit }) {
    const { t } = useTranslation();
    const { user, setUser } = useAuth();

    const [loading, setLoading] = useState(false)
    const [phrase, setPhrase] = useState('')
    const [translatedPhrase, setTranslatedPhrase] = useState('')
    // Comentado (não removido) - ver explicação completa junto da função
    // sugerirTraducao() mais abaixo, sobre por que esse botão foi desativado.
    // const [loadingSugestao, setLoadingSugestao] = useState(false)
    const [loadingMelhorar, setLoadingMelhorar] = useState(false)
    // Indicador visual pro "Ouvir" - sem preload, o clique podia parecer
    // travado (nada acontece por 1-2s até o áudio terminar de gerar).
    const [buscandoAudio, setBuscandoAudio] = useState(false)

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

    // Os dois botões (sugerir/melhorar) funcionam nos dois sentidos - se o
    // campo de cima (nativo) estiver vazio e o de baixo (tradução) tiver
    // conteúdo, traduz de baixo pra cima em vez do sentido padrão. Sempre
    // preenche o campo que está vazio a partir do que já foi digitado no
    // outro, nunca sobrescreve os dois já preenchidos.
    function direcaoTraducao() {
        const modoReverso = !phrase && !!translatedPhrase;
        return {
            modoReverso,
            textoOrigem: modoReverso ? translatedPhrase : phrase,
            sourceLang: modoReverso ? user.learning_language : user.native_language,
            targetLang: modoReverso ? user.native_language : user.learning_language,
        };
    }

    // Sugestão gratuita (Google Translate via LibreTranslate.php) - DESATIVADA
    // (comentada, não removida) porque o Google passou a bloquear de forma
    // persistente o endpoint não-oficial que o LibreTranslate.php usa
    // (translate.googleapis.com/translate_a/single) com HTTP 429 "automated
    // queries" - reproduzido direto contra o endpoint, não é falha pontual
    // nem bug do nosso código. Só "Melhorar com IA" (OpenAI) ficou ativo.
    // Se um dia trocar de provedor de tradução literal, é só reativar isso e
    // devolver o botão no JSX abaixo (e as chaves de i18n suggest_translation/
    // suggesting_translation, que continuam nas 15 pastas de idioma).
    //
    // async function sugerirTraducao(e) {
    //     e.preventDefault();
    //
    //     if (loadingSugestao || loadingMelhorar) return;
    //
    //     const { modoReverso, textoOrigem, sourceLang, targetLang } = direcaoTraducao();
    //     if (!textoOrigem) return;
    //
    //     setLoadingSugestao(true);
    //     setErrorTranslatedPhrase('');
    //     setErrorPhrase('');
    //
    //     try {
    //         const res = await fetch(`${API_URL}/controller/libreTranslate.php`, {
    //             method: 'POST',
    //             headers: {
    //                 "Authorization": "Bearer " + localStorage.getItem("token")
    //             },
    //             body: JSON.stringify({
    //                 phrase: textoOrigem,
    //                 sourceLang,
    //                 targetLang
    //             })
    //         });
    //
    //         const data = await res.json();
    //
    //         // Nunca exibir data.message direto - controller/libreTranslate.php
    //         // é um endpoint de terceiro (Google Translate via LibreTranslate.php)
    //         // e um erro cru do PHP já vazou pra tela assim antes (reportado
    //         // pelo usuário: "LibreTranslate::translateText(): Return value
    //         // must be of type array, null returned"). O backend agora manda
    //         // um "code" em vez de mensagem pronta - escolhe a chave i18n aqui.
    //         if (!data.success) {
    //             modoReverso ? setErrorPhrase(t("server_connection_error")) : setErrorTranslatedPhrase(t("server_connection_error"));
    //             return;
    //         }
    //
    //         modoReverso ? setPhrase(data.message) : setTranslatedPhrase(data.message);
    //
    //     } catch {
    //         modoReverso ? setErrorPhrase(t("unexpected_error")) : setErrorTranslatedPhrase(t("unexpected_error"));
    //     } finally {
    //         setLoadingSugestao(false);
    //     }
    // }

    // Melhoria por IA (gpt-5-nano) - tradução natural/idiomática, não literal.
    // Recurso premium/limitado (amostra vitalícia) - free vê o cadeado com
    // coroa e abre o PremiumModal ao clicar.
    async function melhorarComIA(e) {
        e.preventDefault();

        if (loadingMelhorar) return;

        const { modoReverso, textoOrigem, sourceLang, targetLang } = direcaoTraducao();
        if (!textoOrigem) return;

        setLoadingMelhorar(true);
        setErrorTranslatedPhrase('');
        setErrorPhrase('');

        try {
            const res = await fetch(`${API_URL}/controller/traducaoIA.php`, {
                method: 'POST',
                headers: {
                    "Authorization": "Bearer " + localStorage.getItem("token")
                },
                body: JSON.stringify({
                    action: 'melhorar',
                    phrase: textoOrigem,
                    sourceLang,
                    targetLang
                })
            });

            const data = await res.json();

            if (!data.success) {
                if (data.limite_atingido || data.premium_necessario) {
                    onOpenPremium?.();
                    return;
                }
                modoReverso ? setErrorPhrase(data.message) : setErrorTranslatedPhrase(data.message);
                return;
            }

            modoReverso ? setPhrase(data.traducao) : setTranslatedPhrase(data.traducao);

        } catch (error) {
            const mensagem = error?.message || t("unexpected_error");
            modoReverso ? setErrorPhrase(mensagem) : setErrorTranslatedPhrase(mensagem);
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
                                <label className="font-medium text-sm mb-3 text-white">
                                    {user?.native_language_name
                                        ? t("word_or_phrase_in", { idioma: user.native_language_name })
                                        : t("word_or_phrase_pt")}
                                </label>
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
                                    buscandoAudio ? (
                                        <Loader2 className="text-[#4cb8c4] animate-spin" />
                                    ) : (
                                        <PlayCircle className="text-[#4cb8c4] cursor-pointer" onClick={() => {
                                            setBuscandoAudio(true);
                                            playAudio(translatedPhrase, user, false, null, false, false, () => setBuscandoAudio(false))
                                                .finally(() => setBuscandoAudio(false));
                                        }} />
                                    )
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

                            {(phrase?.length > 1 || translatedPhrase?.length > 1) && (
                                <div className="flex flex-wrap gap-2 mt-3">
                                    {/* Botão "Sugerir tradução" desativado - ver comentário
                                        completo junto de sugerirTraducao() acima.
                                    <button
                                        type="button"
                                        disabled={loadingSugestao || loadingMelhorar}
                                        className="flex items-center text-sm bg-gray-700/60 hover:bg-gray-700 disabled:opacity-50 text-white px-4 py-1.5 rounded-full transition-colors"
                                        onClick={sugerirTraducao}
                                    >
                                        {loadingSugestao ? t("suggesting_translation") : t("suggest_translation")}
                                    </button>
                                    */}

                                    <button
                                        type="button"
                                        disabled={loadingMelhorar}
                                        className="flex items-center gap-1.5 text-sm bg-gradient-to-r from-[#4cb8c4] to-[#085078] hover:from-[#3da5b0] hover:to-[#064060] disabled:opacity-50 text-white px-4 py-1.5 rounded-full transition-colors"
                                        onClick={melhorarComIA}
                                    >
                                        {user.plano === 2 && (
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
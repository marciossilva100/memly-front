import { Dialog } from "@headlessui/react";
import { useState, useEffect } from "react";
import { translateText } from "../services/translateText"
import { useAuth } from "../context/AuthContext";


export default function ModalPhrase({ openPhrase, setOpenPhrase, category, listPhrase }) {
    const { user, setUser } = useAuth();

    const [loading, setLoading] = useState(false)
    const [phrase, setPhrase] = useState('')
    const [translatedPhrase, setTranslatedPhrase] = useState('')

    const [errorPhrase, setErrorPhrase] = useState('')
    const [errorTranslatedPhrase, setErrorTranslatedPhrase] = useState('')
    const [error, setError] = useState('')

    async function handleSubmit(e) {
        e.preventDefault()

        if (loading) return;

        if (!phrase) {
            setErrorPhrase('Digite o texto ou palavra')
            return
        }

        if (!translatedPhrase) {
            setErrorTranslatedPhrase('Digite a tradução')
            return
        }

        setLoading(true);

        try {
            const res = await fetch('https://zaldemy.com/controller/frases.php', {
                method: 'POST',
                credentials: "include",
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    action: 'add_phrase',
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
            onOpenModalSucesso('Adicionado com sucesso')

        } catch (error) {
            console.log(error?.message || "Erro inesperado")
        } finally {
            setLoading(false)
        }
    }


    async function translationSuggested(e) {

        e.preventDefault();

        const res = await fetch('https://zaldemy.com/controller/libreTranslate.php', {
            method: 'POST',
            credentials: "include",
            headers: {
                'Content-Type': 'application/json'
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
        
    }

    if (error) {
        console.log(error)
    }

    return (
        <Dialog
            open={openPhrase}
            onClose={setOpenPhrase}
            className="relative z-50"
        >
            {/* Overlay */}
            <div className="fixed inset-0 bg-black/40" />

            {/* Container */}
            <div className="fixed inset-0 flex items-center justify-center p-4">
                <Dialog.Panel className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
                    {/* <Dialog.Title className="text-sm font-semibold mb-2 text-slate-700">
                        Palavra ou frase em inglês
                    </Dialog.Title> */}
                    <form action="" onSubmit={handleSubmit}>
                        <div>
                            <label className="font-medium text-sm mb-3 text-slate-800">Palavra ou frase em inglês</label>
                            <textarea
                                onChange={(e) => {
                                    setPhrase(e.target.value);
                                    setErrorPhrase('');
                                }}
                                value={phrase}
                                placeholder="I will travel tomorrow"
                                className="mt-1 w-full rounded-xl border border-slate-300 px-4 py-2 text-sm
                                    focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20
                                    outline-none"
                            ></textarea>
                            {errorPhrase &&
                                <span className="text-sm text-red-500">{errorPhrase}</span>
                            }
                        </div>
                        <div className="mt-4">
                            <label className="font-medium text-sm mb-3 text-slate-800">Tradução</label>

                            <textarea
                                onChange={(e) => {
                                    setTranslatedPhrase(e.target.value);

                                    setErrorTranslatedPhrase('');
                                }}
                                value={translatedPhrase}
                                placeholder=""
                                className="w-full rounded-xl border border-slate-300 px-4 py-2 text-sm
                                    focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20
                                    outline-none"
                            ></textarea>

                            {phrase?.length > 1 && (
                                <div>
                                    <button type="button" className="text-xs bg-avocado-500 text-white px-4 py-1 rounded-full" onClick={translationSuggested}>
                                        Sugerir tradução
                                    </button>
                                </div>
                            )}

                            {errorTranslatedPhrase &&
                                <span className="text-sm text-red-500">{errorTranslatedPhrase}</span>
                            }
                        </div>

                        <div className="mt-6 flex justify-end gap-2">
                            <button
                                onClick={() =>{
                                    setOpenPhrase(false);
                                    setTranslatedPhrase('');
                                    setPhrase('');
                                } }
                                className="text-sm text-slate-600"
                            >
                                Cancelar
                            </button>

                            <button type="submit" disabled={loading} className="bg-blue-600 text-white px-4 py-2 rounded-full text-sm ">
                                Salvar
                            </button>
                        </div>
                    </form>
                </Dialog.Panel>
            </div>
        </Dialog>
    )
}
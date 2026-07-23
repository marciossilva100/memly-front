import { Dialog } from "@headlessui/react";
import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";

import { HelpCircle, List, FolderPlus, ChevronRight } from 'lucide-react';
import { containsProfanity } from '../utils/contentFilter';
export default function ModalCategorias({ setOpen, open, onOpenModalSucesso, onSuccess,setOpenModalSucesso }) {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const [categoria, setCategoria] = useState()
    const [error, setError] = useState('')
    const [loading, setLoading] = useState(false)
    const [yourCategory, setYourCategory] = useState(false)
    const [categoriaPublica, setCategoriaPublica] = useState(1)
    const API_URL = import.meta.env.VITE_API_URL;

    useEffect(() => {
        setYourCategory(false)
        if (open) {
            setError('');
        }
    }, [open]);

    function onChange(checked) {
        setCategoriaPublica(checked ? 1 : 0)
    }

    const handleSubmit = async (e) => {
        e.preventDefault()

        if (loading) return;

        if (!categoria) {
            setError(t("enter_category"))
            return
        }

        if (containsProfanity(categoria)) {
            setError(t("inappropriate_content_error"))
            return
        }

        setLoading(true);

        try {
            const res = await fetch(`${API_URL}/controller/categorias.php`, {
                method: 'POST',
                headers: {
                    "Authorization": "Bearer " + localStorage.getItem("token")
                },
                body: JSON.stringify({
                    action: 'adicionar_categoria',
                    categoria: categoria,
                    categoria_publica: categoriaPublica
                })
            });

            const data = await res.json();

            if (!data.success) {
                setError(data.message);
                return;
            }

            setError('')
            onSuccess?.();
            onOpenModalSucesso(t("added_successfully"))
            setTimeout(() => {
                setOpenModalSucesso(false);
            }, 2500); // 3 segundos

        } catch (error) {
            setError(error?.message || t("unexpected_error"))
        } finally {
            setLoading(false)
        }
    }
    function ToggleItem({ label, helpText, defaultChecked = true }) {
        const [showTooltip, setShowTooltip] = useState(false);

        return (
            <div className="flex items-center mt-4 ">
                <label className="relative inline-flex items-center cursor-pointer me-2 ">
                    <input type="checkbox" className="sr-only peer " defaultChecked={defaultChecked} onChange={(e) => onChange(e.target.checked)} />
                    <div className="w-10 h-5 bg-gray-200 rounded-full peer peer-checked:bg-[#4cb8c4] peer-checked:after:translate-x-5 after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all"></div>
                </label>
                <div className="flex items-center gap-2 flex-1 ">
                    <span className="text-md font-medium text-white">{label}</span>
                    <div className="relative">
                        <button
                            type="button"
                            onClick={() => setShowTooltip(!showTooltip)}
                            className="focus:outline-none mt-1"
                        >
                            <HelpCircle size={16} className="text-gray-400 hover:text-blue-500 transition-colors cursor-pointer" />
                        </button>

                        {showTooltip && (
                            <>
                                <div
                                    className="fixed inset-0 z-40"
                                    onClick={() => setShowTooltip(false)}
                                />
                                <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 px-3 py-2 bg-gray-800 text-white text-xs rounded-lg z-50 max-w-[200px] w-max">
                                    <p className="break-words">{helpText}</p>
                                    <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-gray-800"></div>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            </div>
        );
    }

    return (
        <Dialog
            open={open}
            onClose={setOpen}
            className="relative z-50"
        >
            {/* Overlay */}
            <div className="fixed inset-0 bg-black/40" />

            {/* Container */}
            <div className="fixed inset-0 flex items-center justify-center px-4 backdrop-blur-[2px]">
                <Dialog.Panel className="w-full max-w-md rounded-2xl px-6 py-8 shadow-xl from-gray-900 to-gray-800 bg-gradient-to-br">
                    <Dialog.Title className="text-xl font-semibold mb-3 text-white  mb-8">
                        {t("add_category")}
                    </Dialog.Title>
                    {!yourCategory && (
                        <div className="flex flex-col gap-3 mt-5">
                            <button
                                type="button"
                                onClick={() => {
                                    setOpen(false);
                                    navigate('/listcategorias');
                                }}
                                className="group flex items-center gap-3 text-left py-3 px-4 bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-xl w-full text-white hover:bg-gray-700/60 hover:border-gray-600 transition"
                            >
                                <div className="flex items-center justify-center w-11 h-11 shrink-0 rounded-full bg-blue-500">
                                    <List size={20} className="text-white" />
                                </div>
                                <span className="flex-1 text-lg font-medium">{t("existing_categories")}</span>
                                <ChevronRight size={20} className="text-gray-500 group-hover:text-gray-300 transition shrink-0" />
                            </button>

                            <button
                                type="button"
                                className="group flex items-center gap-3 text-left py-3 px-4 bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-xl w-full text-white hover:bg-gray-700/60 hover:border-gray-600 transition"
                                onClick={() => {
                                    setYourCategory(true);
                                }}
                            >
                                <div className="flex items-center justify-center w-11 h-11 shrink-0 rounded-full bg-emerald-500">
                                    <FolderPlus size={20} className="text-white" />
                                </div>
                                <span className="flex-1 text-lg font-medium">{t("add_your_category")}</span>
                                <ChevronRight size={20} className="text-gray-500 group-hover:text-gray-300 transition shrink-0" />
                            </button>
                        </div>
                    )}

                    {yourCategory && (
                        <form action="" onSubmit={handleSubmit}>
                            <div>
                                <input
                                    onChange={(e) => setCategoria(e.target.value)}
                                    type="text"
                                    placeholder={t("category_name_placeholder")}
                                    className="text-white bg-gray-800/50 backdrop-blur-sm w-full rounded-xl border border-slate-300 px-4 py-2 text-lg
                                    focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20
                                    outline-none"
                                />
                                {error &&
                                    <span className="text-sm text-red-500">{error}</span>
                                }
                                <div className="space-y-3">

                                    <ToggleItem
                                        label={t("share_category")}
                                        helpText={t("share_category_description")}
                                    />
                                </div>
                            </div>

                            <div className="mt-6 flex justify-end gap-2">
                                <button
                                    onClick={() => setOpen(false)}
                                    className="text-lg text-white me-3"
                                >
                                    {t("cancel")}
                                </button>

                                <button type="submit" disabled={loading} className="bg-[#4cb8c4] text-white px-4 py-2 rounded-full text-lg ">
                                    {t("save")}
                                </button>
                            </div>
                        </form>
                    )}
                </Dialog.Panel>
            </div>
        </Dialog>
    )
}
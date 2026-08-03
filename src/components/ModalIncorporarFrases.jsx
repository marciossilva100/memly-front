import { Dialog } from "@headlessui/react";
import { useState, useEffect } from "react";
import { FaList, FaPlus } from "react-icons/fa";
import { useTranslation } from "react-i18next";

export default function ModalIncorporarFrases({openIncorporar,setOpenIncorporar,onOpenPremium}) {
    const { t } = useTranslation();
    const [categoria, setCategoria] = useState()
    const [error, setError] = useState('')
    const [loading, setLoading] = useState(false)
    const [yourCategory, setYourCategory] = useState(false)
    const API_URL = import.meta.env.VITE_API_URL;

    useEffect(() => {
        if (open) {
            setError('');
        }
    }, [open]);

    const handleSubmit = async (e) => {
        e.preventDefault()

        if (loading) return;


        setLoading(true);

        try {
            const res = await fetch(`${API_URL}/controller/categorias.php`, {
                method: 'POST',
                headers: {
                    "Authorization": "Bearer " + localStorage.getItem("token")
                },
                body: JSON.stringify({
                    action: 'adicionar_categoria',
                    categoria: categoria
                })
            });

            const data = await res.json();

            if (!data.success) {
                if (data.limite_atingido) {
                    onOpenPremium?.();
                    return;
                }
                setError(data.message);
                return;
            }

            setError('')
            onSuccess?.();
            onOpenModalSucesso(t("added_successfully"))

        } catch (error) {
            setError(error?.message || t("unexpected_error"))
        } finally {
            setLoading(false)
        }
    }

    return (
        <Dialog
           open={openIncorporar}
            onClose={() => setOpenIncorporar(false)}
            className="relative z-50"
        >
            {/* Overlay */}
            <div className="fixed inset-0 bg-black/40" />

            {/* Container */}
            <div className="fixed inset-0 flex items-center justify-center px-4 ">
                <Dialog.Panel className="w-full max-w-md rounded-2xl  px-6 py-8 shadow-xl from-gray-900 to-gray-800 bg-gradient-to-br border border-white/30">
                    <Dialog.Title className="text-xl font-semibold mb-3 text-white ">
                        {t("category_exists_incorporate")}
                    </Dialog.Title>
      

                    
                        <form action="" onSubmit={handleSubmit} className="">
                            <div>
                             
                                {error &&
                                    <span className="text-sm text-red-500">{error}</span>
                                }
                            </div>

                            <div className="mt-8 flex justify-center gap-2 w-full">
                                <button
                                    onClick={() => setOpenIncorporar(false)}
                                    className="text-lg text-slate-600 me-3 w-full"
                                >
                                    {t("cancel")}
                                </button>

                                <button type="submit" disabled={loading} className="w-full bg-[#4cb8c4] text-white px-4 py-2 rounded-full text-lg ">
                                    {t("incorporate")}
                                </button>
                            </div>
                        </form>
                    
                </Dialog.Panel>
            </div>
        </Dialog>
    )
}
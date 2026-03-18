import { Dialog } from "@headlessui/react";
import { useState, useEffect } from "react";
import { FaList, FaPlus } from "react-icons/fa";

export default function ModalIncorporarFrases({openIncorporar,setOpenIncorporar}) {
    const [categoria, setCategoria] = useState()
    const [error, setError] = useState('')
    const [loading, setLoading] = useState(false)
    const [yourCategory, setYourCategory] = useState(false)
    

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
            const res = await fetch('https://zaldemy.com/controller/categorias.php', {
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
                setError(data.message);
                return;
            }

            setError('')
            onSuccess?.();
            onOpenModalSucesso('Adicionado com sucesso')

        } catch (error) {
            setError(error?.message || "Erro inesperado")
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
                <Dialog.Panel className="w-full max-w-md rounded-2xl bg-white px-6 py-8 shadow-xl">
                    <Dialog.Title className="text-xl font-semibold mb-3 text-slate-700 ">
                        Categoria já existe na sua lista. Deseja incorporar as frases para sua categoria existente?
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
                                    Cancelar
                                </button>

                                <button type="submit" disabled={loading} className="w-full bg-[#4cb8c4] text-white px-4 py-2 rounded-full text-lg ">
                                    Incorporar
                                </button>
                            </div>
                        </form>
                    
                </Dialog.Panel>
            </div>
        </Dialog>
    )
}
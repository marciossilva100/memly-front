import { Dialog } from "@headlessui/react";
import { useState, useEffect } from "react";
import { FaList, FaPlus } from "react-icons/fa";

export default function ModalCategoriasEditar({ setOpenCategoriaEditar,open,categoriaEditar,categoriaIdEditar,onOpenModalSucesso,onSuccess}) {
    const [categoria, setCategoria] = useState()
    const [error, setError] = useState('')
    const [loading, setLoading] = useState(false)
    const [yourCategory, setYourCategory] = useState(false)
const API_URL = import.meta.env.VITE_API_URL;
    useEffect(() => {
        setCategoria(categoriaEditar)
        setYourCategory(false)
        if (open) {
            setError('');
        }
    }, [open]);

    const handleSubmit = async (e) => {
        e.preventDefault()

        if (loading) return;

        if (!categoria) {
            setError('Digite a categoria')
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
                    action: 'editar_categoria',
                    categoria_id: categoriaIdEditar,
                    categoria: categoria,

                })
            });

            const data = await res.json();

            if (!data.success) {
                setError(data.message);
                return;
            }

            setError('')
            //onSuccess?.();
            onOpenModalSucesso('Editado com sucesso')
            onSuccess();

        } catch (error) {
            setError(error?.message || "Erro inesperado")
        } finally {
            setLoading(false)
        }
    }

    return (
        <Dialog
            open={open}
            onClose={setOpenCategoriaEditar}
            className="relative z-50"
        >
            {/* Overlay */}
            <div className="fixed inset-0 bg-black/40" />

            {/* Container */}
            <div className="fixed inset-0 flex items-center justify-center px-4 backdrop-blur-[2px]">
                <Dialog.Panel className="w-full max-w-md rounded-2xl px-6 py-8 shadow-xl from-gray-900 to-gray-800 bg-gradient-to-br border border-white/30">
                    <Dialog.Title className="text-xl font-semibold mb-6 text-white">
                        Editar categoria
                    </Dialog.Title>
                    
                        <form action="" onSubmit={handleSubmit}>
                            <div>
                                <input
                                    onChange={(e) => setCategoria(e.target.value)}
                                    type="text"
                                    placeholder="Nome da categoria"
                                    className="bg-gray-800/50 backdrop-blur-sm w-full rounded-xl border border-slate-300 px-4 py-2 text-lg
                                    focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20
                                    outline-none text-white"
                                    value={categoria}
                                />
                                {error && 
                                    <span className="text-sm text-red-500">{error}</span>
                                }
                            </div>

                            <div className="mt-6 flex justify-end gap-2">
                                <button
                                    onClick={() => setOpenCategoriaEditar(false)}
                                    className="text-lg text-white me-3 w-full bg-gray-800/50 backdrop-blur-sm  border border-gray-700 rounded-full"
                                >
                                    Cancelar
                                </button>

                                <button type="submit" disabled={loading} className="bg-[#4cb8c4] text-white py-2 rounded-full text-lg w-full">
                                    Salvar
                                </button>
                            </div>
                        </form>
                  
                </Dialog.Panel>
            </div>
        </Dialog>
    )
}
import { Dialog } from "@headlessui/react";
import { useState, useEffect } from "react";
import { FaList, FaPlus } from "react-icons/fa";

export default function ModalConfirm({openModalConfirm,setOpenModalConfirm,msg,onConfirm}) {
    const [categoria, setCategoria] = useState()
    const [error, setError] = useState('')
    const [loading, setLoading] = useState(false)
    const [yourCategory, setYourCategory] = useState(false)
    

    useEffect(() => {
        if (open) {
            setError('');
        }
    }, [open]);


    return (
        <Dialog
           open={openModalConfirm}
            onClose={() => setOpenModalConfirm(false)}
            className="relative z-50"
        >
            {/* Overlay */}
            <div className="fixed inset-0 backdrop-blur-[2px]" />

            {/* Container */}
            <div className="fixed inset-0 flex items-center justify-center px-4 ">
                <Dialog.Panel className="w-full max-w-md rounded-2xl from-gray-900 to-gray-800 bg-gradient-to-br border border-white/30 px-6 py-8 shadow-xl">
                    <Dialog.Title className="text-xl font-semibold mb-3 text-white ">
                        {msg}
                    </Dialog.Title>
      

                       
                            <div>
                             
                                {error &&
                                    <span className="text-sm text-red-500">{error}</span>
                                }
                            </div>

                            <div className="mt-8 flex justify-center gap-2 w-full">
                                <button
                                    onClick={() => setOpenModalConfirm(false)}
                                    className="text-lg text-white me-3 w-full bg-gray-800/50 backdrop-blur-sm  border border-gray-700 rounded-full"
                                >
                                    Cancelar
                                </button>

                                <button onClick={()=>onConfirm(true)}  type="submit" disabled={loading} className="w-full bg-[#4cb8c4] text-white px-4 py-2 rounded-full text-lg ">
                                    Confirmar
                                </button>
                            </div>
                        
                    
                </Dialog.Panel>
            </div>
        </Dialog>
    )
}
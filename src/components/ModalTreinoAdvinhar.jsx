import { Dialog } from "@headlessui/react";
import { useNavigate } from "react-router-dom";

import {
    Shuffle,
    Eye,
    Check,
    History,
    Type
} from "lucide-react";

export default function ModalTreinoAdvinhar({ setOpenTreinoAdvinhar, openTreinoAdvinhar, categoriaId }) {
    const navigate = useNavigate();

    return (
        <Dialog
            open={openTreinoAdvinhar}
            onClose={setOpenTreinoAdvinhar}
            className="relative z-50"
        >
            {/* Overlay */}
            <div className="fixed inset-0 bg-black/40" />

            {/* Container */}
            <div className="fixed inset-0 flex items-center justify-center p-2">
                <Dialog.Panel className="w-60 max-w-xl rounded-2xl bg-white p-6 shadow-xl ">

                    <div className="flex  gap-2 items-center space-x-15 mb-4">
                        <div className="flex justify-center items-center me-3">
                            <Eye size={25} className="text-blue-400" />

                        </div>
                        <div className="flex flex-col">
                            <span className="text-base ">Advinhar</span>
                        </div>
                    </div>
                    <div className="flex  gap-2 items-center space-x-15 mb-4">
                        <div className="flex justify-center items-center me-3">
                            <Shuffle size={25} className="text-blue-400" />
                        </div>
                        <div className="flex flex-col cursor-pointer" onClick={() => {
                            if (!categoriaId) return;
                            setOpenTreinoAdvinhar(false);
                            navigate(`/emparelhar/${categoriaId}`);
                        }}> 
                            <span className="text-base ">Emparelhar</span>
                        </div>
                    </div>
                    <div className="flex  gap-2 items-center space-x-15 mb-4">
                        <div className="flex justify-center items-center me-3">
                            <History size={25} className="text-blue-400" />
                        </div>
                        <div className="flex flex-col" onClick={() => {
                            if (!categoriaId) return;
                            setOpenTreinoAdvinhar(false);
                            navigate(`/flashcards/${categoriaId}/traine`);
                        }}>
                            <span className="text-base leading-tight">Relembrar</span>
                        </div>
                    </div>
                    <div className="flex  gap-2 items-center space-x-15">
                        <div className="flex justify-center items-center me-3">
                            <Type size={25} className="text-blue-400" />
                        </div>
                        <div className="flex flex-col ">
                            <span className="text-base leading-tight  flex">Digitar</span>
                        </div>
                    </div>


                </Dialog.Panel>
            </div>
        </Dialog>


    )
}
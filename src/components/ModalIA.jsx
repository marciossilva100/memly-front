import { Dialog } from "@headlessui/react";
import { useNavigate } from "react-router-dom";

import {
    Shuffle,
    Eye,
    Check,
    History,
    BrainCircuit,
    HelpCircle,
    FileQuestion,
    Type
} from "lucide-react";

export default function ModalIA({ setOpenTreinoIA, openTreinoIA}) {
    const navigate = useNavigate();

    return (
        <Dialog
            open={openTreinoIA}
            onClose={setOpenTreinoIA}
            className="relative z-50"
        >
            {/* Overlay */}
            <div className="fixed inset-0 bg-black/40" />

            {/* Container */}
            <div className="fixed inset-0 flex items-center justify-center p-2">
                <Dialog.Panel className="w-50 max-w-xl rounded-2xl from-gray-900 to-gray-800 bg-gradient-to-br border border-white/30 p-6 shadow-xl ">

                    <div className="flex  gap-2 items-center space-x-15 mb-4" onClick={() => {
                            setOpenTreinoIA(false);
                            navigate(`/treinoia`);
                        }}> 
                        <div className="flex justify-center items-center me-3">
                            <Type size={32} className="text-blue-400" />
                        </div>
                        <div className="flex flex-col">
                            <span className="text-lg text-white">Treino com texto</span>
                        </div>
                    </div>
                      
                    <div className="flex  gap-2 items-center space-x-15" onClick={() => {
                            setOpenTreinoIA(false);
                            navigate(`/perguntasia`);
                        }}>
                        <div className="flex justify-center items-center me-3">
                            <FileQuestion size={32} className="text-green-400" />
                        </div>
                        <div className="flex flex-col ">
                            <span className="text-lg leading-tight  flex text-white">Treino com perguntas</span>
                        </div>
                    </div>

                </Dialog.Panel>
            </div>
        </Dialog>


    )
}
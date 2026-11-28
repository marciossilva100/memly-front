import { Dialog } from "@headlessui/react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";

import {
    Shuffle,
    Eye,
    Check,
    History,
    Type
} from "lucide-react";

// categoriaIds: array (mesmo padrão de ModaTreino.jsx - 1 ou várias
// categorias, sempre o mesmo código, só muda a string que viaja nas rotas).
export default function ModalTreinoAdvinhar({ setOpenTreinoAdvinhar, openTreinoAdvinhar, categoriaIds }) {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const categoriaIdsStr = (categoriaIds || []).join(',');

    return (
        <Dialog
            open={openTreinoAdvinhar}
            onClose={setOpenTreinoAdvinhar}
            className="relative z-50"
        >
            {/* Overlay */}
            <div className="fixed inset-0 backdrop-blur-[2px]" />

            {/* Container */}
            <div className="fixed inset-0 flex items-center justify-center p-2">
                <Dialog.Panel className="w-60 max-w-xl rounded-2xl from-gray-900 to-gray-800 bg-gradient-to-br p-6 shadow-xl ">

                   {/* <div className="flex  gap-2 items-center space-x-15 mb-4">
                        <div className="flex justify-center items-center me-3">
                            <Eye width={38} height={38} className="text-blue-400" />

                        </div>
                        <div className="flex flex-col">
                            <span className="text-lg text-white ">Advinhar</span>
                        </div>
                    </div>*/}
                    <div className="flex  gap-2 items-center space-x-15 mb-4">
                        <div className="flex justify-center items-center me-3">
                            <Shuffle width={38} height={38} className="text-purple-400" />
                        </div>
                        <div className="flex flex-col cursor-pointer" onClick={() => {
                            if (!categoriaIdsStr) return;
                            setOpenTreinoAdvinhar(false);
                            navigate(`/emparelhar/${categoriaIdsStr}/traine`);
                        }}>
                            <span className="text-lg text-white">{t("match")}</span>
                        </div>
                    </div>
                    <div className="flex  gap-2 items-center space-x-15 mb-4">
                        <div className="flex justify-center items-center me-3">
                            <History width={38} height={38} className="text-green-600" />
                        </div>
                        <div className="flex flex-col" onClick={() => {
                            if (!categoriaIdsStr) return;
                            setOpenTreinoAdvinhar(false);
                            navigate(`/flashcards/${categoriaIdsStr}/traine`);
                        }}>
                            <span className="text-lg text-white leading-tight">{t("remember")}</span>
                        </div>
                    </div>
                    <div className="flex  gap-2 items-center space-x-15">
                        <div className="flex justify-center items-center me-3">
                            <Type width={38} height={38} className="text-yellow-500" />
                        </div>
                        <div className="flex flex-col " onClick={() => {
                            if (!categoriaIdsStr) return;
                            setOpenTreinoAdvinhar(false);
                            navigate(`/digitartexto/${categoriaIdsStr}/traine`);
                        }}>
                            <span className="text-lg leading-tight  flex text-white">{t("type")}</span>
                        </div>
                    </div>


                </Dialog.Panel>
            </div>
        </Dialog>


    )
}
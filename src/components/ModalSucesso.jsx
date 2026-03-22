import { Dialog } from "@headlessui/react";

import {
    Check
} from "lucide-react";

export default function ModalSucesso({ msg, openModalSucesso, setOpenModalSucesso }) {

    return (
        <Dialog
            open={openModalSucesso}
            onClose={setOpenModalSucesso}
            className="relative z-50"
        >
            {/* Overlay */}
            <div className="fixed inset-0 backdrop-blur-[2px]" />

            {/* Container */}
            <div className="fixed inset-0 flex items-center justify-center p-2 ">
                <Dialog.Panel className="w-[70%] max-w-xl rounded-2xl  py-6 shadow-xl from-gray-900 to-gray-800 bg-gradient-to-br border border-white/30">

                    <div className="flex flex-col gap-2 items-center justify-center px-8 mb-4 items-center text-center" >
                        <Check className="text-green-500" height={50} width={50} />
                        
                        <span className="text-white text-xl font-base">{msg}</span>
                    </div>

                </Dialog.Panel>
            </div>
        </Dialog>

    )
}
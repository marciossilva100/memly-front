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
            <div className="fixed inset-0 bg-black/40" />

            {/* Container */}
            <div className="fixed inset-0 flex items-center justify-center p-2 ">
                <Dialog.Panel className="w-[70%] max-w-xl rounded-2xl bg-white py-6 shadow-xl ">

                    <div className="flex flex-col gap-2 items-center justify-center px-8 mb-4 items-center text-center" >
                        <Check className="text-green-600" height={50} width={50} />
                        
                        <span className="text-slate-700 text-xl font-base">{msg}</span>
                    </div>

                </Dialog.Panel>
            </div>
        </Dialog>

    )
}
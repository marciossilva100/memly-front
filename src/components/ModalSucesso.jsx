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
                <Dialog.Panel className="w-50 max-w-xl rounded-2xl bg-white p-6 shadow-xl ">

                    <div className="gap-2 items-center justify-center space-x-15 mb-4 justify-items-center">
                        <Check className="text-green-600 w-20 h-20"/>
                        <h2 className="text-slate-700 text-sm">{msg}</h2>
                    </div>

                </Dialog.Panel>
            </div>
        </Dialog>

    )
}
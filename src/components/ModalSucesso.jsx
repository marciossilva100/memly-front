import { Dialog, Transition } from "@headlessui/react";
import { Fragment, useEffect } from "react";
import { Check } from "lucide-react";

const AUTO_CLOSE_MS = 2200;

export default function ModalSucesso({ msg, openModalSucesso, setOpenModalSucesso }) {

    // Fecha sozinho depois de um tempo - antes cada tela que abria esse modal
    // precisava lembrar de fazer isso na mão (e várias esqueciam, deixando o
    // modal preso até o usuário clicar fora sem nenhuma indicação visual).
    useEffect(() => {
        if (!openModalSucesso) return;

        const timer = setTimeout(() => setOpenModalSucesso(false), AUTO_CLOSE_MS);
        return () => clearTimeout(timer);
    }, [openModalSucesso, setOpenModalSucesso]);

    return (
        <Transition show={openModalSucesso} as={Fragment} appear>
            <Dialog onClose={() => setOpenModalSucesso(false)} className="relative z-50">
                <Transition.Child
                    as={Fragment}
                    enter="ease-out duration-200"
                    enterFrom="opacity-0"
                    enterTo="opacity-100"
                    leave="ease-in duration-150"
                    leaveFrom="opacity-100"
                    leaveTo="opacity-0"
                >
                    <div className="fixed inset-0 bg-black/30 backdrop-blur-[2px]" />
                </Transition.Child>

                <div className="fixed inset-0 flex items-center justify-center p-4">
                    <Transition.Child
                        as={Fragment}
                        enter="ease-out duration-200"
                        enterFrom="opacity-0 scale-90"
                        enterTo="opacity-100 scale-100"
                        leave="ease-in duration-150"
                        leaveFrom="opacity-100 scale-100"
                        leaveTo="opacity-0 scale-90"
                    >
                        <Dialog.Panel className="w-[80%] max-w-xs rounded-2xl py-8 px-6 shadow-xl from-gray-900 to-gray-800 bg-gradient-to-br border border-white/10 flex flex-col items-center gap-3 text-center">
                            <div className="flex items-center justify-center w-14 h-14 rounded-full bg-[#4cb8c4]/15">
                                <Check className="text-[#4cb8c4]" strokeWidth={3} size={30} />
                            </div>
                            <span className="text-white text-lg font-medium">{msg}</span>
                        </Dialog.Panel>
                    </Transition.Child>
                </div>
            </Dialog>
        </Transition>
    )
}

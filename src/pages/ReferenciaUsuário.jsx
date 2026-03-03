import { useState, useEffect } from "react"
import imgCoruja from "../assets/img/coruja.png"
import youtubeIcone from '../assets/img/youtube.png'
import playstoreIcone from '../assets/img/app.png'
import instagramIcone from '../assets/img/instagram.png'
import linkedinIcone from '../assets/img/linkedin.png'
import imgMemly from "../assets/img/mascote-memly.png"


export default function ReferenciaUsuario({ setTitulo }) {

    useEffect(() => {
        setTitulo('')
    }, [])
    return (
        <div
            className="
                h-[calc(100svh-41px)]
                overflow-hidden
                flex
                flex-col
                px-10
                pt-6
                pb-[env(safe-area-inset-bottom)]
            "
        >
            {/* TOPO */}
            <div className="w-full max-w-md mx-auto text-center mb-6">
                <div className="flex justify-center mb-3">
                    <img
                        src={imgMemly}
                        alt="Coruja"
                        className="w-28"
                    />
                </div>
                <h4 className="text-lg font-medium text-slate-700">
                    Como ficou conhecendo a gente?
                </h4>
            </div>

            <div className="w-full max-w-md mx-auto">
                <div className="grid grid-cols-2 gap-4">
                    <a
                        href="/home"
                        className="
                        flex
                        flex-col
                        items-center
                        justify-center
                        gap-2
                        p-4
                        rounded-2xl
                        border
                        border-gray-200
                        bg-white
                        hover:bg-gray-50
                        transition
                    "
                    >
                        <img
                            src={playstoreIcone}
                            alt="Play Store"
                            className="w-10 h-10 object-contain"
                        />
                        <span className="text-sm font-medium text-gray-700">
                            Play Store
                        </span>
                    </a>

                    <a
                        href="/home"
                        className="
                        flex
                        flex-col
                        items-center
                        justify-center
                        gap-2
                        p-4
                        rounded-2xl
                        border
                        border-gray-200
                        bg-white
                        hover:bg-gray-50
                        transition
                    "
                    >
                        <img
                            src={youtubeIcone}
                            alt="YouTube"
                            className="w-10 h-10 object-contain"
                        />
                        <span className="text-sm font-medium text-gray-700">
                            YouTube
                        </span>
                    </a>

                    <a
                        href="/home"
                        className="
                        flex
                        flex-col
                        items-center
                        justify-center
                        gap-2
                        p-4
                        rounded-2xl
                        border
                        border-gray-200
                        bg-white
                        hover:bg-gray-50
                        transition
                    "
                    >
                        <img
                            src={instagramIcone}
                            alt="Instagram"
                            className="w-10 h-10 object-contain"
                        />
                        <span className="text-sm font-medium text-gray-700">
                            Instagram
                        </span>
                    </a>

                    <a
                        href="/home"
                        className="
                        flex
                        flex-col
                        items-center
                        justify-center
                        gap-2
                        p-4
                        rounded-2xl
                        border
                        border-gray-200
                        bg-white
                        hover:bg-gray-50
                        transition
                    "
                    >
                        <img
                            src={linkedinIcone}
                            alt="Instagram"
                            className="w-10 h-10 object-contain"
                        />
                        <span className="text-sm font-medium text-gray-700">
                            Likedin
                        </span>
                    </a>
                </div>
            </div>

        </div>
    )
}

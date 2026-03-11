import { useParams, useNavigate } from "react-router-dom";
import { useState, useEffect } from 'react';
import ModalFrase from "../components/ModalFrase";
import { useAuth } from "../context/AuthContext";
import {
    Trash,
    Search,
    Filter
} from "lucide-react";



export default function Frases() {
    const { id } = useParams();
    const { user } = useAuth();

    const [frases, setFrases] = useState([]);
    const [loading, setLoading] = useState(false);
    const [textoBusca, setTextoBusca] = useState("")
    const [openFrase, setOpenFrase] = useState(false)
    const navigate = useNavigate();

    useEffect(() => {
        console.log('agora sim', user)
        listPhrase()
    }, []);

    async function listPhrase() {
        setLoading(true);

        fetch('https://zaldemy.com/controller/frases.php', {
            method: 'POST',
            credentials: "include",
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                action: 'frases',
                category_id: id
            })
        })
            .then(res => res.json())
            .then(data => {
                setFrases(data);
                setLoading(false);
            })
            .catch(() => {
                setLoading(false);
            });
    }


    async function deletePhrase(id) {

        try {

            const res = await fetch('https://zaldemy.com/controller/frases.php', {
                method: 'POST',
                credentials: "include",
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    action: 'delete_phrase',
                    id_phrase: id,
                })
            });

            const data = await res.json()

            if (!data.success) {
                console.log(message)
            }

            listPhrase()

        } catch (error) {

        } finally {
            setLoading(false)
        }

    }


    return (
        <div className="px-5">
            <div className="relative mb-4 mt-4">
                <div
                    className="left-0  cursor-pointer"
                    onClick={() => navigate(-1)}
                >
                    <i className="bi bi-arrow-left text-xl"></i>
                </div>
            </div>
            <div className={`mt-4 `}>
                <div className="flex items-center border rounded-md overflow-hidden ">
                    <span className="px-3 text-gray-500">
                        <Search width={20} />
                    </span>

                    <input
                        type="email"
                        className="w-full px-3 py-2 outline-none text-sm"
                        placeholder="Buscar"
                        value={textoBusca}
                        onChange={(e) => {
                            setTextoBusca(e.target.value)
                            setErro('')
                        }}
                    />
                </div>
            </div>
            {frases.length > 0 && (
                <div className="cursor-pointer flex justify-end mb-4">
                    <Filter className="text-slate-500 mt-2" width={15} />
                </div>
            )}

            {loading && <span>Carregando...{id}</span>}
            <div className="h-[calc(100vh-160px)] overflow-y-auto">

                {!loading && frases.map(item => (
                    <div key={item.id} className="grid grid-cols-[1fr_1fr_auto] gap-4 items-center  py-3 border-b-2 overflow" >
                        <div>{item.texto_nativo}</div>
                        <div>{item.texto_traduzido}</div>
                        <div className="flex justify-center">
                            <Trash width={14} className="text-red-400" onClick={() => deletePhrase(item.id)} />
                        </div>
                    </div>
                ))}

            </div>

            <div className="flex fixed bottom-0 left-0 w-full justify-center items-center py-4 bg-white">
                <button className="
                    px-6
                    py-3
                    rounded-full
                    bg-[#4cb8c4]
                    text-white
                    font-medium
                    hover:bg-blue-600
                    transition
                    " onClick={() => setOpenFrase(true)}>
                    Adicionar
                </button>
            </div>
            <ModalFrase openPhrase={openFrase} setOpenPhrase={setOpenFrase} category={id} listPhrase={listPhrase} />
        </div>
    );
}

import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

export default function LeituraDigital() {
    const [books, setBooks] = useState([]);
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    async function searchBooks(query = "bestseller") {
        try {
            setLoading(true);

            const res = await fetch(
                `https://openlibrary.org/search.json?q=${encodeURIComponent(
                    query
                )}&language=eng&limit=10`
            );

            const data = await res.json();

            const onlyEnglish = (data.docs || []).filter(
                (book) => book.language?.includes("eng")
            );

            setBooks(onlyEnglish.slice(0, 10));
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        searchBooks();
    }, []);

    return (
        <div className="px-6">
            <div className="relative text-left mb-3 w-full mt-3">
                <div
                    className=" cursor-pointer"
                    onClick={() => navigate(-1)}
                >
                    <i className="bi bi-arrow-left text-xl"></i>
                </div>
            </div>
            <div className="text-white w-full mt-4">

                {/* Search */}
                <div className="max-w-xl mx-auto mb-8">
                    <input
                        type="text"
                        placeholder="Search books in English..."
                        className="w-full p-2  rounded-xl border border-gray-700 bg-gray-800 focus:outline-none focus:border-blue-500"
                        onKeyDown={(e) => {
                            if (e.key === "Enter") {
                                searchBooks(e.target.value);
                            }
                        }}
                    />
                </div>

                {/* Loading */}
                {loading && (
                    <div className="text-center text-gray-400 mb-6">
                        Loading books...
                    </div>
                )}

                {/* Lista com altura controlada + scroll */}
                <div className="h-[calc(100vh-120px)] overflow-y-auto scrollbar-hide">
                    <div className="flex flex-wrap -mx-3">
                        {books.map((book) => {
                            const cover = book.cover_i
                                ? `https://covers.openlibrary.org/b/id/${book.cover_i}-M.jpg`
                                : "https://via.placeholder.com/150x220?text=No+Cover";

                            const workId = book.key.replace("/works/", "");

                            return (
                                <div
                                    key={book.key}
                                    className="w-1/3 px-3 mb-6"
                                    onClick={() => navigate(`/book/${workId}`)}
                                >
                                    <div className=" overflow-hidden  hover:scale-105 transition cursor-pointer">
                                        <img
                                            src={cover}
                                            alt={book.title}
                                            className="w-full  object-cover" style={{height:'160px'}}
                                        />

                                        <div className="mt-2">
                                            <h2 className="text-xs font-semibold line-clamp-2 text-slate-800">
                                                {book.title}
                                            </h2>

                                            <p className="text-xs text-gray-400 mt-1 line-clamp-2">
                                                {book.author_name?.join(", ") || "Unknown author"}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>


                {/* Espaço extra para garantir scroll visível */}
                <div className="h-10"></div>

            </div>
        </div>

    );
}

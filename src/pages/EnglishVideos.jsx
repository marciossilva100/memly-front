import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import imgChapeuFormatura from "../assets/img/chapeu_formatura.png"

export default function EnglishVideos({ query = "english conversation", max = 6 }) {
    const { t } = useTranslation();
    const [videos, setVideos] = useState([]);
    const [selectedVideo, setSelectedVideo] = useState(null);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    const API_KEY = import.meta.env.VITE_YOUTUBE_KEY;

    useEffect(() => {
        console.log(import.meta.env);
        async function loadVideos() {
            try {
                const res = await fetch(
                    `https://www.googleapis.com/youtube/v3/search?part=snippet&q=${query}&type=video&maxResults=${max}&key=${API_KEY}`
                );

                const data = await res.json();

                setVideos(data.items || []);
                setSelectedVideo(data.items?.[0] || null);
            } catch (err) {
                console.error("Erro ao buscar vídeos:", err);
            } finally {
                setLoading(false);
            }
        }

        loadVideos();
    }, [query, API_KEY]);

   if (loading) {
        return (
            <div className="flex h-screen items-center justify-center from-gray-900 to-gray-800 bg-gradient-to-br">
                <img
                    src={imgChapeuFormatura}
                    alt={t("loading")}
                    className="w-28 animate-pulse"
                />
            </div>
        );
    }

    return (
        <div className="w-full px-6 ">
            <div className="relative text-left mb-3 w-full mt-3">
                <div
                    className=" cursor-pointer"
                    onClick={() => navigate(-1)}
                >
                    <i className="bi bi-arrow-left text-xl"></i>
                </div>
            </div>
            <div className="h-[calc(100vh-50px)] overflow-y-auto scrollbar-hide">
                {/* VIDEO PLAYER */}
                {selectedVideo && (
                    <div className="mb-6">
                        <iframe
                            className="w-full h-[200px] rounded-lg"
                            src={`https://www.youtube.com/embed/${selectedVideo.id.videoId}`}
                            title={selectedVideo.snippet.title}
                            allowFullScreen
                        />
                        <h2 className="text-lg font-semibold mt-2">
                            {selectedVideo.snippet.title}
                        </h2>
                    </div>
                )}

                {/* LISTA DE VIDEOS */}
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4 ">
                    {videos.map((video) => (
                        <div
                            key={video.id.videoId}
                            className="cursor-pointer"
                            onClick={() => setSelectedVideo(video)}
                        >
                            <img
                                src={video.snippet.thumbnails.medium.url}
                                alt={video.snippet.title}
                                className="rounded-lg"
                            />

                            <p className="text-sm mt-2 line-clamp-2">
                                {video.snippet.title}
                            </p>
                        </div>
                    ))}
                </div>
            </div>

        </div>
    );
}
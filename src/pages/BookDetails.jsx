import { useParams, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";

export default function BookDetails() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [readerUrl, setReaderUrl] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchReader() {
      try {
        const res = await fetch(
          `https://openlibrary.org/works/${id}/editions.json`
        );
        const data = await res.json();

        // procura uma edição que tenha leitura disponível
        const edition = data.entries.find(e => e.ia);

        if (edition && edition.ia?.length > 0) {
          setReaderUrl(`https://archive.org/embed/${edition.ia[0]}`);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }

    fetchReader();
  }, [id]);

  if (loading) {
    return (
      <div className="bg-gray-900 text-white flex items-center justify-center h-screen">
        Loading...
      </div>
    );
  }

  return (
    <div className="bg-gray-900 text-white h-screen flex flex-col">
      
      {/* Botão voltar */}
      <div className="p-4">
        <div onClick={() => navigate(-1)} className="cursor-pointer">
          <i className="bi bi-arrow-left text-xl"></i>
        </div>
      </div>

      {/* Leitor */}
      <div className="flex-1">
        {readerUrl ? (
          <iframe
            src={readerUrl}
            className="w-full h-full"
            allowFullScreen
          />
        ) : (
          <div className="flex items-center justify-center h-full text-gray-400">
            Livro não disponível para leitura 😢
          </div>
        )}
      </div>
    </div>
  );
}
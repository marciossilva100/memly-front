import { useParams, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";

export default function BookDetails() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [book, setBook] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchBook() {
      const res = await fetch(
        `https://openlibrary.org/works/${id}.json`
      );
      const data = await res.json();
      setBook(data);
      setLoading(false);
    }

    fetchBook();
  }, [id]);

  if (loading) {
    return (
      <div className=" bg-gray-900 text-white flex items-center justify-center">
        Loading...
      </div>
    );
  }

  const description =
    typeof book.description === "string"
      ? book.description
      : book.description?.value;

  return (
    <div className=" bg-gray-900 text-white px-6  overflow-y-auto scrollbar-hide">
      <div className="relative text-left mb-3 w-full mt-3">
        <div
          className=" cursor-pointer"
          onClick={() => navigate(-1)}
        >
          <i className="bi bi-arrow-left text-xl"></i>
        </div>
      </div>
      <div className="max-w-3xl mx-auto h-[calc(100vh-50px)] overflow-y-auto scrollbar-hide">

        <h1 className="text-xl font-bold mb-4">
          {book.title}
        </h1>

        {description && (
          <p className="text-gray-300 leading-relaxed">
            {description}
          </p>
        )}

        {!description && (
          <p className="text-gray-500">
            No description available.
          </p>
        )}
      </div>
    </div>
  );
}

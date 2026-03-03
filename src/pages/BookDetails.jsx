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
    <div className=" bg-gray-900 text-white p-8 h-[calc(100vh-40px)] overflow-y-auto">



      <div className="max-w-3xl mx-auto">

        <h1 className="text-3xl font-bold mb-4">
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

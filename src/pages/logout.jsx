import { useEffect } from "react";
import { useNavigate } from "react-router-dom";


export default function Logout() {
  const navigate = useNavigate();

  useEffect(() => {
    async function handleLogout() {
      try {
        const response = await fetch(
          "https://zaldemy.com/controller/logout.php",
          {
            method: "POST",
            headers: {
                "Authorization": "Bearer " + localStorage.getItem("token")
            },
          }
        );

        const data = await response.json();

        if (data.success) {
          navigate("/login"); // redireciona após logout
        } else {
          console.error("Erro ao deslogar");
        }
      } catch (error) {
        console.error("Erro:", error);
      }
    }

    handleLogout();
  }, [navigate]);

  return <p>Saindo...</p>;
}
// components/ChatWidget.jsx
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function ChatWidget() {
  const { isLoggedIn } = useAuth();
  const navigate = useNavigate();

  if (!isLoggedIn) return null; // show only after login

  return (
    <div 
      onClick={() => navigate("/chat")}
      className="fixed bottom-5 right-5 bg-blue-600 text-white p-4 rounded-full shadow-lg cursor-pointer hover:bg-blue-700 transition"
    >
      💬
    </div>
  );
}

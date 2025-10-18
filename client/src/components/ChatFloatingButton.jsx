// src/components/ChatFloatingButton.jsx
import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";

export default function ChatFloatingButton() {
  const navigate = useNavigate();
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    const user = localStorage.getItem("user");
    setIsLoggedIn(!!user);
  }, []);

  if (!isLoggedIn) return null;

  return (
    <button
      onClick={() => navigate("/chat")}
      style={{
        position: "fixed",
        bottom: 24,
        right: 24,
        border: "none",
        background: "transparent",  // ✅ no white circle
        padding: 0,
        cursor: "pointer",
        zIndex: 9999,
      }}
    >
      <img
        src="/bot.png"   // ✅ make sure bot.png is in public/
        alt="Chatbot"
        style={{
          width: 64,       // adjust size
          height: 64,
          objectFit: "cover", // makes it fully fit
          borderRadius: "12px", // optional: keep square or round corners
          display: "block"
        }}
      />
    </button>
  );
}

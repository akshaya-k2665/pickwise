import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/SplashScreen.css";

export default function SplashScreen() {
  const navigate = useNavigate();
  const [fadeOut, setFadeOut] = useState(false);

  useEffect(() => {
    // Start fade-out at 2.3s
    const fadeTimer = setTimeout(() => setFadeOut(true), 2800);
    // Redirect at 2.8s total
    const redirectTimer = setTimeout(() => navigate("/signup"), 3300);

    return () => {
      clearTimeout(fadeTimer);
      clearTimeout(redirectTimer);
    };
  }, [navigate]);

  return (
    <div className={`splash-container ${fadeOut ? "fade-out" : ""}`}>
      <div className="splash-bg"></div>
    </div>
  );
}

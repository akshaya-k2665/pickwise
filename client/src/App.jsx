// src/App.jsx
import React, { useEffect, useState } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
  useLocation,
} from "react-router-dom";

import Navbar from "./components/Navbar";
import ProtectedRoute from "./components/ProtectedRoute";
import ChatFloatingButton from "./components/ChatFloatingButton";

// ===== Core Pages =====
import Home from "./pages/Home";
import GroupSync from "./pages/GroupSync";
import Moodboard from "./pages/Moodboard";
import MoodMovies from "./pages/MoodMovies";
import Contextual from "./pages/Contextual";
import WhyThis from "./pages/WhyThis";
import Settings from "./pages/Settings";
import Preferences from "./pages/Preferences";
import Login from "./pages/Auth/Login";
import Signup from "./pages/Auth/Signup";
import Recommendations from "./pages/Recommendations";
import Feedback from "./pages/Feedback";
import AdminDashboard from "./pages/AdminDashboard";
import UserDashboard from "./pages/UserDashboard";
import ChatbotPage from "./pages/ChatbotPage";

// ===== Category / Extended Pages =====
import ChooseCategoryPage from "./pages/ChooseCategoryPage";
import BookPreferences from "./pages/BookPreferences";
import BooksPage from "./pages/BooksPage";
import WishlistBooks from "./pages/WishlistBooks";
import MusicPreferences from "./pages/MusicPreferences";
import MusicPage from "./pages/MusicPage";
import ArtistMusicPage from "./pages/ArtistMusicPage";
import PopularityMusicPage from "./pages/PopularityMusicPage";
import BlendMusicPage from "./pages/BlendMusicPage";
import RecommendationsHub from "./pages/RecommendationsHub";

// ===== Admin Dashboard Subpages =====
import UsersPage from "./pages/Admin/UserPage";
import AnalyticsPage from "./pages/Admin/AnalyticsPage";
import FeedbackPage from "./pages/Admin/FeedbackPage";

// ===== New Splash Screen =====
import SplashScreen from "./pages/SplashScreen"; // ✅ added

import "./styles/App.css";

export default function App() {
  return (
    <Router>
      <AppContent />
    </Router>
  );
}

function AppContent() {
  const location = useLocation();
  const [selectedCategory, setSelectedCategory] = useState(null);

  useEffect(() => {
    const savedCategory = localStorage.getItem("selectedCategory");
    setSelectedCategory(savedCategory);
  }, [location.pathname]);

  // 🧭 Routes to hide Navbar and Chatbot
  const hideNavbarRoutes = ["/login", "/signup", "/","/choose", "/admin", "/admin/users", "/admin/analytics", "/admin/feedback", "/Choose", "/book-preferences", "/books/wishlist", "/music-preferences","/music/artist", "/music/popularity", "/music/blend", "/recommendations-hub"];
  const hideChatbotRoutes = ["/", "/login", "/signup", "/chat", "/admin", "/admin/users", "/admin/analytics", "/admin/feedback", "/Choose"];

  const hideNavbar = hideNavbarRoutes.includes(location.pathname);
  const hideChatbotButton = hideChatbotRoutes.includes(location.pathname);
  const isChoosePage = location.pathname === "/choose";

  // 🧠 Navbar logic
  let showNavbar = false;
  let showOnlyLogout = false;

  if (!hideNavbar) {
    if (isChoosePage) {
      showNavbar = true;
      showOnlyLogout = true;
    } else if (selectedCategory) {
      showNavbar = true;
      showOnlyLogout = false;
    }
  }

  return (
    <div className="app">
      {/* 🎥 Background Video */}
      <video autoPlay loop muted playsInline className="background-video">
        <source src="/bg.mp4" type="video/mp4" />
        Your browser does not support the video tag.
      </video>
      <div className="video-overlay"></div>

      {/* 🧭 Conditional Navbar */}
      {showNavbar && <Navbar showOnlyLogout={showOnlyLogout} />}

      <main className="main-content">
        <Routes>
          {/* 🌟 Splash Screen Route (2-sec fade, then redirect to signup) */}
          <Route path="/" element={<SplashScreen />} />

          {/* 🌍 Public Routes */}
          <Route path="/home" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />

          {/* 🧭 Choose Category */}
          <Route
            path="/choose"
            element={
              <ProtectedRoute>
                <ChooseCategoryPage />
              </ProtectedRoute>
            }
          />

          {/* 🎬 Movie Preferences */}
          <Route
            path="/preferences"
            element={
              <ProtectedRoute>
                <Preferences />
              </ProtectedRoute>
            }
          />

          {/* 📚 Book Preferences & Pages */}
          <Route
            path="/book-preferences"
            element={
              <ProtectedRoute>
                <BookPreferences />
              </ProtectedRoute>
            }
          />
          <Route
            path="/books"
            element={
              <ProtectedRoute>
                <BooksPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/books/wishlist"
            element={
              <ProtectedRoute>
                <WishlistBooks />
              </ProtectedRoute>
            }
          />

          {/* 🎵 Music Preferences & Pages */}
          <Route
            path="/music-preferences"
            element={
              <ProtectedRoute>
                <MusicPreferences />
              </ProtectedRoute>
            }
          />
          <Route
            path="/music"
            element={
              <ProtectedRoute>
                <MusicPage />
              </ProtectedRoute>
            }
          />
          <Route path="/music/artist" element={<ArtistMusicPage />} />
          <Route path="/music/popularity" element={<PopularityMusicPage />} />
          <Route path="/music/blend" element={<BlendMusicPage />} />

          {/* 🧠 Dashboards & Recommendations */}
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <UserDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/recommendations"
            element={
              <ProtectedRoute>
                <Recommendations />
              </ProtectedRoute>
            }
          />
          <Route
            path="/recommendations-hub"
            element={
              <ProtectedRoute>
                <RecommendationsHub />
              </ProtectedRoute>
            }
          />

          {/* 🎭 Mood-Based Movies */}
          <Route
            path="/moodboard"
            element={
              <ProtectedRoute>
                <Moodboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/moodboard/movies/:genre"
            element={
              <ProtectedRoute>
                <MoodMovies />
              </ProtectedRoute>
            }
          />

          {/* 🔁 Shared Authenticated Routes */}
          <Route
            path="/feedback"
            element={
              <ProtectedRoute>
                <Feedback />
              </ProtectedRoute>
            }
          />
          <Route
            path="/groupsync"
            element={
              <ProtectedRoute>
                <GroupSync />
              </ProtectedRoute>
            }
          />
          <Route
            path="/contextual"
            element={
              <ProtectedRoute>
                <Contextual />
              </ProtectedRoute>
            }
          />
          <Route
            path="/whythis"
            element={
              <ProtectedRoute>
                <WhyThis />
              </ProtectedRoute>
            }
          />
          <Route
            path="/settings"
            element={
              <ProtectedRoute>
                <Settings />
              </ProtectedRoute>
            }
          />

          {/* 💬 Chatbot */}
          <Route
            path="/chat"
            element={
              <ProtectedRoute>
                <ChatbotPage />
              </ProtectedRoute>
            }
          />

          {/* 🛠️ Admin Dashboard & Subpages */}
          <Route
            path="/admin"
            element={
              <ProtectedRoute requiredRole="admin">
                <AdminDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/users"
            element={
              <ProtectedRoute requiredRole="admin">
                <UsersPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/analytics"
            element={
              <ProtectedRoute requiredRole="admin">
                <AnalyticsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/feedback"
            element={
              <ProtectedRoute requiredRole="admin">
                <FeedbackPage />
              </ProtectedRoute>
            }
          />

          {/* 🧭 Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>

      {/* 💬 Floating Chat Button */}
      {!hideChatbotButton && <ChatFloatingButton />}
    </div>
  );
}

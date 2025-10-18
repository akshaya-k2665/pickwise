import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { searchMovies, getRecommendations } from "../api";
import axios from "axios";
import "../styles/ChatbotPage.css";

export default function ChatbotPage() {
  const navigate = useNavigate();
  const [messages, setMessages] = useState([
    { sender: "bot", text: "Hello 👋! What would you like me to recommend — movies, books, or music?" },
  ]);
  const [input, setInput] = useState("");
  const containerRef = useRef(null);

  const [lastCategory, setLastCategory] = useState(null);
  const [lastQuery, setLastQuery] = useState("");
  const [musicOffset, setMusicOffset] = useState(0);

  // =====================
  // 🧠 SEND MESSAGE
  // =====================
  const handleSend = async () => {
    const text = input.trim();
    if (!text) return;
    setMessages((prev) => [...prev, { sender: "user", text }]);
    setInput("");

    try {
      const lower = text.toLowerCase();

      // "more" handling
      if (/more|again|next/i.test(lower) && lastCategory) {
        await handleCategory(lastCategory, lastQuery, true);
        return;
      }

      // Detect category
      if (/movie|film|genre|actor|director/i.test(lower)) {
        await handleCategory("movie", text);
      } else if (/book|novel|read|author|story/i.test(lower)) {
        await handleCategory("book", text);
      } else if (/music|song|track|artist|album/i.test(lower)) {
        await handleCategory("music", text);
      } else {
        setMessages((p) => [
          ...p,
          { sender: "bot", text: "Please specify: movies, books, or music 🎬📚🎵" },
        ]);
      }
    } catch (err) {
      console.error("Chat error:", err);
      setMessages((p) => [...p, { sender: "bot", text: "⚠️ Something went wrong!" }]);
    }
  };

  // =====================
  // 🎯 HANDLE CATEGORY
  // =====================
  const handleCategory = async (category, query, showMore = false) => {
    setLastCategory(category);
    setLastQuery(query);

    if (category === "movie") return handleMovieSearch(query, showMore);
    if (category === "book") return handleBookSearch(query, showMore);
    if (category === "music") return handleMusicSearch(query, showMore);
  };

  // =====================
  // 🎬 MOVIES
  // =====================
  const handleMovieSearch = async (query, showMore = false) => {
    try {
      const data = await searchMovies(query);
      const movies = (data.results || [])
        .filter((m) => m.poster_path)
        .slice(showMore ? 5 : 0, showMore ? 10 : 5);

      if (!movies.length) {
        return setMessages((p) => [...p, { sender: "bot", text: "No movies found 😢" }]);
      }

      const cards = (
        <div className="card-grid">
          {movies.map((m) => (
            <div key={m.id} className="movie-card">
              <img src={`https://image.tmdb.org/t/p/w200${m.poster_path}`} alt={m.title} />
              <div>
                <strong>{m.title}</strong> ({m.release_date?.slice(0, 4) || "N/A"})
                <br />⭐ {m.vote_average?.toFixed(1) || "N/A"}
              </div>
            </div>
          ))}
        </div>
      );

      setMessages((p) => [
        ...p,
        { sender: "bot", text: "Here are some movies 🎥:" },
        { sender: "bot", text: cards },
      ]);
    } catch (error) {
      console.error("TMDB error:", error);
      setMessages((p) => [...p, { sender: "bot", text: "⚠️ Couldn't fetch movies." }]);
    }
  };

  // =====================
  // 📚 BOOKS
  // =====================
  const handleBookSearch = async (query) => {
    try {
      const user = JSON.parse(localStorage.getItem("user") || "{}");
      const email = user.email || "demo@example.com";

      const res = await getRecommendations(email, "books");
      const books = res.data?.recommendations || [];

      if (!books.length) {
        return setMessages((p) => [...p, { sender: "bot", text: "No books found 📚" }]);
      }

      const cards = (
        <div className="card-grid">
          {books.slice(0, 5).map((b, idx) => (
            <div key={idx} className="book-card">
              {b.thumbnail && <img src={b.thumbnail} alt={b.title} />}
              <div>
                <strong>{b.title}</strong>
                <br />
                {b.authors?.join(", ") || "Unknown Author"}
              </div>
            </div>
          ))}
        </div>
      );

      setMessages((p) => [
        ...p,
        { sender: "bot", text: "Here are some books 📖:" },
        { sender: "bot", text: cards },
      ]);
    } catch (error) {
      console.error("Books API error:", error);
      setMessages((p) => [...p, { sender: "bot", text: "⚠️ Couldn't fetch books." }]);
    }
  };

  // =====================
  // 🎵 MUSIC
  // =====================
  const handleMusicSearch = async (query, showMore = false) => {
    try {
      const artistMatch = query.match(/by\s+([a-zA-Z\s]+)/i);
      const artist = artistMatch ? artistMatch[1].trim() : query.trim();

      const offset = showMore ? musicOffset : 0;
      const res = await axios.post(
        `${import.meta.env.VITE_API_BASE_URL || "http://localhost:5000"}/api/spotify/recommendations`,
        { artist, offset }
      );

      const { tracks, nextOffset } = res.data;
      if (!tracks || !tracks.length) {
        return setMessages((p) => [...p, { sender: "bot", text: `No songs found for ${artist} 🎵` }]);
      }

      setMusicOffset(nextOffset || 0);

      const cards = (
        <div className="card-grid">
          {tracks.map((t, idx) => (
            <div key={idx} className="music-card">
              {t.artwork && <img src={t.artwork} alt={t.title} />}
              <div>
                <strong>{t.title}</strong>
                <br />by {t.artist}
                {t.previewUrl && (
                  <audio
                    controls
                    src={t.previewUrl}
                    style={{ marginTop: "6px", width: "160px" }}
                  />
                )}
              </div>
            </div>
          ))}
        </div>
      );

      setMessages((p) => [
        ...p,
        { sender: "bot", text: showMore ? `More songs by ${artist} 🎧:` : `Here are top tracks by ${artist} 🎶:` },
        { sender: "bot", text: cards },
      ]);
    } catch (error) {
      console.error("Spotify API error:", error.response?.data || error.message);
      setMessages((p) => [...p, { sender: "bot", text: "⚠️ Couldn't fetch songs from Spotify." }]);
    }
  };

  // Scroll & Enter
  useEffect(() => {
    const el = containerRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages]);

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="chat-page">
      <header className="chat-header">
        <button className="back-btn" onClick={() => navigate(-1)}>← Back</button>
        <h2 className="chat-title">PickWise Assistant</h2>
      </header>

      <div className="chat-messages" ref={containerRef}>
        {messages.map((m, i) => (
          <div key={i} className={`message-row ${m.sender}`}>
            <div className="bubble">{m.text}</div>
          </div>
        ))}
      </div>

      <footer className="chat-input">
        <textarea
          className="chat-textarea"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Ask for movies, books, or songs by your favorite artist..."
        />
        <button className="send-btn" onClick={handleSend}>Send</button>
      </footer>
    </div>
  );
}

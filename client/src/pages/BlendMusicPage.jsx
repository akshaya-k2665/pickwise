import React, { useState, useEffect } from "react";
import axios from "axios";
import "../styles/MusicModePages.css";

const API = axios.create({ baseURL: "http://localhost:5000/api" });

export default function BlendMusicPage() {
  const [activeTab, setActiveTab] = useState("send"); // send | receive
  const [userEmail, setUserEmail] = useState("");
  const [requesterEmail, setRequesterEmail] = useState("");
  const [recipientEmail, setRecipientEmail] = useState("");
  const [message, setMessage] = useState("");
  const [artistSeedsText, setArtistSeedsText] = useState("");
  const [status, setStatus] = useState("");
  const [requests, setRequests] = useState([]); // pending or history
  const [blendTracks, setBlendTracks] = useState([]);

  // ✅ Load logged-in user email
  useEffect(() => {
    const user = JSON.parse(localStorage.getItem("user"));
    if (user?.email) {
      setUserEmail(user.email);
      setRequesterEmail(user.email);
      setRecipientEmail("");
    }
  }, []);

  // ✅ Send Blend Request
  async function sendRequest() {
    if (!requesterEmail || !recipientEmail) {
      setStatus("⚠️ Please enter both emails.");
      return;
    }
    try {
      setStatus("Sending request...");
      await API.post("/spotify/blend/request", {
        requesterEmail,
        recipientEmail,
        message,
        artistSeeds: artistSeedsText
          ? artistSeedsText.split(",").map((s) => s.trim()).filter(Boolean)
          : [],
      });
      setStatus("✅ Blend request sent successfully!");
      setBlendTracks([]);
    } catch (err) {
      setStatus("❌ Failed to send request.");
      console.error(err);
    }
  }

  // ✅ Load Requests (pending + history)
  async function loadRequests() {
    try {
      const res = await API.get(`/spotify/blend/all/${userEmail}`);
      setRequests(res.data.requests || []);
      if (res.data.requests.length === 0)
        setStatus("📭 No pending or accepted requests.");
      else setStatus("");
    } catch (err) {
      console.error(err);
      setStatus("❌ Failed to load requests.");
    }
  }

  useEffect(() => {
    if (activeTab === "receive" && userEmail) loadRequests();
  }, [activeTab, userEmail]);

  // ✅ Accept Blend Request
  async function acceptRequest(id) {
    try {
      setStatus("Processing blend...");
      const res = await API.post(`/spotify/blend/accept/${id}`, {
        acceptorEmail: userEmail,
      });
      setStatus("✅ Blend created successfully!");
      setBlendTracks(res.data.recommendations || []);
      loadRequests();
    } catch (err) {
      console.error("Accept failed:", err);
      setStatus("❌ Accept failed");
    }
  }

  function timeAgo(dateString) {
    const date = new Date(dateString);
    const diff = Math.floor((Date.now() - date.getTime()) / 1000);
    if (diff < 60) return `${diff}s ago`;
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`;
    return `${Math.floor(diff / 604800)}w ago`;
  }

  return (
    <div className="music-mode-page">
      <h1>🤝 Create a Blend</h1>
      <p>Collaborate with friends and share a mixed playlist.</p>

      {/* ==== Tabs ==== */}
      <div className="blend-tabs">
        <button
          className={activeTab === "send" ? "active" : ""}
          onClick={() => {
            setActiveTab("send");
            setBlendTracks([]);
            setStatus("");
          }}
        >
          ✉️ Send Blend Request
        </button>
        <button
          className={activeTab === "receive" ? "active" : ""}
          onClick={() => {
            setActiveTab("receive");
            setBlendTracks([]);
            setStatus("");
          }}
        >
          📥 View Received Requests
        </button>
      </div>

      {/* ==== SEND REQUEST TAB ==== */}
      {activeTab === "send" && (
        <div className="blend-card">
          <h2>Send a Blend Request</h2>
          <p>Enter your friend's email to create a blend request.</p>

          <div className="blend-form">
            <input
              type="email"
              placeholder="Friend's email"
              value={recipientEmail}
              onChange={(e) => setRecipientEmail(e.target.value)}
            />
            <input
              type="text"
              placeholder="Artist seeds (comma separated)"
              value={artistSeedsText}
              onChange={(e) => setArtistSeedsText(e.target.value)}
            />
            <input
              type="text"
              placeholder="Message (optional)"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
            />
            <button onClick={sendRequest}>Send Request</button>
          </div>

          {status && <p className="blend-status">{status}</p>}
        </div>
      )}

      {/* ==== RECEIVE REQUEST TAB ==== */}
      {activeTab === "receive" && (
        <div className="blend-card">
          <h2>Received & Past Requests</h2>

          {requests.length === 0 ? (
            <p style={{ color: "#bbb", marginTop: "10px" }}>
              📭 No pending or accepted requests.
            </p>
          ) : (
            requests.map((r) => (
              <div
                key={r._id}
                className={`request-item ${
                  r.status === "accepted" ? "accepted" : "pending"
                }`}
              >
                <div>
                  <strong>From:</strong> {r.requesterEmail}
                </div>
                <div>
                  <strong>Artists:</strong>{" "}
                  {r.artistSeeds.join(", ") || "—"}
                </div>
                <div>
                  <small>
                    {r.status === "pending"
                      ? "🕒 Pending"
                      : `✅ Accepted ${timeAgo(r.acceptedAt)}`}
                  </small>
                </div>
                {r.status === "pending" && (
                  <button onClick={() => acceptRequest(r._id)}>Accept</button>
                )}
              </div>
            ))
          )}

          {status && <p className="blend-status">{status}</p>}
        </div>
      )}

      {/* ==== RECOMMENDATIONS ==== */}
      {blendTracks.length > 0 && (
        <div className="results">
          <h3>Blend Recommendations 🎧</h3>
          <div className="track-grid">
            {blendTracks.map((t) => (
              <div key={t.id} className="track-card">
                <img src={t.album.images[0]?.url} alt="" />
                <p>{t.name}</p>
                <small>{t.artists.map((a) => a.name).join(", ")}</small>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

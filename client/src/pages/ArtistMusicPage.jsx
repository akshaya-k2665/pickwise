import React, { useState } from "react";
import axios from "axios";
import "../styles/MusicModePages.css";

const API = axios.create({ baseURL: "http://localhost:5000/api/spotify" });

const popularArtists = [
  "Arijit Singh",
  "Sid Sriram",
  "Shreya Ghoshal",
  "K.S. Chithra",
  "A.R. Rahman",
  "Anirudh Ravichander",
  "Ed Sheeran",
  "Taylor Swift",
  "Armaan Malik",
  "Neha Kakkar",
];

export default function ArtistMusicPage() {
  const [artist, setArtist] = useState("");
  const [artistInfo, setArtistInfo] = useState(null);
  const [selectedGenre, setSelectedGenre] = useState("");
  const [tracks, setTracks] = useState([]);
  const [allTracks, setAllTracks] = useState([]);

  async function searchArtistByName(name) {
    try {
      const res = await API.get(`/artist/${name}`);
      setArtistInfo(res.data);
      setTracks([]);
      setAllTracks([]);
    } catch {
      alert("Artist not found!");
    }
  }

  async function fetchTopTracks() {
    try {
      const res = await API.get(
        `/artist/${artistInfo.id}/toptracks?genre=${selectedGenre}`
      );
      const fetchedTracks = res.data || [];
      setAllTracks(fetchedTracks);
      setTracks(getRandomFive(fetchedTracks));
    } catch {
      alert("Failed to fetch tracks!");
    }
  }

  // Helper function to pick 5 random unique tracks
  function getRandomFive(trackList) {
    if (trackList.length <= 5) return trackList;
    const shuffled = [...trackList].sort(() => 0.5 - Math.random());
    return shuffled.slice(0, 5);
  }

  function refreshRecommendations() {
    setTracks(getRandomFive(allTracks));
  }

  return (
    <div className="artist-page">
      <h1>🎤 Search by Artist</h1>
      <p>Discover songs by your favorite artists below 👇</p>

      <div className="artist-list">
        {popularArtists.map((name) => (
          <button
            key={name}
            className="artist-btn"
            onClick={() => searchArtistByName(name)}
          >
            {name}
          </button>
        ))}
      </div>

      <div className="search-box">
        <input
          value={artist}
          onChange={(e) => setArtist(e.target.value)}
          placeholder="Search for an artist..."
        />
        <button onClick={() => searchArtistByName(artist)}>Search</button>
      </div>

      {artistInfo && (
        <div className="artist-info">
          {artistInfo.image && <img src={artistInfo.image} alt="" />}
          <h2>{artistInfo.name}</h2>
          <p>Genres: {artistInfo.genres.join(", ")}</p>

          <div className="genre-select">
            <select onChange={(e) => setSelectedGenre(e.target.value)}>
              <option value="">Select Genre</option>
              {artistInfo.genres.map((g) => (
                <option key={g}>{g}</option>
              ))}
            </select>
            <button onClick={fetchTopTracks}>Get Recommendations</button>
          </div>
        </div>
      )}

      {tracks.length > 0 && (
        <div className="results">
          <h3>Recommended Tracks</h3>
          <button className="refresh-btn" onClick={refreshRecommendations}>
            🔄 Refresh Recommendations
          </button>

          <div className="track-grid">
            {tracks.map((t) => (
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

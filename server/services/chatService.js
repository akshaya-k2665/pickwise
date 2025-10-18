// server/services/chatService.js
const https = require("https");

/**
 * Chat service for movie recommendations
 * Using TMDB API through corsproxy.io (stable relay)
 */
exports.chat = async ({ message }) => {
  try {
    const query = message
      .replace(/recommend|suggest|give|show|find|list|movies|movie|films|like|based on/gi, "")
      .trim();

    if (!query) {
      return [{ text: "Please provide a movie name or keyword 😊" }];
    }

    // ✅ Relay TMDB request through corsproxy.io
    const tmdbURL = `https://api.themoviedb.org/3/search/movie?api_key=${process.env.TMDB_API_KEY}&query=${encodeURIComponent(
      query
    )}&language=en-US&include_adult=false`;

    const relayURL = `https://corsproxy.io/?${encodeURIComponent(tmdbURL)}`;

    const res = await fetch(relayURL, {
      agent: new https.Agent({ rejectUnauthorized: false }),
    });

    if (!res.ok) {
      console.error("❌ Relay error:", res.status, res.statusText);
      return [{ text: "Error fetching movie data from TMDB ⚠️" }];
    }

    const data = await res.json();

    // Format movies into plain text (frontend understands this)
    const movies = (data.results || [])
      .slice(0, 5)
      .map(
        (m, i) =>
          `${i + 1}. ${m.title} (${m.release_date || "Unknown"}) ⭐ ${
            m.vote_average || "N/A"
          }`
      )
      .join("\n\n");

    if (movies) {
      return [{ text: `Here are some movies 🎬:\n\n${movies}` }];
    } else {
      return [{ text: "No results found 😢" }];
    }
  } catch (err) {
    console.error("❌ Error in chatService:", err.message);
    return [{ text: "Error fetching movie data from TMDB ⚠️" }];
  }
};

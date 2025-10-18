/* eslint-disable no-undef */
const axios = require("axios");
const TMDB_API_KEY = process.env.TMDB_API_KEY;

// Normalize watch providers
function normalizeProviderName(name) {
  if (!name) return "";
  const lower = name.toLowerCase();

  if (lower.includes("prime") || lower.includes("amazon"))
    return "Amazon Prime Video";
  if (lower.includes("netflix")) return "Netflix";
  if (lower.includes("disney") || lower.includes("hotstar"))
    return "Disney Plus Hotstar";
  if (lower.includes("apple")) return "Apple TV Plus";
  if (lower.includes("hulu")) return "Hulu";
  if (lower.includes("hbo")) return "HBO Max";
  if (lower.includes("paramount")) return "Paramount Plus";
  if (lower.includes("peacock")) return "Peacock";
  if (lower.includes("crunchyroll")) return "Crunchyroll";
  if (lower.includes("lionsgate")) return "Lionsgate Play";
  if (lower.includes("sonyliv")) return "SonyLIV";
  if (lower.includes("zee5")) return "ZEE5";
  if (lower.includes("mx player")) return "MX Player";
  if (lower.includes("jio")) return "JioCinema";

  return name.trim();
}


// Shuffle helper
function shuffle(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

// Fetch TMDB data
exports.getMoviesByMood = async (req, res) => {
  const { genre } = req.params;

  try {
    const genreMap = {
      happy: 35,
      romantic: 10749,
      melancholic: 18,
      energetic: 28,
      thoughtful: 99,
      adventurous: 12,
      excited: 14,
      calm: 16,
    };
    const genreId = genreMap[genre.toLowerCase()] || 18;

    const randomPage = Math.floor(Math.random() * 40) + 1;
    const sortOptions = ["popularity.desc", "vote_average.desc", "release_date.desc"];
    const sort = sortOptions[Math.floor(Math.random() * sortOptions.length)];

    const tmdbRes = await axios.get("https://api.themoviedb.org/3/discover/movie", {
      params: {
        api_key: TMDB_API_KEY,
        with_genres: genreId,
        sort_by: sort,
        include_adult: false,
        page: randomPage,
        region: "IN",
      },
    });

    const movies = shuffle(tmdbRes.data.results)
      .slice(0, 10)
      .map((m) => ({
        id: m.id,
        title: m.title,
        poster: m.poster_path
          ? `https://image.tmdb.org/t/p/w780${m.poster_path}` // larger poster
          : "https://via.placeholder.com/300x450?text=No+Image",
        release_date: m.release_date,
        rating: m.vote_average,
        overview: m.overview,
      }));

    const detailed = await Promise.all(
      movies.map(async (movie) => {
        try {
          // Fetch watch providers and trailers concurrently
          const [provRes, trailerRes] = await Promise.all([
            axios.get(`https://api.themoviedb.org/3/movie/${movie.id}/watch/providers`, {
              params: { api_key: TMDB_API_KEY },
            }),
            axios.get(`https://api.themoviedb.org/3/movie/${movie.id}/videos`, {
              params: { api_key: TMDB_API_KEY },
            }),
          ]);

          // Deduplicate and normalize providers
          const raw = provRes.data?.results?.IN?.flatrate || [];
          const seen = new Set();
          const providers = [];
          for (const p of raw) {
            const name = normalizeProviderName(p.provider_name);
            if (!seen.has(name)) {
              seen.add(name);
              providers.push({ name });
            }
          }

          // Trailer logic: pick any English or YouTube video
          const videos = trailerRes.data.results || [];
          let trailer = videos.find(
            (v) =>
              v.site === "YouTube" &&
              ["Trailer", "Teaser", "Featurette"].includes(v.type) &&
              v.iso_639_1 === "en"
          );

          if (!trailer) {
            // fallback: any YouTube video
            trailer = videos.find((v) => v.site === "YouTube");
          }

          const trailerUrl = trailer
            ? `https://www.youtube.com/watch?v=${trailer.key}`
            : null;

          return { ...movie, watch_providers: providers, trailerUrl };
        } catch {
          return { ...movie, watch_providers: [], trailerUrl: null };
        }
      })
    );

    console.log(`✅ ${detailed.length} movies for mood ${genre}`);
    res.json(detailed);
  } catch (err) {
    console.error("❌ Error fetching movies:", err.message);
    res.status(500).json({ error: "Failed to fetch mood-based movies" });
  }
};


/* eslint-disable no-undef */
const axios = require("axios");

// 🎭 Mood → TMDB Genre Mapping
const moodGenreMap = {
  happy: ["35", "16", "10751"], // Comedy, Animation, Family
  excited: ["28", "12", "14", "878"], // Action, Adventure, Fantasy, Sci-Fi
  calm: ["18", "99"], // Drama, Documentary
  romantic: ["10749", "35"], // Romance, Comedy
  melancholic: ["18", "10402"], // Drama, Music
  energetic: ["28", "12", "10752"], // Action, Adventure, War
  thoughtful: ["9648", "99", "36"], // Mystery, Documentary, History
  adventurous: ["12", "14", "37"], // Adventure, Fantasy, Western
};

// ✅ Random Genre Picker
const getRandomItem = (arr) => arr[Math.floor(Math.random() * arr.length)];

// ✅ TMDB API Function
exports.fetchMoviesFromTMDB = async (mood) => {
  try {
    const apiKey = process.env.TMDB_API_KEY;
    if (!apiKey) {
      console.error("❌ Missing TMDB_API_KEY in .env");
      return [];
    }

    const genreList = moodGenreMap[mood.toLowerCase()] || ["18"]; // default Drama
    const randomGenre = getRandomItem(genreList);

    // ✅ Randomize page for variety (1–5)
    const randomPage = Math.floor(Math.random() * 5) + 1;

    console.log(`🎬 Fetching TMDB movies for mood: ${mood} (Genre ID: ${randomGenre})`);

    const url = `https://api.themoviedb.org/3/discover/movie?api_key=${apiKey}&with_genres=${randomGenre}&sort_by=popularity.desc&page=${randomPage}&language=en-US`;

    const response = await axios.get(url);
    const results = response.data.results || [];

    // ✅ Filter out missing posters
    const filtered = results.filter((m) => m.poster_path);

    // ✅ Map to frontend-friendly format
    const movies = filtered.slice(0, 10).map((m) => ({
      id: m.id,
      title: m.title,
      overview: m.overview,
      poster: `https://image.tmdb.org/t/p/w500${m.poster_path}`,
      release_date: m.release_date,
      rating: m.vote_average,
      genre_ids: m.genre_ids,
    }));

    console.log(`✅ ${movies.length} movies fetched for "${mood}"`);
    return movies;
  } catch (error) {
    console.error("❌ TMDB Fetch Error:", error.message);
    return [];
  }
};

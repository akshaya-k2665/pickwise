// server/routes/tmdbRoutes.js
const express = require("express");
const https = require("https");
const fetch = (...args) =>
  import("node-fetch").then(({ default: fetch }) => fetch(...args));

const router = express.Router();

// <-- Put your real Cloudflare Worker URL here (the one you deployed) -->
const RELAY_BASE = "https://chatbot.akshaya-k2665.workers.dev";

router.get("/", async (req, res) => {
  const rawQuery = req.query.q?.trim();
  if (!rawQuery) return res.status(400).json({ error: "Missing query" });

  try {
    const query = rawQuery.toLowerCase();

    const genreMap = {
      action: 28,
      comedy: 35,
      romance: 10749,
      thriller: 53,
      drama: 18,
      horror: 27,
      "sci-fi": 878,
      science: 878,
      animation: 16,
      fantasy: 14,
    };
    const foundGenre = Object.keys(genreMap).find((g) => query.includes(g));
    const genreId = foundGenre ? genreMap[foundGenre] : null;

    const agent = new https.Agent({ rejectUnauthorized: false });
    let results = [];
    let meta = {};

    // detect person intent (director/actor/by)
    const isPersonQuery = /by|directed|director|actor|starring|starring|starring/i.test(
      query
    );
    const isDirectorQuery = /directed|director|directed by/i.test(query);
    const isActorQuery = /starring|star|actor|actress|starring/i.test(query);

    // Helper to call the worker and return parsed JSON
    async function callWorker(endpoint, params = "") {
      const url = `${RELAY_BASE}/?endpoint=${endpoint}${params ? "&" + params : ""}`;
      const resp = await fetch(url, { agent, compress: false });
      const text = await resp.text();
      try {
        return JSON.parse(text);
      } catch {
        // if parsing fails, return empty shape
        return { results: [], cast: [], crew: [], message: "parse failed" };
      }
    }

    if (isPersonQuery) {
      // extract probable name: remove common words + genre word if present
      let name = query
        .replace(/movies|movie|films?|by|directed|director|actor|actress|starring|show|list/gi, "")
        .trim();
      if (foundGenre) {
        // remove the genre keyword from name if it remained
        name = name.replace(new RegExp(foundGenre, "gi"), "").trim();
      }
      if (!name) {
        // fallback: treat as keyword
      } else {
        // 1) find person by name
        const personData = await callWorker("search/person", `query=${encodeURIComponent(name)}`);
        if (!personData || !personData.results || personData.results.length === 0) {
          // no person found — fall back to keyword search below
        } else {
          const person = personData.results[0];
          const personId = person.id;

          // 2) fetch movie credits for the person
          const creditsData = await callWorker(
            `person/${personId}/movie_credits`,
            ""
          );

          // creditsData has .cast and .crew arrays
          let movieEntries = [];

          // If user explicitly asked for director, prefer crew with job Director
          if (isDirectorQuery) {
            movieEntries = (creditsData.crew || []).filter((c) => c.job === "Director");
          } else if (isActorQuery) {
            movieEntries = creditsData.cast || [];
          } else {
            // ambiguous "by X" -> include director credits first, then cast (unique by id)
            const directors = (creditsData.crew || []).filter((c) => c.job === "Director");
            const cast = creditsData.cast || [];
            // combine directors + cast, dedupe by id
            const map = new Map();
            [...directors, ...cast].forEach((m) => {
              if (!map.has(m.id)) map.set(m.id, m);
            });
            movieEntries = Array.from(map.values());
          }

          // filter by genre if requested
          if (genreId) {
            movieEntries = movieEntries.filter((m) => {
              // credits from person endpoint usually include genre_ids
              if (Array.isArray(m.genre_ids)) return m.genre_ids.includes(genreId);
              // if not present, keep the item (we could fetch details but avoid extra calls)
              return true;
            });
          }

          // transform to standard TMDB-like result objects and sort by rating
          results = (movieEntries || [])
            .map((m) => ({
              id: m.id,
              title: m.title || m.original_title || m.name,
              poster_path: m.poster_path || null,
              release_date: m.release_date || m.release_date || "",
              vote_average: m.vote_average || 0,
              genre_ids: m.genre_ids || [],
              popularity: m.popularity || 0,
            }))
            .sort((a, b) => {
              // sort by vote_average then vote_count/popularity
              if ((b.vote_average || 0) !== (a.vote_average || 0))
                return (b.vote_average || 0) - (a.vote_average || 0);
              return (b.popularity || 0) - (a.popularity || 0);
            });

          meta = {
            type: genreId ? "genre+person" : "person",
            person: person.name,
            genre: foundGenre || null,
          };
        }
      }
    }

    // If results still empty (either not a person query or person not found / filtered out),
    // handle genre-only or keyword searches
    if (!results || results.length === 0) {
      if (genreId && !isPersonQuery) {
        // discover movies by genre (with some vote count threshold)
        const discover = await callWorker(
          "discover/movie",
          `with_genres=${genreId}&sort_by=vote_average.desc&vote_count.gte=50`
        );
        results = (discover.results || []).map((m) => ({
          id: m.id,
          title: m.title || m.original_title,
          poster_path: m.poster_path || null,
          release_date: m.release_date || "",
          vote_average: m.vote_average || 0,
          genre_ids: m.genre_ids || [],
          popularity: m.popularity || 0,
        }));
        meta = { type: "genre", genre: foundGenre };
      } else {
        // fallback: keyword/title search
        const cleanQuery = query.replace(/suggest|recommend|movies?|films?|like/gi, "").trim();
        // try search/movie
        const s = await callWorker("search/movie", `query=${encodeURIComponent(cleanQuery)}&include_adult=false&page=1`);
        results = (s.results || []).map((m) => ({
          id: m.id,
          title: m.title || m.original_title,
          poster_path: m.poster_path || null,
          release_date: m.release_date || "",
          vote_average: m.vote_average || 0,
          genre_ids: m.genre_ids || [],
          popularity: m.popularity || 0,
        }));

        // If no results, try search/multi (covers TV, people etc.)
        if ((!results || results.length === 0) && cleanQuery) {
          const sm = await callWorker("search/multi", `query=${encodeURIComponent(cleanQuery)}&page=1`);
          // convert multi results to movie-like entries where possible
          results = (sm.results || [])
            .filter((r) => r.media_type === "movie")
            .map((m) => ({
              id: m.id,
              title: m.title || m.name || m.original_title,
              poster_path: m.poster_path || null,
              release_date: m.release_date || m.first_air_date || "",
              vote_average: m.vote_average || 0,
              genre_ids: m.genre_ids || [],
              popularity: m.popularity || 0,
            }));
        }

        meta = { type: "keyword", keyword: cleanQuery || query };
      }
    }

    // Final: limit, ensure posters where possible, sort by rating & popularity
    results = (results || [])
      .filter(Boolean)
      .sort((a, b) => {
        if ((b.vote_average || 0) !== (a.vote_average || 0)) return (b.vote_average || 0) - (a.vote_average || 0);
        return (b.popularity || 0) - (a.popularity || 0);
      })
      .slice(0, 12);

    return res.json({ results, meta });
  } catch (err) {
    console.error("TMDB API error:", err.message);
    res.status(500).json({ error: "TMDB API error: " + err.message });
  }
});

module.exports = router;

const express = require("express");
const SpotifyWebApi = require("spotify-web-api-node");
require("dotenv").config();

const router = express.Router();

const spotifyApi = new SpotifyWebApi({
  clientId: process.env.SPOTIFY_CLIENT_ID,
  clientSecret: process.env.SPOTIFY_CLIENT_SECRET,
});

let tokenExpiresAt = 0;

// ===== Helper: Ensure Access Token =====
async function ensureAccessToken() {
  if (Date.now() < tokenExpiresAt - 60000) return;
  const data = await spotifyApi.clientCredentialsGrant();
  spotifyApi.setAccessToken(data.body.access_token);
  tokenExpiresAt = Date.now() + data.body.expires_in * 1000;
  console.log("🎧 Spotify token refreshed successfully!");
}

// ====== SEARCH ARTIST ======
router.get("/artist/:name", async (req, res) => {
  try {
    await ensureAccessToken();
    const artistName = req.params.name.trim();

    const result = await spotifyApi.searchArtists(artistName, { limit: 1 });
    const artist = result.body.artists.items[0];

    if (!artist) {
      console.warn("❌ Artist not found:", artistName);
      return res.status(404).json({ error: "Artist not found" });
    }

    res.json({
      id: artist.id,
      name: artist.name,
      image: artist.images?.[0]?.url || "",
      genres: artist.genres || [],
      popularity: artist.popularity,
    });
  } catch (error) {
    console.error("❌ Error fetching artist:", error.message);
    res.status(500).json({ error: "Spotify artist search failed" });
  }
});

// ====== GET ARTIST SONGS + GENRE FILTER ======
router.get("/artist/:id/toptracks", async (req, res) => {
  try {
    await ensureAccessToken();
    const { id } = req.params;
    const { genre } = req.query;

    const top = await spotifyApi.getArtistTopTracks(id, "IN");
    let tracks = top.body.tracks || [];

    if (!tracks.length) {
      console.warn("⚠️ No top tracks found, performing artist search...");
      const artistData = await spotifyApi.getArtist(id);
      const artistName = artistData.body.name;
      let query = `artist:${artistName}`;
      if (genre) query += ` genre:${genre}`;
      const search = await spotifyApi.searchTracks(query, {
        limit: 20,
        market: "IN",
      });
      tracks = search.body.tracks.items || [];
    }

    if (!tracks.length) {
      console.warn("⚠️ Broad artist search...");
      const artistData = await spotifyApi.getArtist(id);
      const artistName = artistData.body.name;
      const broad = await spotifyApi.searchTracks(artistName, {
        limit: 20,
        market: "IN",
      });
      tracks = broad.body.tracks.items || [];
    }

    res.json(tracks.slice(0, 10));
  } catch (error) {
    console.error("❌ Error fetching artist tracks:", error.message);
    res.status(500).json({ error: "Spotify artist tracks fetch failed" });
  }
});

// ====== POPULARITY FILTER ======
router.get("/popular", async (req, res) => {
  try {
    await ensureAccessToken();
    const { type } = req.query;

    let query = "top hits india";
    if (type === "least") query = "underrated indie";
    if (type === "new") query = "new music friday india";
    if (type === "trending") query = "spotify charts india";

    const search = await spotifyApi.searchTracks(query, { limit: 20, market: "IN" });
    let tracks = search.body.tracks.items;

    if (type === "most") tracks.sort((a, b) => b.popularity - a.popularity);
    if (type === "least") tracks.sort((a, b) => a.popularity - b.popularity);

    res.json(tracks.slice(0, 10));
  } catch (error) {
    console.error("❌ Error fetching popularity:", error.message);
    res.status(500).json({ error: "Spotify popularity fetch failed" });
  }
});

// ====== BLEND FEATURE ======
const BlendRequest = require("../models/BlendRequest");
const User = require("../models/User");
const BlendHistory = require("../models/BlendHistory"); // ✅ new import

// ===== Create Blend Request =====
router.post("/blend/request", async (req, res) => {
  try {
    const { requesterEmail, recipientEmail, message = "", artistSeeds = [] } = req.body;
    if (!requesterEmail || !recipientEmail)
      return res.status(400).json({ error: "Both requester and recipient emails required." });

    const br = new BlendRequest({
      requesterEmail,
      recipientEmail,
      message,
      artistSeeds,
      status: "pending",
    });

    await br.save();
    res.json({ message: "Blend request created", requestId: br._id });
  } catch (err) {
    console.error("❌ Error creating blend request:", err);
    res.status(500).json({ error: "Failed to create blend request" });
  }
});

// ===== Get Pending Requests =====
router.get("/blend/requests/:email", async (req, res) => {
  try {
    const { email } = req.params;
    const requests = await BlendRequest.find({
      recipientEmail: email,
      status: "pending",
    }).sort({ createdAt: -1 });
    res.json({ requests });
  } catch (err) {
    console.error("❌ Error fetching blend requests:", err);
    res.status(500).json({ error: "Failed to fetch requests" });
  }
});

// ===== Accept Blend Request =====
router.post("/blend/accept/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { acceptorEmail } = req.body;

    const br = await BlendRequest.findById(id);
    if (!br) return res.status(404).json({ error: "Request not found" });
    if (br.recipientEmail !== acceptorEmail)
      return res.status(403).json({ error: "Unauthorized recipient" });

    br.status = "accepted";
    br.acceptedAt = new Date();
    await br.save();

    const seeds = [];
    if (br.artistSeeds?.length) {
      seeds.push(...br.artistSeeds.slice(0, 3));
    } else {
      const u1 = await User.findOne({ email: br.requesterEmail });
      const u2 = await User.findOne({ email: br.recipientEmail });
      const a1 = (u1?.preferences?.music?.artists || []).slice(0, 3);
      const a2 = (u2?.preferences?.music?.artists || []).slice(0, 3);
      seeds.push(...a1, ...a2);
      if (!seeds.length) seeds.push("arijit singh", "ed sheeran", "the weeknd");
    }

    await ensureAccessToken();

    const artistIds = [];
    for (const s of seeds.slice(0, 5)) {
      try {
        if (typeof s === "string" && s.startsWith("spotify:artist:")) {
          artistIds.push(s.split(":").pop());
          continue;
        }
        const r = await spotifyApi.searchArtists(s, { limit: 1 });
        const art = r?.body?.artists?.items?.[0];
        if (art?.id) artistIds.push(art.id);
      } catch (e) {
        console.warn("⚠️ Artist resolution failed for:", s);
      }
    }

    let recommendations = [];
    if (artistIds.length) {
      try {
        const recs = await spotifyApi.getRecommendations({
          seed_artists: artistIds.slice(0, 3),
          limit: 20,
          market: "IN",
        });
        recommendations = recs?.body?.tracks || [];
      } catch (err) {
        console.warn("⚠️ Spotify recommendations failed", err?.message);
      }
    }

    if (!recommendations.length) {
      const query = seeds.slice(0, 3).join(" ");
      const search = await spotifyApi.searchTracks(query || "india", { limit: 20, market: "IN" });
      recommendations = search?.body?.tracks?.items || [];
    }

    // ✅ Save blend history for both users
    await BlendHistory.create({
      userEmail: br.requesterEmail,
      partnerEmail: br.recipientEmail,
      recommendations: recommendations.slice(0, 6),
    });
    await BlendHistory.create({
      userEmail: br.recipientEmail,
      partnerEmail: br.requesterEmail,
      recommendations: recommendations.slice(0, 6),
    });

    res.json({
      message: "Blend accepted",
      request: br,
      recommendations,
    });
  } catch (err) {
    console.error("❌ Error accepting blend:", err);
    res.status(500).json({ error: "Failed to accept blend" });
  }
});

// ===== Get All Requests (pending + accepted) =====
router.get("/blend/all/:email", async (req, res) => {
  try {
    const { email } = req.params;
    console.log("📨 Fetching all blend requests for:", email);
    const requests = await BlendRequest.find({ recipientEmail: email }).sort({ createdAt: -1 });
    res.json({ requests });
  } catch (err) {
    console.error("❌ Error fetching blend requests:", err);
    res.status(500).json({ error: "Failed to fetch blend requests" });
  }
});

// ===== Get Blend History =====
router.get("/blend/history/:email", async (req, res) => {
  try {
    const { email } = req.params;
    const history = await BlendHistory.find({ userEmail: email }).sort({ createdAt: -1 });
    res.json({ history });
  } catch (err) {
    console.error("❌ Error fetching blend history:", err);
    res.status(500).json({ error: "Failed to fetch blend history" });
  }
});

// ====== SIMPLE RECOMMENDATIONS (used by chatbot) ======
router.post("/recommendations", async (req, res) => {
  try {
    await ensureAccessToken();
    console.log("✅ Spotify token ready");

    const { artist = "", offset = 0 } = req.body || {};
    console.log("🎵 Incoming artist request:", artist, "Offset:", offset);

    if (!artist) {
      return res.status(400).json({ error: "Artist name is required" });
    }

    // 🎤 Search for the artist
    const artistRes = await spotifyApi.searchArtists(artist, { limit: 1 });
    const artistItem = artistRes.body.artists.items[0];
    if (!artistItem) {
      console.warn("⚠️ Artist not found:", artist);
      return res.status(404).json({ error: "Artist not found" });
    }

    // 🎧 Get artist's top tracks
    const topTracks = await spotifyApi.getArtistTopTracks(artistItem.id, "IN");
    const allTracks = topTracks.body.tracks || [];

    if (!allTracks.length) {
      console.warn("⚠️ No top tracks found for artist:", artist);
      return res.status(404).json({ error: "No songs found for this artist" });
    }

    // 🎯 Paginate results — 5 per batch
    const paginated = allTracks.slice(offset, offset + 5).map((t) => ({
      title: t.name,
      artist: t.artists.map((a) => a.name).join(", "),
      artwork: t.album.images?.[0]?.url || "",
      previewUrl: t.preview_url,
      externalUrl: t.external_urls.spotify,
    }));

    const nextOffset = offset + 5 < allTracks.length ? offset + 5 : null;

    console.log(
      `✅ Returning ${paginated.length} tracks for '${artist}', nextOffset: ${nextOffset}`
    );

    res.json({
      artist: artistItem.name,
      total: allTracks.length,
      offset,
      nextOffset,
      tracks: paginated,
    });
  } catch (error) {
    console.error("❌ Spotify artist recommendations error:", error.message);
    res.status(500).json({ error: "Spotify recommendations failed" });
  }
});

module.exports = router;

import mongoose from "mongoose";

const PreferencesSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  genres: { type: [String], default: [] },
  era: { type: String, default: "" },
  favorites: { type: String, default: "" }
});

const Preferences = mongoose.model("Preferences", PreferencesSchema);

export default Preferences;

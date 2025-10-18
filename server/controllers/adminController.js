const AdminService = require("../services/adminService");
const User = require("../models/User");
const Content = require("../models/content");
const Log = require("../models/Log"); // ✅ ensure Log model is imported
const Feedback = require("../models/Feedback");

// ===== EXISTING (unchanged) =====
exports.updateConfig = async (req, res, next) => {
  try {
    const result = await AdminService.updateConfig(req.body);
    res.json(result);
  } catch (err) {
    next(err);
  }
};

exports.reindex = async (req, res, next) => {
  try {
    const result = await AdminService.reindex();
    res.json(result);
  } catch (err) {
    next(err);
  }
};

// ===== NEW: dashboard endpoints (return raw data arrays/objects) =====

exports.getUsers = async (req, res, next) => {
  try {
    const users = await User.find({}, "email role status lastLogin createdAt").lean();
    return res.json(users);
  } catch (err) {
    console.error("❌ Failed to fetch users:", err);
    next(err);
  }
};

exports.getContent = async (req, res, next) => {
  try {
    const content = await Content.find({}, "title type category status createdAt").lean();
    return res.json(content);
  } catch (err) {
    console.error("❌ Failed to fetch content:", err);
    next(err);
  }
};

exports.getAnalytics = async (req, res, next) => {
  try {
    // Time ranges
    const now = new Date();
    const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    // Totals
    const totalUsers = await User.countDocuments();
    const totalLogs = await Log.countDocuments();

    // Weekly metrics
    const signupsThisWeek = await User.countDocuments({ createdAt: { $gte: oneWeekAgo } });
    const loginsThisWeek = await Log.countDocuments({ action: "login", timestamp: { $gte: oneWeekAgo } });

    // Role distribution (from Users collection, normalize and restrict to admin/user)
    const roleAgg = await User.aggregate([
      {
        $project: {
          role: {
            $cond: [
              { $ne: [ "$role", null ] },
              { $toLower: "$role" },
              "unknown",
            ],
          },
        },
      },
      { $match: { role: { $in: ["admin", "user"] } } },
      { $group: { _id: "$role", count: { $sum: 1 } } },
      { $project: { role: "$_id", count: 1, _id: 0 } },
    ]);

    // Daily logins for past 7 days (from Logs collection)
    const loginDailyAgg = await Log.aggregate([
      { $match: { action: "login", timestamp: { $gte: oneWeekAgo } } },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$timestamp" } },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    // Fill missing days (ensure 7 entries)
    const fillDates = () => {
      const map = new Map(loginDailyAgg.map((d) => [d._id, d.count]));
      const result = [];
      for (let i = 6; i >= 0; i--) {
        const d = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
        const key = d.toISOString().slice(0, 10);
        result.push({ date: key, count: Number(map.get(key) || 0) });
      }
      return result;
    };
    const loginsPerDay = fillDates();

    // Errors today
    const errorsToday = await Log.countDocuments({ action: "error", timestamp: { $gte: startOfToday } });

    return res.status(200).json({
      success: true,
      data: {
        totalUsers,
        signupsThisWeek,
        loginsThisWeek,
        loginsPerDay,
        roleCounts: roleAgg,
        totalLogs,
        errorsToday,
      },
    });
  } catch (err) {
    console.error("❌ Failed to fetch analytics:", err);
    return res.status(500).json({ success: false, message: "Failed to load analytics" });
  }
};

exports.getLogs = async (req, res, next) => {
  try {
    // If you have a Log model, use it to show the latest system actions
    const logs = await Log.find({}).sort({ timestamp: -1 }).limit(20).lean();
    return res.json(logs);
  } catch (err) {
    console.error("❌ Failed to fetch logs:", err);
    next(err);
  }
};

// ==========================================
// ✅ NEW: Feedback Management — list all feedback
// ==========================================
exports.getAllFeedback = async (req, res, next) => {
  try {
    const feedbacks = await Feedback.find({}).sort({ createdAt: -1 }).lean();

    // Map user emails to names (userId in feedback stores email in this app)
    const emails = Array.from(
      new Set(feedbacks.map((f) => f.userId).filter(Boolean))
    );
    const users = await User.find({ email: { $in: emails } }, "email name").lean();
    const userMap = new Map(users.map((u) => [u.email, u.name || ""]));

    const data = feedbacks.map((f) => {
      // If type carries a human-readable title (as sent from client), prefer it
      const likelyCategory = ["movie", "book", "music"]; // when type is just a category label
      const movieTitle = f.type && !likelyCategory.includes(String(f.type).toLowerCase())
        ? f.type
        : "";
      return {
        id: f._id,
        userEmail: f.userId || "",
        userName: userMap.get(f.userId) || "",
        movieTitle,
        contentId: f.contentId || "",
        type: f.type || "",
        feedback: f.feedback || "",
        review: f.review || "",
        createdAt: f.createdAt || null,
      };
    });

    return res.status(200).json({ success: true, data });
  } catch (err) {
    console.error("❌ Failed to fetch feedback:", err);
    return res.status(500).json({ success: false, message: "Failed to load feedback" });
  }
};

// ==========================================
// ✅ NEW: Unified Admin Stats (used by dashboard cards)
// ==========================================
exports.getAdminStats = async (req, res, next) => {
  try {
    // 1️⃣ Total counts
    const totalUsers = await User.countDocuments();
    const published = await Content.countDocuments({ status: "published" });
    const drafts = await Content.countDocuments({ status: "draft" });

    // 2️⃣ Analytics based on logs
    const now = new Date();
    const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    const loginsThisWeek = await Log.countDocuments({
      action: "login",
      timestamp: { $gte: oneWeekAgo },
    });

    const signupsThisWeek = await Log.countDocuments({
      action: "signup",
      timestamp: { $gte: oneWeekAgo },
    });

    const totalLogs = await Log.countDocuments();

    // 3️⃣ Optional: errors logged today
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);
    const errorsToday = await Log.countDocuments({
      action: "error",
      timestamp: { $gte: startOfToday },
    });

    // ✅ Return summary object
    return res.status(200).json({
      success: true,
      stats: {
        totalUsers,
        published,
        drafts,
        loginsThisWeek,
        signupsThisWeek,
        totalLogs,
        errorsToday,
      },
    });
  } catch (err) {
    console.error("❌ Failed to fetch admin stats:", err);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch admin statistics",
    });
  }
};
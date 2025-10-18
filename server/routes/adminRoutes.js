const router = require("express").Router();
const AdminController = require("../controllers/adminController");
const auth = require("../middlewares/auth");
const authorizeRoles = require("../middlewares/roleCheck");

// =============================
// 🧩 Existing Admin-Protected Routes
// =============================

// ⚙ Update algorithm config (Admin only)
router.put(
  "/algorithm/config",
  auth,
  authorizeRoles("admin"),
  AdminController.updateConfig
);

// 🔄 Reindex content (Admin only)
router.post(
  "/content/reindex",
  auth,
  authorizeRoles("admin"),
  AdminController.reindex
);

// =============================
// 🧠 Dashboard Data Routes (Admin only)
// =============================

// 👥 Get list of users
router.get(
  "/users",
  auth,
  authorizeRoles("admin"),
  AdminController.getUsers
);

// 🎬 Get content data
router.get(
  "/content",
  auth,
  authorizeRoles("admin"),
  AdminController.getContent
);

// 📊 Get analytics data
router.get(
  "/analytics",
  auth,
  authorizeRoles("admin"),
  AdminController.getAnalytics
);

// 🧾 Get system logs
router.get(
  "/logs",
  auth,
  authorizeRoles("admin"),
  AdminController.getLogs
);

// 📨 Get all feedback
router.get(
  "/feedback",
  auth,
  authorizeRoles("admin"),
  AdminController.getAllFeedback
);

// =============================
// 📈 Unified Stats Endpoint (Admin Dashboard)
// =============================
// This is the route your frontend dashboard calls for total counts.
router.get(
  "/stats",
  auth,
  authorizeRoles("admin"),
  AdminController.getAdminStats
);

module.exports = router;
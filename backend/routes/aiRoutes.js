const express = require("express");
const router = express.Router();
const { chatWithAI } = require("../controllers/aiController");
const { protect, authorize } = require("../middleware/authMiddleware");

// Student chat route
router.post("/chat", protect, authorize("student"), chatWithAI);

module.exports = router;

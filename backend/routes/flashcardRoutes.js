const express = require("express");
const router = express.Router();
const {
  getQuickQuiz,
  saveQuickQuizResponse,
} = require("../controllers/flashcardController");
const { protect, authorize } = require("../middleware/authMiddleware");

// GET /api/flashcards/quick?subject=&n=3
router.get("/quick", getQuickQuiz);

// POST /api/flashcards/responses - save quick quiz response (student)
router.post("/responses", protect, authorize("student"), saveQuickQuizResponse);

module.exports = router;

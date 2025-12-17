const asyncHandler = require("express-async-handler");
const FlashcardSet = require("../models/FlashcardSet");
const Tutor = require("../models/Tutor");

// @desc Tutor: create a flashcard set
// @route POST /api/tutor/flashcards
// @access Private/Tutor
const createFlashcardSet = asyncHandler(async (req, res) => {
  const tutor = await Tutor.findOne({ user: req.user._id });
  if (!tutor) return res.status(404).json({ message: "Tutor not found" });
  const { title, subject, cards } = req.body || {};
  if (!title || !Array.isArray(cards) || cards.length === 0)
    return res.status(400).json({ message: "title and cards required" });
  const set = await FlashcardSet.create({
    tutor: tutor._id,
    title,
    subject,
    cards,
  });
  res.json({ message: "Created", set });
});

// @desc Student: fetch random quick quiz (n questions)
// @route GET /api/flashcards/quick?subject=&n=3
// @access Public or Private
const getQuickQuiz = asyncHandler(async (req, res) => {
  const subjectParam = req.query.subject;
  const n = Math.max(
    1,
    Math.min(10, parseInt(String(req.query.n || "3"), 10) || 3)
  );

  let q = {};
  if (subjectParam) {
    // splits "Mathematics,Physics" into ["Mathematics","Physics"]
    const subjects = subjectParam.split(",").map((s) => s.trim()).filter(Boolean);
    if (subjects.length > 0) {
      q = { subject: { $in: subjects } };
    }
  }

  const sets = await FlashcardSet.find(q).lean();
  if (!sets || sets.length === 0) return res.json({ questions: [] });

  const allCards = [];
  for (const s of sets) {
    for (const c of s.cards || []) {
      // Include correctIndex for frontend validation
      allCards.push({
        question: c.question,
        choices: c.choices,
        correctIndex: c.correctIndex,
        subject: s.subject // Also helpful to know which subject it came from
      });
    }
  }

  // shuffle
  for (let i = allCards.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [allCards[i], allCards[j]] = [allCards[j], allCards[i]];
  }

  const questions = allCards.slice(0, n);
  res.json({ questions });
});

// @desc Student: save quick quiz responses
// @route POST /api/students/quick-quiz
// @access Private/Student
const saveQuickQuizResponse = asyncHandler(async (req, res) => {
  const studentDoc = await require("../models/Student").findOne({
    user: req.user._id,
  });
  if (!studentDoc)
    return res.status(404).json({ message: "Student not found" });
  const { answers } = req.body || {};
  if (!Array.isArray(answers))
    return res.status(400).json({ message: "answers array required" });
  const QuickQuizResponse = require("../models/QuickQuizResponse");
  const rec = await QuickQuizResponse.create({
    student: studentDoc._id,
    answers,
  });
  res.json({ message: "Saved", id: rec._id });
});

module.exports = { createFlashcardSet, getQuickQuiz, saveQuickQuizResponse };

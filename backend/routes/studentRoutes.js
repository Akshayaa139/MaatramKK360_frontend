const express = require("express");
const router = express.Router();
const {
  getStudentProfile,
  getMyClasses,
  getMyPerformance,
  getMyProgress,
  getStudentNotifications,
  getTutors,
} = require("../controllers/studentController");
const {
  getAssignmentsForStudent,
} = require("../controllers/assignmentController");
const { getTestsForStudent, submitQuiz } = require("../controllers/testController");
const { protect, authorize } = require("../middleware/authMiddleware");

router.get("/profile", protect, authorize("student"), getStudentProfile);
router.get("/classes", protect, authorize("student"), getMyClasses);
router.get("/performance", protect, authorize("student"), getMyPerformance);
router.get("/progress", protect, authorize("student"), getMyProgress);
router.get("/notifications", protect, authorize("student"), getStudentNotifications);
router.get(
  "/assignments/:classId",
  protect,
  authorize("student"),
  getAssignmentsForStudent
);
router.get(
  "/tests/:classId",
  protect,
  authorize("student"),
  getTestsForStudent
);
router.post("/tests/:testId/submit", protect, authorize("student"), submitQuiz);

router.get("/tutors", protect, authorize("student"), getTutors);

module.exports = router;

const express = require("express");
const router = express.Router();
const {
  getAllApplications,
  getApplicationById,
  updateApplicationStatus,
  exportApplications,
  getApplicationAnalytics,
} = require("../controllers/adminController");
const { getStudentsPendingPanel } = require("../controllers/studentController");
const {
  getAllTeleverifications,
  assignTeleverification,
  updateTeleverificationStatus,
  getTeleverificationAnalytics,
} = require("../controllers/televerificationController");
const {
  getAllPanels,
  createPanel,
  updatePanel,
  deletePanel,
  assignPanelists,
  getPanelAnalytics,
} = require("../controllers/panelController");
const {
  runAutoMap,
  autoMapSelectedApplications,
} = require("../controllers/adminController");
const {
  forceCreateClassForApplications,
} = require("../controllers/adminController");
const {
  getAllUsers,
  updateUserRole,
  deactivateUser,
  getUserAnalytics,
} = require("../controllers/userController");
const { protect, admin, authorize } = require("../middleware/authMiddleware");
const {
  getSelectedStudentsBySubject,
  getStudentDetails,
  getTutorDetails,
  getAllProgramStudents,
  getClassifiedStudents,
  repairStudentData,
  diagnoseSystem,
  getMeetingLogs
} = require("../controllers/adminController");
const { assignTutorToApplication } = require("../controllers/adminController");

// Repair data route (Temporary)
router.get("/repair-data", repairStudentData);
router.get("/diagnose", diagnoseSystem);

// Meeting Logs
router.route("/meetings/logs").get(protect, admin, getMeetingLogs);

// Application Management
router.route("/applications").get(protect, admin, getAllApplications);
router
  .route("/applications/:id")
  .get(protect, admin, getApplicationById)
  .put(protect, admin, updateApplicationStatus);

// Assign tutor to application
router.post(
  "/applications/:id/assign-tutor",
  protect,
  admin,
  assignTutorToApplication
);
router.route("/applications/export").get(protect, admin, exportApplications);
router
  .route("/applications/analytics")
  .get(protect, admin, getApplicationAnalytics);

// Tele-verification Management
router.route("/televerifications").get(protect, admin, getAllTeleverifications);
router
  .route("/televerifications/assign")
  .post(protect, admin, assignTeleverification);
router
  .route("/televerifications/:id")
  .put(protect, admin, updateTeleverificationStatus);
router
  .route("/televerifications/analytics")
  .get(protect, admin, getTeleverificationAnalytics);

// Panel Management
router
  .route("/panels")
  .get(protect, admin, getAllPanels)
  .post(protect, admin, createPanel);
router
  .route("/panels/:id")
  .put(protect, admin, updatePanel)
  .delete(protect, admin, deletePanel);
router
  .route("/panels/:id/assign-panelists")
  .post(protect, admin, assignPanelists);
router.route("/panels/analytics").get(protect, admin, getPanelAnalytics);

// User Management
router.route("/users").get(protect, admin, getAllUsers);
router.route("/users/:id/role").put(protect, admin, updateUserRole);
router.route("/users/:id/deactivate").put(protect, admin, deactivateUser);
router.route("/users/analytics").get(protect, admin, getUserAnalytics);

router
  .route("/selected-students")
  .get(protect, admin, getSelectedStudentsBySubject);
router.route("/students/:id/details").get(protect, admin, getStudentDetails);
router.route("/tutors/details").get(protect, admin, getTutorDetails);
router.route("/students/all").get(protect, admin, getAllProgramStudents);
router.route("/students/classified").get(protect, admin, getClassifiedStudents);
router
  .route("/students/pending-panel")
  .get(protect, admin, getStudentsPendingPanel);

// Auto-map selected students to tutors based on preferences and availability
// allow 'lead' to run this using admin middleware (admin accepts admin|lead)
router.post("/automap", protect, admin, runAutoMap);

// Auto-map selected applications (group by subject and assign tutors)
// allow 'lead' to run this using admin middleware
router.post(
  "/applications/automap",
  protect,
  admin,
  autoMapSelectedApplications
);

// force create class & assign applications (admin override for no_slot)
router.post(
  "/force-create-class",
  protect,
  admin,
  forceCreateClassForApplications
);

module.exports = router;

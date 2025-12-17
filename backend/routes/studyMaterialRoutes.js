const express = require("express");
const router = express.Router();
const {
  listStudyMaterials,
} = require("../controllers/studyMaterialController");

// public listing (optionally filtered by ?subject=)
router.get("/", listStudyMaterials);

module.exports = router;

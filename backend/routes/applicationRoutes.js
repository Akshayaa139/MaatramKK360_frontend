const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs-extra');
const { submitApplication, getApplicationStatus } = require('../controllers/applicationController');

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: async (req, file, cb) => {
    const uploadPath = path.join(__dirname, '..', 'uploads', 'applications');
    await fs.ensureDir(uploadPath);
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit
});

router.post('/submit', upload.fields([
  { name: 'photoFile', maxCount: 1 },
  { name: 'marksheetFile', maxCount: 1 },
  { name: 'incomeCertificateFile', maxCount: 1 },
  { name: 'idProofFile', maxCount: 1 }
]), submitApplication);

router.get('/status/:applicationId', getApplicationStatus);

module.exports = router;
const express = require('express');
const UploadController = require('./upload.contoller');
const upload = require('../../middlewares/upload');
const pdfUpload = require('../../middlewares/pdfUpload');
const router = express.Router();

const uploadController = new UploadController();

// Image Upload Routes
router.post(
  '/multiple',
  upload.array('images', 10),
  uploadController.uploadMultiple,
);

router.post('/single', upload.single('images'), uploadController.uploadSingle);

// PDF Upload Routes
router.post(
  '/pdf/single',
  pdfUpload.single('pdf'),
  uploadController.uploadPdfSingle,
);

router.post(
  '/pdf/multiple',
  pdfUpload.array('pdfs', 10),
  uploadController.uploadPdfMultiple,
);

module.exports = router;

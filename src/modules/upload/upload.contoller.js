const { asyncHandler } = require('../../middlewares/errorHandler');

class UploadController {
  uploadMultiple = asyncHandler(async (req, res) => {
    if (!req.files || req.files.length === 0) {
      return res
        .status(400)
        .json({ message: 'Please upload at least one image.' });
    }

    const imageUrls = req.files.map((file) => `/uploads/${file.filename}`);
    res.sendSuccess(imageUrls, 'Image get successfully');
  });

  uploadSingle = asyncHandler(async (req, res) => {
    if (!req.file) {
      return res.status(400).json({ message: 'Please upload an image.' });
    }
    const imageUrl = `/uploads/${req.file.filename}`;
    res.sendSuccess({ url: imageUrl }, 'Image uploaded successfully');
  });

  // PDF Upload Methods
  uploadPdfSingle = asyncHandler(async (req, res) => {
    if (!req.file) {
      return res.status(400).json({ message: 'Please upload a PDF file.' });
    }
    const pdfUrl = `/uploads/pdfs/${req.file.filename}`;
    res.sendSuccess(
      {
        url: pdfUrl,
        filename: req.file.originalname,
        size: req.file.size,
      },
      'PDF uploaded successfully',
    );
  });

  uploadPdfMultiple = asyncHandler(async (req, res) => {
    if (!req.files || req.files.length === 0) {
      return res
        .status(400)
        .json({ message: 'Please upload at least one PDF file.' });
    }

    const pdfUrls = req.files.map((file) => ({
      url: `/uploads/pdfs/${file.filename}`,
      filename: file.originalname,
      size: file.size,
    }));
    res.sendSuccess(pdfUrls, 'PDFs uploaded successfully');
  });
}

module.exports = UploadController;

// Rotas de documentos: registram endpoints e delegam para os controllers.
const express = require('express');
const { uploadSingleFile } = require('../middleware/uploadMiddleware');
const documentController = require('../controllers/documentController');

const router = express.Router();

router.post(
  '/upload',
  documentController.requireUser,
  uploadSingleFile,
  documentController.upload
);
router.get('/documents', documentController.requireUser, documentController.list);
router.get(
  '/documents/:id/download',
  documentController.requireUser,
  documentController.download
);

module.exports = router;

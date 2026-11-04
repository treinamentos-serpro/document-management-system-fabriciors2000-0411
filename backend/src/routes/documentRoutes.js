// Rotas de documentos: registram endpoints e middleware de upload (multer
// com diskStorage local) e delegam para os controllers.
const crypto = require('node:crypto');
const fs = require('node:fs');
const express = require('express');
const multer = require('multer');
const config = require('../config');
const documentController = require('../controllers/documentController');

// Garante a existência do diretório local de armazenamento.
fs.mkdirSync(config.storageDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, config.storageDir),
  // Nome físico gerado pelo sistema, independente do nome original (RNF-08).
  filename: (req, file, cb) => cb(null, crypto.randomUUID()),
});

const upload = multer({
  storage,
  limits: { fileSize: config.maxFileSizeBytes },
});

const router = express.Router();

router.post(
  '/upload',
  documentController.requireUser,
  upload.single('file'),
  documentController.upload
);
router.get('/documents', documentController.requireUser, documentController.list);
router.get(
  '/documents/:id/download',
  documentController.requireUser,
  documentController.download
);

module.exports = router;

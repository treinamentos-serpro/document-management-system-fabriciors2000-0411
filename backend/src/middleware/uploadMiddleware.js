// Middleware de upload (multer com diskStorage local). Centraliza os
// detalhes de armazenamento físico, mantendo as rotas só como composição.
const crypto = require('node:crypto');
const fs = require('node:fs');
const multer = require('multer');
const config = require('../config');

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

module.exports = { uploadSingleFile: upload.single('file') };

// Controllers: tratam entrada/saída HTTP e validação básica.
const path = require('node:path');
const documentService = require('../services/documentService');
const { ValidationError, DocumentNotFoundError } = require('../errors');

// Identidade provisória: charset restrito como defesa em profundidade (RF-05).
const USER_ID_PATTERN = /^[\w.-]{1,128}$/;
const MAX_ORIGINAL_NAME_LENGTH = 255;

// Exige X-User-Id com até 128 caracteres em charset restrito (RF-05).
function requireUser(req, res, next) {
  const rawUserId = req.get('X-User-Id');
  const userId = typeof rawUserId === 'string' ? rawUserId.trim() : '';
  if (!USER_ID_PATTERN.test(userId)) {
    throw new ValidationError(
      'Cabeçalho X-User-Id é obrigatório, com até 128 caracteres ' +
        '(letras, números, ".", "_" ou "-").'
    );
  }
  req.userId = userId;
  next();
}

// Remove diretórios e caracteres de controle do nome enviado pelo cliente.
function sanitizeOriginalName(rawName) {
  const name = path
    .basename(String(rawName ?? ''))
    .replace(/[\u0000-\u001f\u007f]/g, '')
    .trim();
  return name && name.length <= MAX_ORIGINAL_NAME_LENGTH ? name : null;
}

function upload(req, res) {
  if (!req.file) {
    throw new ValidationError('Arquivo é obrigatório no campo "file".');
  }
  const originalName = sanitizeOriginalName(req.file.originalname);
  if (!originalName) {
    throw new ValidationError(
      `Nome do arquivo é inválido ou excede ${MAX_ORIGINAL_NAME_LENGTH} caracteres.`
    );
  }
  const document = documentService.registerUpload({
    originalName,
    size: req.file.size,
    mimeType: req.file.mimetype,
    storageName: req.file.filename,
    owner: req.userId,
  });
  res.status(201).json({ document });
}

function list(req, res) {
  const documents = documentService.listDocuments(req.userId);
  res.json({ documents });
}

function download(req, res, next) {
  const { filePath, originalName } = documentService.getDownload(
    req.params.id,
    req.userId
  );
  res.download(filePath, originalName, (err) => {
    if (!err) return;
    if (res.headersSent) return next(err);
    // Arquivo pode ter sido removido entre a verificação e o envio.
    next(err.code === 'ENOENT' ? new DocumentNotFoundError() : err);
  });
}

module.exports = { requireUser, upload, list, download };

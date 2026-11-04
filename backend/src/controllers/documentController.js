// Controllers: tratam entrada/saída HTTP e validação básica.
const documentService = require('../services/documentService');
const { ValidationError, DocumentNotFoundError } = require('../errors');

const MAX_USER_ID_LENGTH = 128;

// Exige X-User-Id não vazio, aparado e com até 128 caracteres (RF-05).
function requireUser(req, res, next) {
  const rawUserId = req.get('X-User-Id');
  const userId = typeof rawUserId === 'string' ? rawUserId.trim() : '';
  if (!userId || userId.length > MAX_USER_ID_LENGTH) {
    throw new ValidationError(
      'Cabeçalho X-User-Id é obrigatório, não vazio e com até 128 caracteres.'
    );
  }
  req.userId = userId;
  next();
}

function upload(req, res) {
  if (!req.file) {
    throw new ValidationError('Arquivo é obrigatório no campo "file".');
  }
  const document = documentService.registerUpload({
    originalName: req.file.originalname,
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

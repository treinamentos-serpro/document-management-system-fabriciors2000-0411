// Regras de negócio dos documentos. Esta camada não conhece Express.
const crypto = require('node:crypto');
const config = require('../config');
const documentRepository = require('../repositories/documentRepository');
const { DocumentNotFoundError, QuotaExceededError } = require('../errors');

// Campos auxiliares (storageName, mimeType) nunca são expostos na API.
function toPublicDocument(document) {
  const { id, originalName, size, uploadedAt, owner } = document;
  return { id, originalName, size, uploadedAt, owner };
}

function registerUpload({ originalName, size, mimeType, storageName, owner }) {
  // Cota simples por dono: evita esgotamento de disco e de memória (DoS).
  if (documentRepository.countByOwner(owner) >= config.maxDocumentsPerOwner) {
    throw new QuotaExceededError();
  }
  const document = {
    id: crypto.randomUUID(),
    originalName,
    size,
    mimeType,
    storageName,
    owner,
    uploadedAt: new Date().toISOString(),
  };
  documentRepository.save(document);
  return toPublicDocument(document);
}

function listDocuments(owner) {
  return documentRepository.findAllByOwner(owner).map(toPublicDocument);
}

// A existência do arquivo físico é verificada no envio (ENOENT tratado no
// controller), evitando checagem redundante sujeita a corrida (TOCTOU).
function getDownload(id, owner) {
  const document = documentRepository.findByIdAndOwner(id, owner);
  if (!document) {
    throw new DocumentNotFoundError();
  }
  return {
    filePath: documentRepository.resolveFilePath(document.storageName),
    originalName: document.originalName,
  };
}

module.exports = { registerUpload, listDocuments, getDownload };

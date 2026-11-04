// Repositório de documentos: metadados em memória e acesso aos arquivos
// gravados no filesystem local. Os metadados são perdidos ao reiniciar.
const fs = require('node:fs');
const path = require('node:path');
const config = require('../config');

const documents = new Map();

function save(document) {
  documents.set(document.id, document);
  return document;
}

function findAllByOwner(owner) {
  return [...documents.values()].filter((document) => document.owner === owner);
}

function findByIdAndOwner(id, owner) {
  const document = documents.get(id);
  return document && document.owner === owner ? document : null;
}

// O caminho físico é sempre derivado do nome interno gerado pelo sistema,
// nunca do nome original enviado pelo cliente.
function resolveFilePath(storageName) {
  return path.join(config.storageDir, storageName);
}

function fileExists(storageName) {
  return fs.existsSync(resolveFilePath(storageName));
}

module.exports = { save, findAllByOwner, findByIdAndOwner, resolveFilePath, fileExists };

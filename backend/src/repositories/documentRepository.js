// Repositório de documentos: metadados em memória e acesso aos arquivos
// gravados no filesystem local. Os metadados são perdidos ao reiniciar.
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

function countByOwner(owner) {
  return findAllByOwner(owner).length;
}

// O caminho físico é sempre derivado do nome interno gerado pelo sistema,
// nunca do nome original enviado pelo cliente. Defesa em profundidade: garante
// que o caminho resolvido permanece dentro do diretório de armazenamento
// (previne path traversal caso os metadados deixem de ser confiáveis).
function resolveFilePath(storageName) {
  const baseDir = path.resolve(config.storageDir);
  const resolved = path.resolve(baseDir, path.basename(String(storageName)));
  if (!resolved.startsWith(baseDir + path.sep)) {
    throw new Error('Nome de armazenamento inválido.');
  }
  return resolved;
}

module.exports = { save, findAllByOwner, findByIdAndOwner, countByOwner, resolveFilePath };

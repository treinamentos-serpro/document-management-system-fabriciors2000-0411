// Configuração via variáveis de ambiente (12-Factor App).
//
// Padrões documentados:
//   PORT                    -> 3000
//   STORAGE_DIR             -> backend/storage (sempre local à aplicação)
//   MAX_FILE_SIZE_BYTES     -> 10 MiB
//   MAX_DOCUMENTS_PER_OWNER -> 100
const path = require('node:path');

const DEFAULT_PORT = 3000;
const DEFAULT_MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024;
const DEFAULT_MAX_DOCUMENTS_PER_OWNER = 100;

// Falha cedo quando a variável existe mas não é um inteiro positivo.
function toPositiveInt(name, fallback) {
  const raw = process.env[name];
  if (raw === undefined || raw === '') return fallback;
  const value = Number(raw);
  if (!Number.isInteger(value) || value <= 0) {
    throw new Error(`Variável de ambiente ${name} deve ser um inteiro positivo.`);
  }
  return value;
}

const config = {
  port: toPositiveInt('PORT', DEFAULT_PORT),
  storageDir: process.env.STORAGE_DIR || path.resolve(__dirname, '..', 'storage'),
  maxFileSizeBytes: toPositiveInt('MAX_FILE_SIZE_BYTES', DEFAULT_MAX_FILE_SIZE_BYTES),
  maxDocumentsPerOwner: toPositiveInt(
    'MAX_DOCUMENTS_PER_OWNER',
    DEFAULT_MAX_DOCUMENTS_PER_OWNER
  ),
};

module.exports = config;

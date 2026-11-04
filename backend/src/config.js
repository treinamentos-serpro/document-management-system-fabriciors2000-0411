// Configuração via variáveis de ambiente (12-Factor App).
//
// Padrões documentados:
//   PORT                -> 3000
//   STORAGE_DIR         -> backend/storage (sempre local à aplicação)
//   MAX_FILE_SIZE_BYTES -> 10 MiB
const path = require('node:path');

const DEFAULT_MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024;

const config = {
  port: Number(process.env.PORT) || 3000,
  storageDir: process.env.STORAGE_DIR || path.resolve(__dirname, '..', 'storage'),
  maxFileSizeBytes:
    Number(process.env.MAX_FILE_SIZE_BYTES) || DEFAULT_MAX_FILE_SIZE_BYTES,
};

module.exports = config;

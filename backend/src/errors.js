// Erros de aplicação com códigos estáveis, sem expor detalhes internos.

class AppError extends Error {
  constructor(statusCode, code, message) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
  }
}

class ValidationError extends AppError {
  constructor(message) {
    super(400, 'VALIDATION_ERROR', message);
  }
}

class DocumentNotFoundError extends AppError {
  constructor(message = 'Documento não encontrado.') {
    super(404, 'DOCUMENT_NOT_FOUND', message);
  }
}

module.exports = { AppError, ValidationError, DocumentNotFoundError };

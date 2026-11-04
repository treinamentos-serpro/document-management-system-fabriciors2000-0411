// Servidor backend do Document Management System.
//
// Camadas (fluxo de dependência): routes -> controllers -> services ->
// repositories. Uploads são gravados no filesystem local da aplicação usando
// multer com diskStorage; metadados ficam em memória nesta fase.

const fs = require('node:fs');
const express = require('express');
const multer = require('multer');
const config = require('./config');
const documentRoutes = require('./routes/documentRoutes');
const { AppError } = require('./errors');

const app = express();
const PORT = config.port;

// Endpoint de verificação de saúde.
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.use(documentRoutes);

// Tratador central de erros: respostas JSON consistentes, sem expor caminhos
// locais, stack traces ou detalhes internos.
app.use((err, req, res, next) => {
  if (res.headersSent) {
    return next(err);
  }
  // Remove o arquivo gravado pelo multer quando o upload falha após a escrita,
  // evitando arquivos órfãos no diretório de armazenamento.
  if (req.file?.path) {
    fs.unlink(req.file.path, () => {});
  }
  // Drena o corpo pendente (ex.: multipart rejeitado antes do multer) para
  // evitar que a conexão seja derrubada antes do cliente receber a resposta.
  req.resume();
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(413).json({
        error: {
          code: 'FILE_TOO_LARGE',
          message: 'Arquivo excede o tamanho máximo permitido.',
        },
      });
    }
    return res.status(400).json({
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Falha no processamento do upload.',
      },
    });
  }
  if (err instanceof AppError) {
    return res
      .status(err.statusCode)
      .json({ error: { code: err.code, message: err.message } });
  }
  console.error(err);
  res.status(500).json({
    error: { code: 'INTERNAL_ERROR', message: 'Erro interno do servidor.' },
  });
});

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`DMS backend ouvindo na porta ${PORT}`);
  });
}

module.exports = app;

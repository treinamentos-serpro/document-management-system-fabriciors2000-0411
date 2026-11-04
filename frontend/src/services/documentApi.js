// Cliente de API do Document Management System.
// Consome o backend via fetch usando o prefixo /api (proxy do Vite).
// Todas as rotas exigem o cabeçalho X-User-Id (identidade provisória).

const API_PREFIX = '/api';

// Classe de erro da API: expõe mensagem segura e código estável do backend.
export class ApiError extends Error {
  constructor(message, code, status) {
    super(message);
    this.name = 'ApiError';
    this.code = code;
    this.status = status;
  }
}

// Extrai a mensagem de erro do formato JSON padrão { error: { code, message } }.
async function toApiError(response) {
  let code = 'UNKNOWN_ERROR';
  let message = 'Falha na comunicação com o servidor.';
  try {
    const body = await response.json();
    if (body?.error) {
      code = body.error.code ?? code;
      message = body.error.message ?? message;
    }
  } catch {
    // Resposta sem corpo JSON: mantém a mensagem genérica.
  }
  return new ApiError(message, code, response.status);
}

async function request(path, userId, options = {}) {
  let response;
  try {
    response = await fetch(`${API_PREFIX}${path}`, {
      ...options,
      headers: { 'X-User-Id': userId, ...options.headers },
    });
  } catch (error) {
    // Abortos propagam para o chamador decidir; falhas de rede ganham
    // mensagem amigável em vez do "Failed to fetch" do navegador.
    if (error.name === 'AbortError') throw error;
    throw new ApiError('Não foi possível conectar ao servidor.', 'NETWORK_ERROR', 0);
  }
  if (!response.ok) {
    throw await toApiError(response);
  }
  return response;
}

// POST /upload — envia um arquivo no campo "file" e retorna o documento criado.
export async function uploadDocument(file, userId) {
  const formData = new FormData();
  formData.append('file', file);
  const response = await request('/upload', userId, {
    method: 'POST',
    body: formData,
  });
  const { document } = await response.json();
  return document;
}

// GET /documents — lista os documentos do usuário informado.
// Aceita um AbortSignal para cancelar requisições obsoletas.
export async function listDocuments(userId, { signal } = {}) {
  const response = await request('/documents', userId, { signal });
  const { documents } = await response.json();
  return documents;
}

// Extrai o nome do arquivo do cabeçalho Content-Disposition, se presente.
function parseFileName(contentDisposition) {
  if (!contentDisposition) return null;
  const utf8Match = contentDisposition.match(/filename\*=UTF-8''([^;]+)/i);
  if (utf8Match) return decodeURIComponent(utf8Match[1]);
  const plainMatch = contentDisposition.match(/filename="?([^";]+)"?/i);
  return plainMatch ? plainMatch[1] : null;
}

// GET /documents/:id/download — baixa o conteúdo binário do documento.
// Retorna o blob e o nome sugerido para download.
export async function downloadDocument(id, userId) {
  const response = await request(
    `/documents/${encodeURIComponent(id)}/download`,
    userId
  );
  const blob = await response.blob();
  const fileName = parseFileName(response.headers.get('Content-Disposition'));
  return { blob, fileName };
}

import { useEffect, useState } from 'react';
import DownloadButton from './DownloadButton.jsx';
import ErrorMessage from './ErrorMessage.jsx';

// Formata o tamanho em bytes para leitura humana.
function formatSize(bytes) {
  if (!Number.isFinite(bytes) || bytes < 0) return '—';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 ** 2) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 ** 3) return `${(bytes / 1024 ** 2).toFixed(1)} MB`;
  return `${(bytes / 1024 ** 3).toFixed(1)} GB`;
}

// Formata a data ISO 8601 para o locale do navegador.
function formatDate(isoDate) {
  return new Date(isoDate).toLocaleString();
}

// Lista os documentos do usuário com botão de download por item (RF-10).
// O carregamento é controlado pelo componente pai para evitar duplicação.
export default function DocumentList({ documents, loading, error, userId }) {
  const [downloadError, setDownloadError] = useState(null);

  // Erro de download anterior não vale para outro usuário.
  useEffect(() => {
    setDownloadError(null);
  }, [userId]);

  return (
    <section>
      <h2>Meus documentos</h2>
      {loading && <p role="status">Carregando documentos…</p>}
      <ErrorMessage message={error} />
      <ErrorMessage message={downloadError} />
      {!loading && !error && documents.length === 0 && (
        <p>Nenhum documento enviado ainda.</p>
      )}
      {!loading && !error && documents.length > 0 && (
        <table aria-label="Documentos enviados">
          <thead>
            <tr>
              <th scope="col" style={{ textAlign: 'left' }}>Nome</th>
              <th scope="col" style={{ textAlign: 'right' }}>Tamanho</th>
              <th scope="col" style={{ textAlign: 'left' }}>Enviado em</th>
              <th scope="col" style={{ textAlign: 'left' }}>Ações</th>
            </tr>
          </thead>
          <tbody>
            {documents.map((doc) => (
              <tr key={doc.id}>
                <td>{doc.originalName}</td>
                <td style={{ textAlign: 'right' }}>{formatSize(doc.size)}</td>
                <td>{formatDate(doc.uploadedAt)}</td>
                <td>
                  <DownloadButton
                    documentId={doc.id}
                    originalName={doc.originalName}
                    userId={userId}
                    onError={setDownloadError}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </section>
  );
}

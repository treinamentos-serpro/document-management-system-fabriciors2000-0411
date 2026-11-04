import { useState } from 'react';
import DownloadButton from './DownloadButton.jsx';

// Formata o tamanho em bytes para leitura humana.
function formatSize(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

// Formata a data ISO 8601 para o locale do navegador.
function formatDate(isoDate) {
  return new Date(isoDate).toLocaleString();
}

// Lista os documentos do usuário com botão de download por item (RF-10).
// O carregamento é controlado pelo componente pai para evitar duplicação.
export default function DocumentList({ documents, loading, error, userId }) {
  const [downloadError, setDownloadError] = useState(null);

  return (
    <section>
      <h2>Meus documentos</h2>
      {loading && <p>Carregando documentos…</p>}
      {error && <p style={{ color: 'crimson' }}>{error}</p>}
      {downloadError && <p style={{ color: 'crimson' }}>{downloadError}</p>}
      {!loading && !error && documents.length === 0 && (
        <p>Nenhum documento enviado ainda.</p>
      )}
      {!loading && !error && documents.length > 0 && (
        <table>
          <thead>
            <tr>
              <th style={{ textAlign: 'left' }}>Nome</th>
              <th style={{ textAlign: 'right' }}>Tamanho</th>
              <th style={{ textAlign: 'left' }}>Enviado em</th>
              <th />
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

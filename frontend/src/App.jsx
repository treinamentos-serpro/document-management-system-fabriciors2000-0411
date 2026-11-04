import { useCallback, useEffect, useState } from 'react';
import UploadComponent from './components/UploadComponent.jsx';
import DocumentList from './components/DocumentList.jsx';
import { listDocuments } from './services/documentApi.js';

const DEFAULT_USER_ID = 'demo-user';

// Componente raiz: controla a identidade provisória (X-User-Id) e o estado da
// listagem, compartilhado entre upload e lista para evitar duplicação.
export default function App() {
  const [userId, setUserId] = useState(DEFAULT_USER_ID);
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const trimmedUserId = userId.trim();

  const loadDocuments = useCallback(
    async (signal) => {
      if (!trimmedUserId) {
        setDocuments([]);
        setError('Informe um identificador de usuário.');
        return;
      }
      setLoading(true);
      setError(null);
      try {
        setDocuments(await listDocuments(trimmedUserId, { signal }));
      } catch (err) {
        // Requisição cancelada por uma mais recente: ignora silenciosamente.
        if (err.name === 'AbortError') return;
        setError(err.message);
      } finally {
        if (!signal?.aborted) setLoading(false);
      }
    },
    [trimmedUserId]
  );

  // Cancela a requisição anterior quando o usuário muda, evitando que uma
  // resposta lenta e antiga sobrescreva a listagem atual.
  useEffect(() => {
    const controller = new AbortController();
    loadDocuments(controller.signal);
    return () => controller.abort();
  }, [loadDocuments]);

  return (
    <main style={{ fontFamily: 'system-ui, sans-serif', padding: '2rem' }}>
      <h1>Document Management System</h1>

      <section>
        <label>
          Usuário:{' '}
          <input
            type="text"
            value={userId}
            maxLength={128}
            onChange={(event) => setUserId(event.target.value)}
          />
        </label>
      </section>

      <UploadComponent userId={trimmedUserId} onUploaded={() => loadDocuments()} />

      <DocumentList
        documents={documents}
        loading={loading}
        error={error}
        userId={trimmedUserId}
      />
    </main>
  );
}

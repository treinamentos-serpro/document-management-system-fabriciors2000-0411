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

  const loadDocuments = useCallback(async () => {
    if (!userId.trim()) {
      setDocuments([]);
      setError('Informe um identificador de usuário.');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      setDocuments(await listDocuments(userId.trim()));
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    loadDocuments();
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

      <UploadComponent userId={userId.trim()} onUploaded={loadDocuments} />

      <DocumentList
        documents={documents}
        loading={loading}
        error={error}
        userId={userId.trim()}
      />
    </main>
  );
}

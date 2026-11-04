import { useRef, useState } from 'react';
import { uploadDocument } from '../services/documentApi.js';
import ErrorMessage from './ErrorMessage.jsx';

// Componente de upload: seleciona um arquivo, envia ao backend e informa o
// resultado. Notifica o pai via onUploaded para atualizar a listagem (RF-09).
export default function UploadComponent({ userId, onUploaded }) {
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [feedback, setFeedback] = useState(null);
  const inputRef = useRef(null);

  function handleFileChange(event) {
    setFile(event.target.files[0] ?? null);
    setFeedback(null);
  }

  async function handleSubmit(event) {
    event.preventDefault();
    if (!file) {
      setFeedback({ type: 'error', message: 'Selecione um arquivo para enviar.' });
      return;
    }
    setUploading(true);
    setFeedback(null);
    try {
      const document = await uploadDocument(file, userId);
      setFeedback({
        type: 'success',
        message: `Documento "${document.originalName}" enviado com sucesso.`,
      });
      setFile(null);
      if (inputRef.current) inputRef.current.value = '';
      onUploaded?.(document);
    } catch (error) {
      setFeedback({ type: 'error', message: error.message });
    } finally {
      setUploading(false);
    }
  }

  return (
    <section>
      <h2>Enviar documento</h2>
      <form onSubmit={handleSubmit}>
        <label>
          Arquivo:{' '}
          <input
            ref={inputRef}
            type="file"
            onChange={handleFileChange}
            disabled={uploading}
          />
        </label>
        <button type="submit" disabled={uploading || !file}>
          {uploading ? 'Enviando…' : 'Enviar'}
        </button>
      </form>
      {feedback?.type === 'error' && <ErrorMessage message={feedback.message} />}
      {feedback?.type === 'success' && (
        <p role="status" style={{ color: 'green' }}>
          {feedback.message}
        </p>
      )}
    </section>
  );
}

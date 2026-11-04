import { useState } from 'react';
import { downloadDocument } from '../services/documentApi.js';

// Botão de download: baixa o conteúdo do documento via API e dispara o
// download no navegador com o nome original (RF-10).
export default function DownloadButton({ documentId, originalName, userId, onError }) {
  const [downloading, setDownloading] = useState(false);

  async function handleDownload() {
    setDownloading(true);
    try {
      const { blob, fileName } = await downloadDocument(documentId, userId);
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = fileName ?? originalName;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
    } catch (error) {
      onError?.(error.message);
    } finally {
      setDownloading(false);
    }
  }

  return (
    <button type="button" onClick={handleDownload} disabled={downloading}>
      {downloading ? 'Baixando…' : 'Baixar'}
    </button>
  );
}

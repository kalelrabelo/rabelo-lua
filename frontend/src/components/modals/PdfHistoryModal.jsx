import React from 'react';
import { useModal } from '../../contexts/ModalContext';

const PdfHistoryModal = ({ data }) => {
  const { closeModal } = useModal();

  if (!data || data.length === 0) {
    return (
      <div className="modal-overlay">
        <div className="modal-content">
          <h2>Histórico de PDFs</h2>
          <p>Nenhum PDF encontrado no histórico.</p>
          <button onClick={closeModal}>Fechar</button>
        </div>
      </div>
    );
  }

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <h2>Histórico de PDFs</h2>
        <div className="pdf-history-list">
          {data.map((pdf) => (
            <div key={pdf.id} className="pdf-history-item">
              <h3>{pdf.filename}</h3>
              <p>Comando: {pdf.command}</p>
              <p>Gerado em: {pdf.generated_at}</p>
              {pdf.download_url && (
                <a href={pdf.download_url} target="_blank" rel="noopener noreferrer" download>
                  Baixar PDF
                </a>
              )}
            </div>
          ))}
        </div>
        <button onClick={closeModal}>Fechar</button>
      </div>
    </div>
  );
};

export default PdfHistoryModal;



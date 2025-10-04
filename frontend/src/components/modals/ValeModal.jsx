import React from 'react';
import { useModal } from '@/contexts/ModalContext';

const ValeModal = () => {
  const { modalState, closeModal } = useModal();
  const { isOpen, data, type } = modalState;

  if (!isOpen || type !== 'vale') return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-lg shadow-lg w-1/2">
        <h2 className="text-2xl font-bold mb-4">Vales da Semana</h2>
        <pre>{JSON.stringify(data, null, 2)}</pre>
        <button onClick={closeModal} className="mt-4 px-4 py-2 bg-blue-500 text-white rounded">Fechar</button>
      </div>
    </div>
  );
};

export default ValeModal;


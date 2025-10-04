import React from 'react';
import { useModal } from '@/contexts/ModalContext';

const EncomendasModal = () => {
  const { modalState, closeModal } = useModal();
  const { isOpen, data, type } = modalState;

  if (!isOpen || type !== 'encomendas') return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-lg shadow-lg w-1/2">
        <h2 className="text-2xl font-bold mb-4">Encomendas</h2>
        {data && data.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full bg-white border border-gray-200">
              <thead>
                <tr>
                  <th className="py-2 px-4 border-b">ID</th>
                  <th className="py-2 px-4 border-b">Cliente</th>
                  <th className="py-2 px-4 border-b">Data</th>
                  <th className="py-2 px-4 border-b">Status</th>
                  <th className="py-2 px-4 border-b">Valor Total</th>
                </tr>
              </thead>
              <tbody>
                {data.map((encomenda) => (
                  <tr key={encomenda.id}>
                    <td className="py-2 px-4 border-b text-center">{encomenda.id}</td>
                    <td className="py-2 px-4 border-b text-center">{encomenda.cliente}</td>
                    <td className="py-2 px-4 border-b text-center">{new Date(encomenda.data).toLocaleDateString()}</td>
                    <td className="py-2 px-4 border-b text-center">{encomenda.status}</td>
                    <td className="py-2 px-4 border-b text-center">R$ {encomenda.valor_total.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p>Nenhuma encomenda encontrada para o período solicitado.</p>
        )}
        <button onClick={closeModal} className="mt-4 px-4 py-2 bg-blue-500 text-white rounded">Fechar</button>
      </div>
    </div>
  );
};

export default EncomendasModal;


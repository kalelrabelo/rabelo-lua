import React from 'react';
import { X } from 'lucide-react';

const VendasModal = ({ isOpen, onClose, vendas }) => {
  if (!isOpen) return null;

  const total = vendas?.reduce((sum, venda) => sum + (venda.valor || 0), 0) || 0;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-4xl max-h-[80vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold text-gray-800">💰 Vendas</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <X size={24} />
          </button>
        </div>
        
        <div className="mb-4 p-4 bg-green-50 rounded-lg">
          <p className="text-lg font-semibold text-green-800">
            Total: R$ {total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </p>
          <p className="text-sm text-green-600">
            {vendas?.length || 0} vendas realizadas
          </p>
        </div>
        
        <div className="grid gap-4">
          {vendas && vendas.length > 0 ? (
            vendas.map((venda, index) => (
              <div key={venda.id || index} className="bg-gray-50 p-4 rounded-lg border">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-600">Produto:</label>
                    <p className="text-lg font-semibold text-gray-800">{venda.produto}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">Valor:</label>
                    <p className="text-green-600 font-semibold">
                      R$ {(venda.valor || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">Data:</label>
                    <p className="text-gray-800">{venda.data}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">Vendedor:</label>
                    <p className="text-blue-600 font-medium">{venda.vendedor}</p>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-8 text-gray-500">
              Nenhuma venda encontrada
            </div>
          )}
        </div>
        
        <div className="mt-6 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
};

export default VendasModal;


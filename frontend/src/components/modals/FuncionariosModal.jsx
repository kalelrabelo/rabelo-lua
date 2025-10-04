import React from 'react';
import { X } from 'lucide-react';

const FuncionariosModal = ({ isOpen, onClose, funcionarios }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-4xl max-h-[80vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold text-gray-800">👥 Funcionários da Empresa</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <X size={24} />
          </button>
        </div>
        
        <div className="grid gap-4">
          {funcionarios && funcionarios.length > 0 ? (
            funcionarios.map((funcionario, index) => (
              <div key={funcionario.id || index} className="bg-gray-50 p-4 rounded-lg border">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-600">Nome de Usuário:</label>
                    <p className="text-lg font-semibold text-gray-800">{funcionario.nome_usuario}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">ID:</label>
                    <p className="text-gray-800">#{funcionario.id}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">Status:</label>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      funcionario.status === 'ativo' 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {funcionario.status}
                    </span>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-8 text-gray-500">
              Nenhum funcionário encontrado
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

export default FuncionariosModal;


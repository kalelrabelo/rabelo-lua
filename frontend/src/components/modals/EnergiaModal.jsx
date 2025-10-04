import React from 'react';
import { X, TrendingUp, TrendingDown, Zap } from 'lucide-react';

const EnergiaModal = ({ isOpen, onClose, energiaData }) => {
  if (!isOpen) return null;

  const mesAnterior = energiaData?.mes_anterior || {};
  const mesAtual = energiaData?.mes_atual || {};
  
  const diffConsumo = (mesAtual.consumo || 0) - (mesAnterior.consumo || 0);
  const diffCusto = (mesAtual.custo || 0) - (mesAnterior.custo || 0);
  const percConsumo = mesAnterior.consumo ? (diffConsumo / mesAnterior.consumo * 100) : 0;
  const percCusto = mesAnterior.custo ? (diffCusto / mesAnterior.custo * 100) : 0;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-4xl max-h-[80vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            <Zap className="text-yellow-500" size={28} />
            Consumo de Energia
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <X size={24} />
          </button>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          {/* Mês Anterior */}
          <div className="bg-blue-50 p-4 rounded-lg">
            <h3 className="text-lg font-semibold text-blue-800 mb-3">
              {mesAnterior.periodo || 'Mês Anterior'}
            </h3>
            <div className="space-y-2">
              <div>
                <label className="text-sm font-medium text-blue-600">Consumo:</label>
                <p className="text-xl font-bold text-blue-800">
                  {(mesAnterior.consumo || 0).toLocaleString()} kWh
                </p>
              </div>
              <div>
                <label className="text-sm font-medium text-blue-600">Custo:</label>
                <p className="text-xl font-bold text-blue-800">
                  R$ {(mesAnterior.custo || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </p>
              </div>
            </div>
          </div>

          {/* Mês Atual */}
          <div className="bg-green-50 p-4 rounded-lg">
            <h3 className="text-lg font-semibold text-green-800 mb-3">
              {mesAtual.periodo || 'Mês Atual'}
            </h3>
            <div className="space-y-2">
              <div>
                <label className="text-sm font-medium text-green-600">Consumo:</label>
                <p className="text-xl font-bold text-green-800">
                  {(mesAtual.consumo || 0).toLocaleString()} kWh
                </p>
              </div>
              <div>
                <label className="text-sm font-medium text-green-600">Custo:</label>
                <p className="text-xl font-bold text-green-800">
                  R$ {(mesAtual.custo || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Comparação */}
        <div className="bg-gray-50 p-4 rounded-lg mb-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-3">📊 Comparação</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center gap-3">
              {diffConsumo >= 0 ? (
                <TrendingUp className="text-red-500" size={24} />
              ) : (
                <TrendingDown className="text-green-500" size={24} />
              )}
              <div>
                <p className="text-sm font-medium text-gray-600">Consumo:</p>
                <p className={`text-lg font-bold ${diffConsumo >= 0 ? 'text-red-600' : 'text-green-600'}`}>
                  {diffConsumo >= 0 ? '+' : ''}{diffConsumo} kWh ({percConsumo >= 0 ? '+' : ''}{percConsumo.toFixed(1)}%)
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              {diffCusto >= 0 ? (
                <TrendingUp className="text-red-500" size={24} />
              ) : (
                <TrendingDown className="text-green-500" size={24} />
              )}
              <div>
                <p className="text-sm font-medium text-gray-600">Custo:</p>
                <p className={`text-lg font-bold ${diffCusto >= 0 ? 'text-red-600' : 'text-green-600'}`}>
                  R$ {diffCusto >= 0 ? '+' : ''}{diffCusto.toFixed(2)} ({percCusto >= 0 ? '+' : ''}{percCusto.toFixed(1)}%)
                </p>
              </div>
            </div>
          </div>
        </div>
        
        <div className="flex justify-end">
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

export default EnergiaModal;


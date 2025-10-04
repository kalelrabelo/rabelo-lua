import React, { useState, useEffect } from 'react';
import { AlertTriangle, X, RefreshCw, Bug, Clock, MapPin, Lightbulb, Trash2 } from 'lucide-react';

const ErrorLogger = () => {
  const [errors, setErrors] = useState([]);
  const [filter, setFilter] = useState('all'); // all, api, javascript, warning
  const [isExpanded, setIsExpanded] = useState(false);

  useEffect(() => {
    // Carregar erros do localStorage
    const savedErrors = localStorage.getItem('systemErrors');
    if (savedErrors) {
      try {
        setErrors(JSON.parse(savedErrors));
      } catch (e) {
        console.error('Erro ao carregar logs salvos:', e);
      }
    }

    // Escutar novos erros
    const handleNewError = (event) => {
      const errorData = event.detail;
      setErrors(prev => {
        const newErrors = [errorData, ...prev].slice(0, 100); // Manter apenas os últimos 100 erros
        localStorage.setItem('systemErrors', JSON.stringify(newErrors));
        return newErrors;
      });
    };

    window.addEventListener('systemError', handleNewError);
    return () => window.removeEventListener('systemError', handleNewError);
  }, []);

  const clearErrors = () => {
    setErrors([]);
    localStorage.removeItem('systemErrors');
  };

  const removeError = (id) => {
    const newErrors = errors.filter(error => error.id !== id);
    setErrors(newErrors);
    localStorage.setItem('systemErrors', JSON.stringify(newErrors));
  };

  const getErrorIcon = (type) => {
    switch (type) {
      case 'api': return '🌐';
      case 'javascript': return '⚠️';
      case 'warning': return '⚡';
      default: return '❌';
    }
  };

  const getErrorColor = (type) => {
    switch (type) {
      case 'api': return 'border-red-500 bg-red-50';
      case 'javascript': return 'border-yellow-500 bg-yellow-50';
      case 'warning': return 'border-orange-500 bg-orange-50';
      default: return 'border-gray-500 bg-gray-50';
    }
  };

  const getSuggestion = (error) => {
    const { type, message, component, status } = error;
    
    if (type === 'api') {
      if (status === 401) {
        return "🔑 Erro de autenticação. Verifique se o token JWT está sendo enviado corretamente ou faça login novamente.";
      }
      if (status === 404) {
        return "🔍 Recurso não encontrado. Verifique se a rota da API existe no backend.";
      }
      if (status === 500) {
        return "🔧 Erro interno do servidor. Verifique os logs do backend ou reinicie o servidor.";
      }
      if (message.includes('Network Error')) {
        return "🌐 Erro de rede. Verifique se o backend está rodando na porta 5000.";
      }
    }
    
    if (type === 'javascript') {
      if (message.includes('Cannot read property') || message.includes('Cannot read properties')) {
        return "🔍 Erro de propriedade indefinida. Verifique se os dados estão sendo carregados corretamente antes de acessá-los.";
      }
      if (message.includes('TypeError')) {
        return "📝 Erro de tipo. Verifique se as variáveis têm o tipo esperado antes de usar métodos específicos.";
      }
    }
    
    return "🤔 Erro não identificado. Verifique o console do navegador para mais detalhes.";
  };

  const filteredErrors = errors.filter(error => {
    if (filter === 'all') return true;
    return error.type === filter;
  });

  const errorCounts = {
    all: errors.length,
    api: errors.filter(e => e.type === 'api').length,
    javascript: errors.filter(e => e.type === 'javascript').length,
    warning: errors.filter(e => e.type === 'warning').length
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <Bug className="w-8 h-8 text-red-400" />
            <div>
              <h1 className="text-2xl font-bold">Log de Erros do Sistema</h1>
              <p className="text-gray-400">Monitoramento em tempo real de erros e problemas</p>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <button
              onClick={() => window.location.reload()}
              className="flex items-center space-x-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Atualizar</span>
            </button>
            <button
              onClick={clearErrors}
              className="flex items-center space-x-2 px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg transition-colors"
            >
              <Trash2 className="w-4 h-4" />
              <span>Limpar Logs</span>
            </button>
          </div>
        </div>

        {/* Filtros */}
        <div className="flex flex-wrap gap-3 mb-6">
          {[
            { key: 'all', label: 'Todos', icon: '📊' },
            { key: 'api', label: 'API', icon: '🌐' },
            { key: 'javascript', label: 'JavaScript', icon: '⚠️' },
            { key: 'warning', label: 'Avisos', icon: '⚡' }
          ].map(({ key, label, icon }) => (
            <button
              key={key}
              onClick={() => setFilter(key)}
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
                filter === key
                  ? 'bg-purple-600 text-white'
                  : 'bg-gray-700 hover:bg-gray-600 text-gray-300'
              }`}
            >
              <span>{icon}</span>
              <span>{label}</span>
              <span className="bg-gray-800 px-2 py-1 rounded-full text-xs">
                {errorCounts[key]}
              </span>
            </button>
          ))}
        </div>

        {/* Lista de Erros */}
        <div className="space-y-4">
          {filteredErrors.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">🎉</div>
              <h3 className="text-xl font-semibold mb-2">Nenhum erro encontrado!</h3>
              <p className="text-gray-400">
                {filter === 'all' 
                  ? 'O sistema está funcionando perfeitamente.'
                  : `Nenhum erro do tipo "${filter}" foi registrado.`
                }
              </p>
            </div>
          ) : (
            filteredErrors.map((error) => (
              <div
                key={error.id}
                className={`border-l-4 bg-gray-800 rounded-lg p-4 ${getErrorColor(error.type)}`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    {/* Header do Erro */}
                    <div className="flex items-center space-x-3 mb-3">
                      <span className="text-2xl">{getErrorIcon(error.type)}</span>
                      <div>
                        <div className="flex items-center space-x-2">
                          <span className="font-semibold text-lg capitalize">{error.type}</span>
                          {error.status && (
                            <span className="bg-red-600 text-white px-2 py-1 rounded text-xs">
                              {error.status}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center space-x-4 text-sm text-gray-400 mt-1">
                          <div className="flex items-center space-x-1">
                            <Clock className="w-4 h-4" />
                            <span>{new Date(error.timestamp).toLocaleString('pt-BR')}</span>
                          </div>
                          {error.component && (
                            <div className="flex items-center space-x-1">
                              <MapPin className="w-4 h-4" />
                              <span>{error.component}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Mensagem do Erro */}
                    <div className="mb-4">
                      <h4 className="font-medium mb-2">Mensagem:</h4>
                      <div className="bg-gray-900 p-3 rounded font-mono text-sm text-red-300">
                        {error.message}
                      </div>
                    </div>

                    {/* URL da API (se aplicável) */}
                    {error.url && (
                      <div className="mb-4">
                        <h4 className="font-medium mb-2">URL:</h4>
                        <div className="bg-gray-900 p-3 rounded font-mono text-sm text-blue-300">
                          {error.url}
                        </div>
                      </div>
                    )}

                    {/* Stack Trace (se disponível) */}
                    {error.stack && (
                      <div className="mb-4">
                        <button
                          onClick={() => setIsExpanded(!isExpanded)}
                          className="flex items-center space-x-2 text-sm text-gray-400 hover:text-white transition-colors"
                        >
                          <span>Stack Trace</span>
                          <span>{isExpanded ? '▼' : '▶'}</span>
                        </button>
                        {isExpanded && (
                          <div className="bg-gray-900 p-3 rounded font-mono text-xs text-gray-300 mt-2 max-h-40 overflow-y-auto">
                            {error.stack}
                          </div>
                        )}
                      </div>
                    )}

                    {/* Sugestão de Solução */}
                    <div className="bg-blue-900/30 border border-blue-700 rounded-lg p-4">
                      <div className="flex items-start space-x-3">
                        <Lightbulb className="w-5 h-5 text-yellow-400 mt-0.5 flex-shrink-0" />
                        <div>
                          <h4 className="font-medium text-yellow-400 mb-2">Sugestão de Solução:</h4>
                          <p className="text-sm text-gray-300">{getSuggestion(error)}</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Botão de Remover */}
                  <button
                    onClick={() => removeError(error.id)}
                    className="ml-4 p-2 text-gray-400 hover:text-red-400 transition-colors"
                    title="Remover erro"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Instruções */}
        <div className="mt-8 bg-gray-800 rounded-lg p-6">
          <h3 className="text-lg font-semibold mb-3 flex items-center space-x-2">
            <span>📖</span>
            <span>Como usar o Log de Erros</span>
          </h3>
          <div className="grid md:grid-cols-2 gap-4 text-sm text-gray-300">
            <div>
              <h4 className="font-medium text-white mb-2">🔍 Monitoramento Automático</h4>
              <p>O sistema captura automaticamente todos os erros que ocorrem durante a navegação, incluindo erros de API e JavaScript.</p>
            </div>
            <div>
              <h4 className="font-medium text-white mb-2">💡 Sugestões Inteligentes</h4>
              <p>Para cada erro, o sistema analisa o problema e sugere possíveis soluções baseadas no tipo e contexto do erro.</p>
            </div>
            <div>
              <h4 className="font-medium text-white mb-2">🎯 Filtros por Tipo</h4>
              <p>Use os filtros para visualizar apenas erros específicos: API (problemas de comunicação), JavaScript (erros de código) ou Avisos.</p>
            </div>
            <div>
              <h4 className="font-medium text-white mb-2">🧹 Gerenciamento</h4>
              <p>Remova erros individuais ou limpe todos os logs. Os erros são salvos automaticamente no navegador.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ErrorLogger;

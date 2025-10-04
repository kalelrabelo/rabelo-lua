import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { ChevronLeft, ChevronRight, Search, Image, Package, Diamond } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const JoiasEnhanced = () => {
  const [joias, setJoias] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [pagination, setPagination] = useState({
    page: 1,
    per_page: 10,
    total: 0,
    total_pages: 0
  });
  const [search, setSearch] = useState('');
  const [filterComImagem, setFilterComImagem] = useState('');
  const [selectedJoia, setSelectedJoia] = useState(null);
  const [relatedJoias, setRelatedJoias] = useState([]);
  const [showRelated, setShowRelated] = useState(false);

  const fetchJoias = async (page = 1) => {
    setLoading(true);
    setError(null);
    try {
      const params = {
        page,
        per_page: pagination.per_page,
        search,
        com_imagem: filterComImagem,
        order_by: 'id',
        order_dir: 'desc'
      };

      const response = await axios.get(`${API_URL}/api/joias/enhanced`, { params });
      setJoias(response.data.joias);
      setPagination(response.data.pagination);
    } catch (err) {
      setError('Erro ao carregar joias');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchRelatedJoias = async (joiaId) => {
    try {
      const response = await axios.get(`${API_URL}/api/joias/related/${joiaId}`);
      setRelatedJoias(response.data.joias);
      setShowRelated(true);
    } catch (err) {
      console.error('Erro ao carregar joias relacionadas:', err);
    }
  };

  useEffect(() => {
    fetchJoias();
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    fetchJoias(1);
  };

  const handlePageChange = (newPage) => {
    fetchJoias(newPage);
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(price || 0);
  };

  const handleJoiaClick = (joia) => {
    setSelectedJoia(joia);
    if (joia.joias_relacionadas || joia.nome) {
      fetchRelatedJoias(joia.id_original || joia.id);
    }
  };

  return (
    <div className="p-6 bg-black min-h-screen">
      <div className="max-w-7xl mx-auto">
        {/* Cabeçalho */}
        <div className="bg-gray-900 border border-gray-700 rounded-lg shadow mb-6 p-6">
          <h1 className="text-2xl font-bold text-white mb-4 flex items-center">
            <Diamond className="mr-2" />
            Catálogo de Joias
          </h1>

          {/* Filtros */}
          <form onSubmit={handleSearch} className="flex gap-4 mb-4">
            <div className="flex-1">
              <Input
                type="text"
                placeholder="Buscar por nome ou descrição..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full bg-gray-800 border-gray-600 text-white placeholder-gray-400"
              />
            </div>
            <select
              value={filterComImagem}
              onChange={(e) => setFilterComImagem(e.target.value)}
              className="px-4 py-2 border border-gray-600 rounded-lg bg-gray-800 text-white"
            >
              <option value="">Todas as joias</option>
              <option value="true">Com imagem</option>
              <option value="false">Sem imagem</option>
            </select>
            <Button type="submit" className="bg-blue-600 hover:bg-blue-700">
              <Search className="w-4 h-4 mr-2" />
              Buscar
            </Button>
          </form>

          {/* Estatísticas */}
          <div className="flex gap-4 text-sm text-gray-400">
            <span>Total: {pagination.total} joias</span>
            <span>|</span>
            <span>Página {pagination.page} de {pagination.total_pages}</span>
          </div>
        </div>

        {/* Grid de Joias */}
        {loading ? (
          <div className="text-center py-12 text-white">Carregando...</div>
        ) : error ? (
          <div className="text-center py-12 text-red-500">{error}</div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 mb-6">
              {joias.map((joia) => (
                <div
                  key={joia.id}
                  className="bg-black border border-gray-800 rounded-lg shadow hover:shadow-lg transition-shadow cursor-pointer overflow-hidden"
                  onClick={() => handleJoiaClick(joia)}
                >
                  {/* Imagem */}
                  <div className="h-32 bg-black rounded-t-lg flex items-center justify-center overflow-hidden">
                    {joia.imagem_path ? (
                      <img
                        src={`${API_URL}${joia.imagem_path}`}
                        alt={joia.nome}
                        className="max-w-full max-h-full object-contain"
                        style={{ filter: 'drop-shadow(0 0 8px rgba(255,255,255,0.1))' }}
                        onError={(e) => {
                          e.target.onerror = null;
                          e.target.src = '';
                          e.target.style.display = 'none';
                          e.target.parentElement.innerHTML = '<div class="flex items-center justify-center w-full h-full"><svg class="w-12 h-12 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg></div>';
                        }}
                      />
                    ) : (
                      <Image className="w-12 h-12 text-gray-600" />
                    )}
                  </div>

                  {/* Informações */}
                  <div className="p-3 bg-black">
                    <h3 className="font-semibold text-white text-sm truncate">
                      {joia.nome}
                    </h3>
                    {joia.descricao_completa && (
                      <p className="text-xs text-gray-400 truncate mt-1">
                        {joia.descricao_completa}
                      </p>
                    )}
                    <div className="flex justify-between items-center mt-2">
                      <span className="text-sm font-bold text-blue-400">
                        {formatPrice(joia.preco_display)}
                      </span>
                      <span className="text-xs text-gray-500">
                        <Package className="w-3 h-3 inline mr-1" />
                        {joia.estoque || 0}
                      </span>
                    </div>
                    <div className="mt-2">
                      <span className="text-xs bg-gray-800 text-gray-200 px-2 py-1 rounded">
                        {joia.categoria}
                      </span>
                      {joia.joias_relacionadas && (
                        <span className="ml-2 text-xs bg-blue-900 text-blue-300 px-2 py-1 rounded">
                          Variações
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Paginação */}
            <div className="flex justify-center items-center gap-4 bg-gray-900 border border-gray-700 p-4 rounded-lg shadow">
              <Button
                onClick={() => handlePageChange(pagination.page - 1)}
                disabled={!pagination.has_prev}
                variant="outline"
                className="border-gray-600 text-white hover:bg-gray-800"
              >
                <ChevronLeft className="w-4 h-4" />
                Anterior
              </Button>

              <span className="text-gray-300">
                Página {pagination.page} de {pagination.total_pages}
              </span>

              <Button
                onClick={() => handlePageChange(pagination.page + 1)}
                disabled={!pagination.has_next}
                variant="outline"
                className="border-gray-600 text-white hover:bg-gray-800"
              >
                Próxima
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </>
        )}

        {/* Modal de Joias Relacionadas */}
        {showRelated && selectedJoia && (
          <div className="fixed inset-0 bg-black bg-opacity-75 z-50 flex items-center justify-center p-4">
            <div className="bg-gray-900 border border-gray-700 rounded-lg max-w-6xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                {/* Cabeçalho do Modal */}
                <div className="flex justify-between items-start mb-6">
                  <div>
                    <h2 className="text-2xl font-bold text-white mb-2">
                      {selectedJoia.nome}
                    </h2>
                    <p className="text-gray-400">
                      Variações disponíveis ({relatedJoias.length} encontradas)
                    </p>
                  </div>
                  <Button 
                    onClick={() => setShowRelated(false)}
                    variant="outline"
                    className="border-gray-600 text-white hover:bg-gray-800"
                  >
                    Fechar
                  </Button>
                </div>

                {/* Joia Principal */}
                <div className="bg-black border border-gray-800 rounded-lg p-6 mb-6">
                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="bg-black rounded-lg p-4 flex items-center justify-center border border-gray-700">
                      {selectedJoia.imagem_path ? (
                        <img
                          src={`${API_URL}${selectedJoia.imagem_path}`}
                          alt={selectedJoia.nome}
                          className="max-w-full max-h-64 object-contain"
                          style={{ filter: 'drop-shadow(0 0 15px rgba(255,255,255,0.3))' }}
                        />
                      ) : (
                        <Image className="w-32 h-32 text-gray-600" />
                      )}
                    </div>
                    <div className="space-y-4">
                      <div>
                        <h3 className="text-xl font-semibold text-white mb-3">Especificações</h3>
                        <div className="space-y-2">
                          <div className="flex justify-between p-2 bg-gray-800 rounded">
                            <span className="text-gray-300">Categoria:</span>
                            <span className="text-white font-medium">{selectedJoia.categoria}</span>
                          </div>
                          <div className="flex justify-between p-2 bg-gray-800 rounded">
                            <span className="text-gray-300">Preço:</span>
                            <span className="text-green-400 font-bold">{formatPrice(selectedJoia.preco_display)}</span>
                          </div>
                          <div className="flex justify-between p-2 bg-gray-800 rounded">
                            <span className="text-gray-300">Estoque:</span>
                            <span className="text-white font-medium">{selectedJoia.estoque || 0}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Grid de Variações */}
                <div>
                  <h3 className="text-lg font-semibold text-white mb-4">Outras Variações</h3>
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {relatedJoias.map((joia) => (
                      <div key={joia.id} className="bg-black border border-gray-800 rounded-lg p-3 hover:border-gray-600 transition-colors cursor-pointer">
                        <div className="h-24 bg-black rounded mb-2 flex items-center justify-center">
                          {joia.imagem_path ? (
                            <img
                              src={`${API_URL}${joia.imagem_path}`}
                              alt={joia.descricao_completa}
                              className="max-w-full max-h-full object-contain"
                              style={{ filter: 'drop-shadow(0 0 6px rgba(255,255,255,0.1))' }}
                            />
                          ) : (
                            <Image className="w-8 h-8 text-gray-600" />
                          )}
                        </div>
                        <p className="text-sm font-medium text-white truncate">
                          {joia.descricao_completa}
                        </p>
                        <p className="text-sm font-bold text-blue-400 mt-1">
                          {formatPrice(joia.preco_display)}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          Estoque: {joia.estoque || 0}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default JoiasEnhanced;
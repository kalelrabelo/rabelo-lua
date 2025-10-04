import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Users, ChevronLeft, ChevronRight, Search, CreditCard, User, Phone, Mail, MapPin, Calendar, DollarSign } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const FuncionariosEnhanced = () => {
  const [funcionarios, setFuncionarios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [pagination, setPagination] = useState({
    page: 1,
    per_page: 10,
    total: 0,
    total_pages: 0
  });
  const [search, setSearch] = useState('');
  const [selectedFunc, setSelectedFunc] = useState(null);
  const [carteira, setCarteira] = useState(null);
  const [showCarteira, setShowCarteira] = useState(false);

  const fetchFuncionarios = async (page = 1) => {
    setLoading(true);
    setError(null);
    try {
      const params = {
        page,
        per_page: pagination.per_page,
        search,
        order_by: 'id',
        order_dir: 'desc'
      };

      const response = await axios.get(`${API_URL}/api/funcionarios/enhanced`, { params });
      setFuncionarios(response.data.funcionarios);
      setPagination(response.data.pagination);
    } catch (err) {
      setError('Erro ao carregar funcionários');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchCarteira = async (funcId) => {
    try {
      const response = await axios.get(`${API_URL}/api/funcionarios/${funcId}/carteira`);
      setCarteira(response.data);
      setShowCarteira(true);
    } catch (err) {
      console.error('Erro ao carregar carteira:', err);
    }
  };

  useEffect(() => {
    fetchFuncionarios();
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    fetchFuncionarios(1);
  };

  const handlePageChange = (newPage) => {
    fetchFuncionarios(newPage);
  };

  const handleFuncClick = (func) => {
    setSelectedFunc(func);
    fetchCarteira(func.id);
  };

  return (
    <div className="p-6 bg-gray-50">
      <div className="max-w-7xl mx-auto">
        {/* Cabeçalho */}
        <div className="bg-white rounded-lg shadow mb-6 p-6">
          <h1 className="text-2xl font-bold text-gray-800 mb-4 flex items-center">
            <Users className="mr-2" />
            Gerenciamento de Funcionários
          </h1>

          {/* Busca */}
          <form onSubmit={handleSearch} className="flex gap-4 mb-4">
            <div className="flex-1">
              <Input
                type="text"
                placeholder="Buscar por nome, cargo ou CPF..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full"
              />
            </div>
            <Button type="submit">
              <Search className="w-4 h-4 mr-2" />
              Buscar
            </Button>
          </form>

          {/* Estatísticas */}
          <div className="flex gap-4 text-sm text-gray-600">
            <span>Total: {pagination.total} funcionários</span>
            <span>|</span>
            <span>Página {pagination.page} de {pagination.total_pages}</span>
          </div>
        </div>

        {/* Lista de Funcionários */}
        {loading ? (
          <div className="text-center py-12">Carregando...</div>
        ) : error ? (
          <div className="text-center py-12 text-red-500">{error}</div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
              {funcionarios.map((func) => (
                <div
                  key={func.id}
                  className="bg-white rounded-lg shadow hover:shadow-lg transition-shadow cursor-pointer"
                  onClick={() => handleFuncClick(func)}
                >
                  <div className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center">
                        <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                          <User className="w-6 h-6 text-blue-600" />
                        </div>
                        <div className="ml-3">
                          <h3 className="font-semibold text-gray-800">
                            {func.name}
                          </h3>
                          <p className="text-sm text-gray-600">
                            {func.cargo || func.role}
                          </p>
                        </div>
                      </div>
                      <span className={`px-2 py-1 text-xs rounded ${func.active ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
                        {func.active ? 'Ativo' : 'Inativo'}
                      </span>
                    </div>

                    <div className="space-y-2 text-sm">
                      <div className="flex items-center text-gray-600">
                        <CreditCard className="w-4 h-4 mr-2" />
                        <span>CPF: {func.cpf || 'Não informado'}</span>
                      </div>
                      <div className="flex items-center text-gray-600">
                        <Phone className="w-4 h-4 mr-2" />
                        <span>{func.telefone || 'Não informado'}</span>
                      </div>
                      <div className="flex items-center text-gray-600">
                        <Mail className="w-4 h-4 mr-2" />
                        <span className="truncate">{func.email || 'Não informado'}</span>
                      </div>
                      {func.salario_formatado && (
                        <div className="flex items-center text-gray-600">
                          <DollarSign className="w-4 h-4 mr-2" />
                          <span>{func.salario_formatado}</span>
                        </div>
                      )}
                      {func.tempo_servico && (
                        <div className="flex items-center text-gray-600">
                          <Calendar className="w-4 h-4 mr-2" />
                          <span>Tempo: {func.tempo_servico}</span>
                        </div>
                      )}
                    </div>

                    <div className="mt-4 pt-4 border-t">
                      <button className="w-full text-blue-600 text-sm font-medium hover:text-blue-700">
                        Ver Carteira de Identidade →
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Paginação */}
            <div className="flex justify-center items-center gap-4 bg-white p-4 rounded-lg shadow">
              <Button
                onClick={() => handlePageChange(pagination.page - 1)}
                disabled={!pagination.has_prev}
                variant="outline"
              >
                <ChevronLeft className="w-4 h-4" />
                Anterior
              </Button>

              <span className="text-gray-600">
                Página {pagination.page} de {pagination.total_pages}
              </span>

              <Button
                onClick={() => handlePageChange(pagination.page + 1)}
                disabled={!pagination.has_next}
                variant="outline"
              >
                Próxima
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </>
        )}

        {/* Modal de Carteira de Identidade */}
        {showCarteira && carteira && (
          <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-lg max-w-2xl w-full">
              {/* Carteira de Identidade */}
              <div className="p-6">
                <h2 className="text-xl font-bold mb-4 text-center">
                  CARTEIRA DE IDENTIDADE FUNCIONAL
                </h2>
                
                <div className="border-2 border-gray-800 rounded-lg p-6 bg-gradient-to-br from-blue-50 to-white">
                  {/* Cabeçalho da Carteira */}
                  <div className="text-center mb-4 pb-4 border-b-2 border-gray-300">
                    <h3 className="text-lg font-bold text-blue-800">
                      JOALHERIA ANTONIO RABELO
                    </h3>
                    <p className="text-sm text-gray-600">Documento de Identificação Funcional</p>
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    {/* Foto */}
                    <div className="col-span-1">
                      <div className="w-32 h-40 bg-gray-200 border-2 border-gray-400 rounded flex items-center justify-center">
                        <User className="w-16 h-16 text-gray-400" />
                      </div>
                      <p className="text-xs text-center mt-2 font-mono">
                        {carteira.assinatura_digital}
                      </p>
                    </div>

                    {/* Dados Pessoais */}
                    <div className="col-span-2 space-y-2">
                      <div>
                        <label className="text-xs font-bold text-gray-600">NOME COMPLETO</label>
                        <p className="text-sm font-medium">{carteira.dados_pessoais.nome}</p>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="text-xs font-bold text-gray-600">CPF</label>
                          <p className="text-sm">{carteira.dados_pessoais.cpf}</p>
                        </div>
                        <div>
                          <label className="text-xs font-bold text-gray-600">RG</label>
                          <p className="text-sm">{carteira.dados_pessoais.rg}</p>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="text-xs font-bold text-gray-600">DATA NASCIMENTO</label>
                          <p className="text-sm">{carteira.dados_pessoais.data_nascimento_formatada || carteira.dados_pessoais.data_nascimento}</p>
                        </div>
                        <div>
                          <label className="text-xs font-bold text-gray-600">IDADE</label>
                          <p className="text-sm">{carteira.dados_pessoais.idade || 'N/A'}</p>
                        </div>
                      </div>

                      <div>
                        <label className="text-xs font-bold text-gray-600">NATURALIDADE</label>
                        <p className="text-sm">{carteira.dados_pessoais.naturalidade}</p>
                      </div>

                      <div>
                        <label className="text-xs font-bold text-gray-600">ESTADO CIVIL</label>
                        <p className="text-sm">{carteira.dados_pessoais.estado_civil}</p>
                      </div>
                    </div>
                  </div>

                  {/* Dados Profissionais */}
                  <div className="mt-4 pt-4 border-t-2 border-gray-300 grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-bold text-gray-600">CARGO</label>
                      <p className="text-sm font-medium">{carteira.dados_profissionais.cargo}</p>
                    </div>
                    <div>
                      <label className="text-xs font-bold text-gray-600">MATRÍCULA</label>
                      <p className="text-sm font-medium">#{carteira.dados_profissionais.id_funcionario}</p>
                    </div>
                    <div>
                      <label className="text-xs font-bold text-gray-600">ADMISSÃO</label>
                      <p className="text-sm">{carteira.dados_profissionais.data_admissao_formatada || carteira.dados_profissionais.data_admissao}</p>
                    </div>
                    <div>
                      <label className="text-xs font-bold text-gray-600">TEMPO DE SERVIÇO</label>
                      <p className="text-sm">{carteira.dados_profissionais.tempo_servico || 'N/A'}</p>
                    </div>
                  </div>

                  {/* Filiação */}
                  <div className="mt-4 pt-4 border-t-2 border-gray-300">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-xs font-bold text-gray-600">NOME DA MÃE</label>
                        <p className="text-sm">{carteira.dados_pessoais.nome_mae}</p>
                      </div>
                      <div>
                        <label className="text-xs font-bold text-gray-600">NOME DO PAI</label>
                        <p className="text-sm">{carteira.dados_pessoais.nome_pai}</p>
                      </div>
                    </div>
                  </div>

                  {/* Contato */}
                  <div className="mt-4 pt-4 border-t-2 border-gray-300">
                    <div>
                      <label className="text-xs font-bold text-gray-600">ENDEREÇO</label>
                      <p className="text-sm">{carteira.contato.endereco || 'Não informado'}</p>
                    </div>
                    <div className="grid grid-cols-2 gap-4 mt-2">
                      <div>
                        <label className="text-xs font-bold text-gray-600">TELEFONE</label>
                        <p className="text-sm">{carteira.contato.telefone || 'Não informado'}</p>
                      </div>
                      <div>
                        <label className="text-xs font-bold text-gray-600">EMAIL</label>
                        <p className="text-sm">{carteira.contato.email || 'Não informado'}</p>
                      </div>
                    </div>
                  </div>

                  {/* Rodapé */}
                  <div className="mt-6 pt-4 border-t-2 border-gray-300 text-center">
                    <p className="text-xs text-gray-600">
                      Documento válido somente com apresentação de documento oficial com foto
                    </p>
                    <p className="text-xs text-gray-600 mt-1">
                      Emitido em: {new Date().toLocaleDateString('pt-BR')}
                    </p>
                  </div>
                </div>

                <div className="flex justify-end gap-2 mt-6">
                  <Button variant="outline" onClick={() => window.print()}>
                    Imprimir
                  </Button>
                  <Button onClick={() => setShowCarteira(false)}>
                    Fechar
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default FuncionariosEnhanced;
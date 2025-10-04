import React, { useState, useEffect } from 'react';
import { Pencil, Trash2, Plus, Search, Calendar, User, Mail, Phone, MapPin, Globe, ChevronLeft, ChevronRight } from 'lucide-react';
import apiService from '../services/api.js';

function Clientes() {
  const [clientes, setClientes] = useState([]);
  const [clienteEditando, setClienteEditando] = useState(null);
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [termoBusca, setTermoBusca] = useState('');
  const [clientesFiltrados, setClientesFiltrados] = useState([]);
  const [paginaAtual, setPaginaAtual] = useState(1);
  const [clientesPorPagina] = useState(20);

  // Calcular índices para paginação
  const indiceUltimoCliente = paginaAtual * clientesPorPagina;
  const indicePrimeiroCliente = indiceUltimoCliente - clientesPorPagina;
  const clientesAtuais = clientesFiltrados.slice(indicePrimeiroCliente, indiceUltimoCliente);
  const totalPaginas = Math.ceil(clientesFiltrados.length / clientesPorPagina);

  useEffect(() => {
    // Carregar dados da API
    const carregarClientes = async () => {
      try {
        const response = await apiService.getCustomers();
        const clientesData = response.data || [];
        setClientes(clientesData);
        setClientesFiltrados(clientesData);
      } catch (error) {
        console.error('Erro ao carregar clientes:', error);
        setClientes([]);
        setClientesFiltrados([]);
      }
    };
    
    carregarClientes();
  }, []);

  useEffect(() => {
    // Filtrar clientes baseado no termo de busca
    const filtrados = (Array.isArray(clientes) ? clientes : []).filter(cliente =>
      (cliente.name || '').toLowerCase().includes(termoBusca.toLowerCase()) ||
      (cliente.email || '').toLowerCase().includes(termoBusca.toLowerCase()) ||
      (cliente.address || '').toLowerCase().includes(termoBusca.toLowerCase()) ||
      (cliente.phone || '').toLowerCase().includes(termoBusca.toLowerCase())
    );
    setClientesFiltrados(filtrados);
    setPaginaAtual(1); // Reset para primeira página quando filtrar
  }, [termoBusca, clientes]);

  const calcularProximoAniversario = (dataAniversario) => {
    if (!dataAniversario) return '';
    
    const hoje = new Date();
    const aniversario = new Date(dataAniversario);
    const proximoAniversario = new Date(hoje.getFullYear(), aniversario.getMonth(), aniversario.getDate());
    
    if (proximoAniversario < hoje) {
      proximoAniversario.setFullYear(hoje.getFullYear() + 1);
    }
    
    return proximoAniversario.toLocaleDateString('pt-BR');
  };

  const handleSalvarCliente = (cliente) => {
    if (clienteEditando) {
      // Editar cliente existente
      setClientes(clientes.map(c => c.id === cliente.id ? cliente : c));
    } else {
      // Adicionar novo cliente
      const novoCliente = {
        ...cliente,
        id: Math.max(...clientes.map(c => c.id), 0) + 1,
        proximo_aniversario: calcularProximoAniversario(cliente.data_aniversario)
      };
      setClientes([...clientes, novoCliente]);
    }
    setClienteEditando(null);
    setMostrarFormulario(false);
  };

  const handleEditarCliente = (cliente) => {
    setClienteEditando(cliente);
    setMostrarFormulario(true);
  };

  const handleExcluirCliente = (id) => {
    if (window.confirm('Tem certeza que deseja excluir este cliente?')) {
      setClientes((Array.isArray(clientes) ? clientes : []).filter(c => c.id !== id));
    }
  };

  const handleNovoCliente = () => {
    setClienteEditando(null);
    setMostrarFormulario(true);
  };

  const handlePaginaAnterior = () => {
    setPaginaAtual(prev => Math.max(prev - 1, 1));
  };

  const handleProximaPagina = () => {
    setPaginaAtual(prev => Math.min(prev + 1, totalPaginas));
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-3xl font-bold text-gray-900">Clientes</h2>
          <p className="text-gray-600">Gerenciamento de {clientesFiltrados.length} clientes</p>
        </div>
        <button
          onClick={handleNovoCliente}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-blue-700"
        >
          <Plus size={20} />
          Novo Cliente
        </button>
      </div>

      {/* Barra de busca */}
      <div className="mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar clientes..."
            value={termoBusca}
            onChange={(e) => setTermoBusca(e.target.value)}
            className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      </div>

      {/* Informações de paginação */}
      <div className="mb-4 text-sm text-gray-600">
        Mostrando {indicePrimeiroCliente + 1} a {Math.min(indiceUltimoCliente, clientesFiltrados.length)} de {clientesFiltrados.length} clientes
      </div>

      {/* Lista de clientes */}
      <div className="grid gap-4">
        {clientesAtuais.map((cliente) => (
          <div key={cliente.id} className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
            <div className="flex justify-between items-start">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <User size={20} className="text-blue-600" />
                  <h3 className="text-xl font-semibold text-gray-900">
                    {cliente.name}
                  </h3>
                </div>
                
                <div className="grid md:grid-cols-2 gap-4 text-sm text-gray-600">
                  {cliente.address && (
                    <div className="flex items-start gap-2">
                      <MapPin size={16} className="text-gray-400 mt-0.5" />
                      <span>{cliente.address}</span>
                    </div>
                  )}
                  
                  {cliente.phone && (
                    <div className="flex items-center gap-2">
                      <Phone size={16} className="text-gray-400" />
                      <span>{cliente.phone}</span>
                    </div>
                  )}
                  
                  {cliente.email && (
                    <div className="flex items-center gap-2">
                      <Mail size={16} className="text-gray-400" />
                      <span>{cliente.email}</span>
                    </div>
                  )}
                  
                  {cliente.birth_date && (
                    <div className="flex items-center gap-2">
                      <Calendar size={16} className="text-gray-400" />
                      <span>Aniversário: {new Date(cliente.birth_date).toLocaleDateString('pt-BR')}</span>
                    </div>
                  )}
                </div>
                
                {cliente.notes && (
                  <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                    <p className="text-sm text-gray-700">{cliente.notes}</p>
                  </div>
                )}
              </div>
              
              <div className="flex gap-2 ml-4">
                <button
                  onClick={() => handleEditarCliente(cliente)}
                  className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"
                  title="Editar cliente"
                >
                  <Pencil size={16} />
                </button>
                <button
                  onClick={() => handleExcluirCliente(cliente.id)}
                  className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                  title="Excluir cliente"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Controles de paginação */}
      {totalPaginas > 1 && (
        <div className="flex justify-center items-center gap-4 mt-6">
          <button
            onClick={handlePaginaAnterior}
            disabled={paginaAtual === 1}
            className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ChevronLeft size={16} />
            Anterior
          </button>
          
          <span className="text-sm text-gray-600">
            Página {paginaAtual} de {totalPaginas}
          </span>
          
          <button
            onClick={handleProximaPagina}
            disabled={paginaAtual === totalPaginas}
            className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Próxima
            <ChevronRight size={16} />
          </button>
        </div>
      )}

      {clientesFiltrados.length === 0 && (
        <div className="text-center py-12">
          <User size={48} className="mx-auto text-gray-400 mb-4" />
          <p className="text-gray-500">Nenhum cliente encontrado</p>
        </div>
      )}

      {/* Modal de formulário */}
      {mostrarFormulario && (
        <FormularioCliente
          cliente={clienteEditando}
          onSalvar={handleSalvarCliente}
          onCancelar={() => {
            setMostrarFormulario(false);
            setClienteEditando(null);
          }}
        />
      )}
    </div>
  );
}

function FormularioCliente({ cliente, onSalvar, onCancelar }) {
  const [formData, setFormData] = useState({
    nome: cliente?.nome || '',
    sobrenome: cliente?.sobrenome || '',
    endereco_completo: cliente?.endereco_completo || '',
    celular: cliente?.celular || '',
    email: cliente?.email || '',
    internet1: cliente?.internet1 || '',
    data_aniversario: cliente?.data_aniversario || '',
    noticias: cliente?.noticias || ''
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    const clienteData = {
      ...formData,
      id: cliente?.id,
      proximo_aniversario: formData.data_aniversario ? 
        new Date(new Date().getFullYear(), new Date(formData.data_aniversario).getMonth(), new Date(formData.data_aniversario).getDate()).toLocaleDateString('pt-BR') : ''
    };
    onSalvar(clienteData);
  };

  return (
    <div className="fixed inset-0 bg-black bg- flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <h3 className="text-xl font-semibold mb-4">
          {cliente ? 'Editar Cliente' : 'Novo Cliente'}
        </h3>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nome</label>
              <input
                type="text"
                value={formData.nome}
                onChange={(e) => setFormData({...formData, nome: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Sobrenome</label>
              <input
                type="text"
                value={formData.sobrenome}
                onChange={(e) => setFormData({...formData, sobrenome: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Endereço Completo</label>
            <input
              type="text"
              value={formData.endereco_completo}
              onChange={(e) => setFormData({...formData, endereco_completo: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Celular</label>
              <input
                type="text"
                value={formData.celular}
                onChange={(e) => setFormData({...formData, celular: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({...formData, email: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
          
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Website</label>
              <input
                type="text"
                value={formData.internet1}
                onChange={(e) => setFormData({...formData, internet1: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Data de Aniversário</label>
              <input
                type="date"
                value={formData.data_aniversario}
                onChange={(e) => setFormData({...formData, data_aniversario: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Notícias/Observações</label>
            <textarea
              value={formData.noticias}
              onChange={(e) => setFormData({...formData, noticias: e.target.value})}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          
          <div className="flex gap-3 pt-4">
            <button
              type="submit"
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
            >
              Salvar
            </button>
            <button
              type="button"
              onClick={onCancelar}
              className="bg-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-400"
            >
              Cancelar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default Clientes;



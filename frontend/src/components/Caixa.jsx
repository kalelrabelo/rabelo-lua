import React, { useState, useEffect } from 'react';
import { DollarSign, Search, Calendar, User, FileText, ChevronLeft, ChevronRight, Filter, Printer, Eye, MapPin, Clock } from 'lucide-react';

function Caixa() {
  const [registros, setRegistros] = useState([]);
  const [registrosFiltrados, setRegistrosFiltrados] = useState([]);
  const [paginaAtual, setPaginaAtual] = useState(1);
  const [registrosPorPagina] = useState(10);
  const [termoBusca, setTermoBusco] = useState('');
  const [filtroAno, setFiltroAno] = useState('');
  const [filtroMes, setFiltroMes] = useState('');
  const [filtroGrupo, setFiltroGrupo] = useState('');
  const [registroSelecionado, setRegistroSelecionado] = useState(null);
  const [vales, setVales] = useState([]);
  const [funcionarios, setFuncionarios] = useState([]);

  const indiceUltimoRegistro = paginaAtual * registrosPorPagina;
  const indicePrimeiroRegistro = indiceUltimoRegistro - registrosPorPagina;
  const registrosAtuais = registrosFiltrados.slice(indicePrimeiroRegistro, indiceUltimoRegistro);
  const totalPaginas = Math.ceil(registrosFiltrados.length / registrosPorPagina);

  const anosDisponiveis = [...new Set((Array.isArray(registros) ? registros : []).map(r => r.data ? new Date(r.data).getFullYear() : NaN).filter(year => !isNaN(year)))].sort((a, b) => b - a);
  const gruposDisponiveis = [...new Set((Array.isArray(registros) ? registros : []).map(r => r.grupo1))].sort();

  const mesesNomes = [
    '', 'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
  ];

  useEffect(() => {
    fetchCaixaData();
    fetchVales();
    fetchFuncionarios();
  }, []);

  useEffect(() => {
    let allRegistros = [...registros];

    vales.forEach(vale => {
      const funcionario = funcionarios.find(f => f.id === vale.employee_id);
      allRegistros.push({
        ID: `VALE-${vale.id}`,
        data: vale.date,
        valor1: -vale.amount, // Vales são saídas, então valor negativo
        descricao: `Vale para ${funcionario ? funcionario.name : 'Funcionário Desconhecido'}: ${vale.description}`,
        grupo1: 'Vales',
        grupo2: vale.description,
        nome: funcionario ? funcionario.name : 'Funcionário Desconhecido',
        tipo: 'saida'
      });
    });

    let filtrados = allRegistros.filter(registro => {
      const matchBusca =
        (registro.descricao && registro.descricao.toLowerCase().includes(termoBusca.toLowerCase())) ||
        (registro.nome && registro.nome.toLowerCase().includes(termoBusca.toLowerCase())) ||
        (registro.grupo1 && registro.grupo1.toLowerCase().includes(termoBusca.toLowerCase())) ||
        (registro.grupo2 && registro.grupo2.toLowerCase().includes(termoBusca.toLowerCase()));

      const matchAno = !filtroAno || (registro.data && new Date(registro.data).getFullYear().toString() === filtroAno);
      const matchMes = !filtroMes || (registro.data && (new Date(registro.data).getMonth() + 1).toString() === filtroMes);
      const matchGrupo = !filtroGrupo || registro.grupo1 === filtroGrupo;

      return matchBusca && matchAno && matchMes && matchGrupo;
    });

    setRegistrosFiltrados(filtrados.sort((a, b) => new Date(b.data) - new Date(a.data)));
    setPaginaAtual(1);
  }, [termoBusca, filtroAno, filtroMes, filtroGrupo, registros, vales, funcionarios]);

  const fetchCaixaData = async () => {
    try {
      const response = await fetch('/api/caixa');
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      // Garantir que sempre temos um array
      setRegistros(Array.isArray(data.data) ? data.data : Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Erro ao buscar dados do caixa:", error);
      setRegistros([]); // Definir array vazio em caso de erro
    }
  };

  const fetchVales = async () => {
    try {
      const response = await fetch('/api/vales');
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      // Garantir que sempre temos um array
      setVales(Array.isArray(data.data) ? data.data : Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Erro ao buscar vales:", error);
      setVales([]); // Definir array vazio em caso de erro
    }
  };

  const fetchFuncionarios = async () => {
    try {
      const response = await fetch('/api/employees');
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      // Garantir que sempre temos um array
      setFuncionarios(Array.isArray(data.data) ? data.data : Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Erro ao buscar funcionários:", error);
      setFuncionarios([]); // Definir array vazio em caso de erro
    }
  };

  const formatarData = (data) => {
    if (!data) return 'Data não informada';
    return new Date(data).toLocaleDateString('pt-BR');
  };

  const formatarValor = (valor) => {
    if (isNaN(valor) || valor === null || valor === undefined) return 'R$ 0,00';
    return `R$ ${parseFloat(valor).toFixed(2)}`;
  };

  const getCorValor = (valor) => {
    if (valor > 0) return 'text-green-600';
    if (valor < 0) return 'text-red-600';
    return 'text-gray-600';
  };

  const handlePaginaAnterior = () => {
    setPaginaAtual(prev => Math.max(prev - 1, 1));
  };

  const handleProximaPagina = () => {
    setPaginaAtual(prev => Math.min(prev + 1, totalPaginas));
  };

  const handleVisualizarRegistro = (registro) => {
    setRegistroSelecionado(registro);
  };

  const limparFiltros = () => {
    setFiltroAno('');
    setFiltroMes('');
    setFiltroGrupo('');
    setTermoBusco('');
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-3xl font-bold text-gray-900">Controle de Caixa</h2>
          <p className="text-gray-600">Gerenciamento de {registrosFiltrados.length} registros financeiros</p>
        </div>
      </div>

      {/* Filtros */}
      <div className="bg-white border border-gray-200 rounded-lg p-4 mb-6">
        <div className="flex items-center gap-2 mb-4">
          <Filter size={20} className="text-gray-600" />
          <h3 className="text-lg font-semibold text-gray-900">Filtros</h3>
          <button
            onClick={limparFiltros}
            className="ml-auto text-sm text-blue-600 hover:text-blue-800"
          >
            Limpar Filtros
          </button>
        </div>

        <div className="grid md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Buscar</label>
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Descrição, nome, grupo..."
                value={termoBusca}
                onChange={(e) => setTermoBusco(e.target.value)}
                className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Ano</label>
            <select
              value={filtroAno}
              onChange={(e) => setFiltroAno(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Todos os anos</option>
              {anosDisponiveis.map(ano => (
                <option key={ano} value={ano}>{ano}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Mês</label>
            <select
              value={filtroMes}
              onChange={(e) => setFiltroMes(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Todos os meses</option>
              {mesesNomes.slice(1).map((mes, index) => (
                <option key={index + 1} value={index + 1}>{mes}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Grupo</label>
            <select
              value={filtroGrupo}
              onChange={(e) => setFiltroGrupo(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Todos os grupos</option>
              {gruposDisponiveis.map(grupo => (
                <option key={grupo} value={grupo}>{grupo}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Informações de paginação */}
      <div className="mb-4 text-sm text-gray-600">
        Mostrando {indicePrimeiroRegistro + 1} a {Math.min(indiceUltimoRegistro, registrosFiltrados.length)} de {registrosFiltrados.length} registros
      </div>

      {/* Lista de registros */}
      <div className="grid gap-4">
        {registrosAtuais.map((registro) => (
            <div key={registro.ID} className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <DollarSign size={20} className={getCorValor(registro.valor1)} />
                    <h3 className="text-xl font-semibold text-gray-900">
                      {registro.descricao || 'Sem Descrição'}
                    </h3>
                  </div>

                  <div className="grid md:grid-cols-3 gap-4 text-sm text-gray-600">
                    <div className="space-y-2">
                      <h4 className="font-semibold text-gray-800">Detalhes</h4>
                      <div className="flex items-center gap-2">
                        <Calendar size={16} />
                        <span>{formatarData(registro.data)}</span>
                      </div>
                      <div className={`flex items-center gap-2 font-bold ${getCorValor(registro.valor1)}`}>
                        <DollarSign size={16} />
                        <span>{formatarValor(registro.valor1)}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <User size={16} />
                        <span>{registro.nome || 'Não informado'}</span>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <h4 className="font-semibold text-gray-800">Grupos</h4>
                      <p className="text-gray-700">{registro.grupo1 || 'Não informado'}</p>
                      <p className="text-gray-700">{registro.grupo2 || ''}</p>
                    </div>
                  </div>
                </div>

                <div className="flex gap-2 ml-4">
                  <button
                    onClick={() => handleVisualizarRegistro(registro)}
                    className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"
                    title="Visualizar registro completo"
                  >
                    <Eye size={16} />
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

      {registrosFiltrados.length === 0 && (
        <div className="text-center py-12">
          <DollarSign size={48} className="mx-auto text-gray-400 mb-4" />
          <p className="text-gray-500">Nenhum registro encontrado</p>
        </div>
      )}

      {/* Modal de visualização */}
      {registroSelecionado && (
        <ModalVisualizacao
          registro={registroSelecionado}
          onFechar={() => setRegistroSelecionado(null)}
        />
      )}
    </div>
  );
}

function ModalVisualizacao({ registro, onFechar }) {
  const formatarData = (data) => {
    if (!data) return 'Data não informada';
    return new Date(data).toLocaleDateString('pt-BR');
  };

  const formatarValor = (valor) => {
    if (isNaN(valor) || valor === null || valor === undefined) return 'R$ 0,00';
    return `R$ ${parseFloat(valor).toFixed(2)}`;
  };

  return (
    <div className="fixed inset-0 bg-black bg- flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md max-h-full overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold text-gray-900">Detalhes do Registro</h2>
          <button onClick={onFechar} className="p-2 hover:bg-gray-200 rounded-full">
            <ChevronLeft size={24} />
          </button>
        </div>
        <div className="space-y-4">
          <p><strong>ID:</strong> {registro.ID}</p>
          <p><strong>Data:</strong> {formatarData(registro.data)}</p>
          <p><strong>Valor:</strong> <span className={registro.valor1 > 0 ? 'text-green-600' : 'text-red-600'}>{formatarValor(registro.valor1)}</span></p>
          <p><strong>Descrição:</strong> {registro.descricao}</p>
          <p><strong>Grupo 1:</strong> {registro.grupo1}</p>
          <p><strong>Grupo 2:</strong> {registro.grupo2}</p>
          <p><strong>Nome:</strong> {registro.nome}</p>
        </div>
      </div>
    </div>
  );
}

export default Caixa;



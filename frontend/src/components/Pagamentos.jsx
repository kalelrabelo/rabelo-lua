import React, { useState, useEffect } from 'react';
import { Pencil, Trash2, Plus, Search, Calendar, User, DollarSign, FileText, ChevronLeft, ChevronRight, Filter, Printer } from 'lucide-react';
import pagamentosIniciais from '../data/pagamentosData.js';

function Pagamentos() {
  const [pagamentos, setPagamentos] = useState([]);
  const [pagamentoEditando, setPagamentoEditando] = useState(null);
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [termoBusca, setTermoBusca] = useState('');
  const [pagamentosFiltrados, setPagamentosFiltrados] = useState([]);
  const [paginaAtual, setPaginaAtual] = useState(1);
  const [pagamentosPorPagina] = useState(20);
  const [filtroMes, setFiltroMes] = useState('');
  const [filtroAno, setFiltroAno] = useState('');
  const [filtroFuncionario, setFiltroFuncionario] = useState('');

  // Calcular índices para paginação
  const indiceUltimoPagamento = paginaAtual * pagamentosPorPagina;
  const indicePrimeiroPagamento = indiceUltimoPagamento - pagamentosPorPagina;
  const pagamentosAtuais = pagamentosFiltrados.slice(indicePrimeiroPagamento, indiceUltimoPagamento);
  const totalPaginas = Math.ceil(pagamentosFiltrados.length / pagamentosPorPagina);

  // Obter listas únicas para filtros
  const anosDisponiveis = [...new Set(pagamentos.map(p => p.ano))].filter(ano => ano > 2005).sort((a, b) => b - a);
  const funcionariosDisponiveis = [...new Set(pagamentos.map(p => p.funcionario_nome))].sort();

  const mesesNomes = [
    '', 'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
  ];

  useEffect(() => {
    // Carregar dados iniciais
    setPagamentos(pagamentosIniciais);
    setPagamentosFiltrados(pagamentosIniciais);
  }, []);

  useEffect(() => {
    // Filtrar pagamentos baseado nos critérios
    let filtrados = (Array.isArray(pagamentos) ? pagamentos : []).filter(pagamento => {
      const matchBusca = pagamento.funcionario_nome.toLowerCase().includes(termoBusca.toLowerCase());
      const matchMes = !filtroMes || pagamento.mes.toString() === filtroMes;
      const matchAno = !filtroAno || pagamento.ano.toString() === filtroAno;
      const matchFuncionario = !filtroFuncionario || pagamento.funcionario_nome === filtroFuncionario;
      
      return matchBusca && matchMes && matchAno && matchFuncionario;
    });
    
    setPagamentosFiltrados(filtrados);
    setPaginaAtual(1); // Reset para primeira página quando filtrar
  }, [termoBusca, filtroMes, filtroAno, filtroFuncionario, pagamentos]);

  const formatarMoeda = (valor) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(valor);
  };

  const handleSalvarPagamento = (pagamento) => {
    if (pagamentoEditando) {
      // Editar pagamento existente
      setPagamentos(pagamentos.map(p => p.id === pagamento.id ? pagamento : p));
    } else {
      // Adicionar novo pagamento
      const novoPagamento = {
        ...pagamento,
        id: Math.max(...pagamentos.map(p => p.id), 0) + 1
      };
      setPagamentos([...pagamentos, novoPagamento]);
    }
    setPagamentoEditando(null);
    setMostrarFormulario(false);
  };

  const handleEditarPagamento = (pagamento) => {
    setPagamentoEditando(pagamento);
    setMostrarFormulario(true);
  };

  const handleExcluirPagamento = (id) => {
    if (window.confirm('Tem certeza que deseja excluir este pagamento?')) {
      setPagamentos((Array.isArray(pagamentos) ? pagamentos : []).filter(p => p.id !== id));
    }
  };

  const handleNovoPagamento = () => {
    setPagamentoEditando(null);
    setMostrarFormulario(true);
  };

  const handlePaginaAnterior = () => {
    setPaginaAtual(prev => Math.max(prev - 1, 1));
  };

  const handleProximaPagina = () => {
    setPaginaAtual(prev => Math.min(prev + 1, totalPaginas));
  };

  const handleImprimirFolha = (pagamento) => {
    // Criar conteúdo para impressão
    const conteudoImpressao = `
      <html>
        <head>
          <title>Folha de Pagamento - ${pagamento.funcionario_nome}</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            .header { text-align: center; margin-bottom: 30px; }
            .info { margin-bottom: 20px; }
            .table { width: 100%; border-collapse: collapse; }
            .table th, .table td { border: 1px solid #ddd; padding: 8px; text-align: left; }
            .table th { background-color: #f2f2f2; }
            .total { font-weight: bold; background-color: #e8f5e8; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>FOLHA DE PAGAMENTO</h1>
            <h2>Sistema de Gestão de Joias</h2>
          </div>
          
          <div class="info">
            <p><strong>Funcionário:</strong> ${pagamento.funcionario_nome}</p>
            <p><strong>Período:</strong> ${mesesNomes[pagamento.mes]}/${pagamento.ano}</p>
            <p><strong>Data de Emissão:</strong> ${new Date().toLocaleDateString('pt-BR')}</p>
          </div>
          
          <table class="table">
            <tr><th>Descrição</th><th>Valor</th></tr>
            <tr><td>Salário Base</td><td>${formatarMoeda(pagamento.salario_base)}</td></tr>
            <tr><td>Produção</td><td>${formatarMoeda(pagamento.producao)}</td></tr>
            <tr><td>Bônus</td><td>${formatarMoeda(pagamento.bonus)}</td></tr>
            <tr><td>Salário Família</td><td>${formatarMoeda(pagamento.salario_familia)}</td></tr>
            <tr><td>Horas Extras (${pagamento.horas_extras.toFixed(2)}h)</td><td>${formatarMoeda(pagamento.valor_horas_extras)}</td></tr>
            <tr><td>Outras Adições</td><td>${formatarMoeda(pagamento.outras_adicoes)}</td></tr>
            <tr><td colspan="2"><strong>DESCONTOS</strong></td></tr>
            <tr><td>Desconto de Vales</td><td>-${formatarMoeda(pagamento.desconto_vales)}</td></tr>
            <tr><td>INSS</td><td>-${formatarMoeda(pagamento.inss)}</td></tr>
            <tr><td>Faltas</td><td>-${formatarMoeda(pagamento.faltas)}</td></tr>
            <tr><td>Outras Deduções</td><td>-${formatarMoeda(pagamento.outras_deducoes)}</td></tr>
            <tr class="total"><td><strong>SALÁRIO LÍQUIDO</strong></td><td><strong>${formatarMoeda(pagamento.salario_liquido)}</strong></td></tr>
          </table>
          
          <div style="margin-top: 50px;">
            <p>_________________________</p>
            <p>Assinatura do Funcionário</p>
          </div>
        </body>
      </html>
    `;
    
    // Abrir janela de impressão
    const janelaImpressao = window.open('', '_blank');
    janelaImpressao.document.write(conteudoImpressao);
    janelaImpressao.document.close();
    janelaImpressao.print();
  };

  const limparFiltros = () => {
    setFiltroMes('');
    setFiltroAno('');
    setFiltroFuncionario('');
    setTermoBusca('');
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-3xl font-bold text-gray-900">Folha de Pagamento</h2>
          <p className="text-gray-600">Gerenciamento de {pagamentosFiltrados.length} registros de pagamento</p>
        </div>
        <button
          onClick={handleNovoPagamento}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-blue-700"
        >
          <Plus size={20} />
          Novo Pagamento
        </button>
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
            <label className="block text-sm font-medium text-gray-700 mb-1">Buscar Funcionário</label>
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Nome do funcionário..."
                value={termoBusca}
                onChange={(e) => setTermoBusca(e.target.value)}
                className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
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
            <label className="block text-sm font-medium text-gray-700 mb-1">Funcionário</label>
            <select
              value={filtroFuncionario}
              onChange={(e) => setFiltroFuncionario(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Todos os funcionários</option>
              {funcionariosDisponiveis.map(funcionario => (
                <option key={funcionario} value={funcionario}>{funcionario}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Informações de paginação */}
      <div className="mb-4 text-sm text-gray-600">
        Mostrando {indicePrimeiroPagamento + 1} a {Math.min(indiceUltimoPagamento, pagamentosFiltrados.length)} de {pagamentosFiltrados.length} pagamentos
      </div>

      {/* Lista de pagamentos */}
      <div className="grid gap-4">
        {pagamentosAtuais.map((pagamento) => (
          <div key={pagamento.id} className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
            <div className="flex justify-between items-start">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <User size={20} className="text-blue-600" />
                  <h3 className="text-xl font-semibold text-gray-900">
                    {pagamento.funcionario_nome}
                  </h3>
                  <span className="bg-blue-100 text-blue-800 text-sm px-2 py-1 rounded">
                    {mesesNomes[pagamento.mes]}/{pagamento.ano}
                  </span>
                </div>
                
                <div className="grid md:grid-cols-3 gap-4 text-sm text-gray-600">
                  <div className="space-y-2">
                    <h4 className="font-semibold text-gray-800">Proventos</h4>
                    <div className="flex justify-between">
                      <span>Salário Base:</span>
                      <span className="text-green-600">{formatarMoeda(pagamento.salario_base)}</span>
                    </div>
                    {pagamento.producao > 0 && (
                      <div className="flex justify-between">
                        <span>Produção:</span>
                        <span className="text-green-600">{formatarMoeda(pagamento.producao)}</span>
                      </div>
                    )}
                    {pagamento.bonus > 0 && (
                      <div className="flex justify-between">
                        <span>Bônus:</span>
                        <span className="text-green-600">{formatarMoeda(pagamento.bonus)}</span>
                      </div>
                    )}
                    {pagamento.valor_horas_extras > 0 && (
                      <div className="flex justify-between">
                        <span>Horas Extras ({pagamento.horas_extras.toFixed(1)}h):</span>
                        <span className="text-green-600">{formatarMoeda(pagamento.valor_horas_extras)}</span>
                      </div>
                    )}
                  </div>
                  
                  <div className="space-y-2">
                    <h4 className="font-semibold text-gray-800">Descontos</h4>
                    {pagamento.desconto_vales > 0 && (
                      <div className="flex justify-between">
                        <span>Vales:</span>
                        <span className="text-red-600">-{formatarMoeda(pagamento.desconto_vales)}</span>
                      </div>
                    )}
                    {pagamento.inss > 0 && (
                      <div className="flex justify-between">
                        <span>INSS:</span>
                        <span className="text-red-600">-{formatarMoeda(pagamento.inss)}</span>
                      </div>
                    )}
                    {pagamento.faltas > 0 && (
                      <div className="flex justify-between">
                        <span>Faltas:</span>
                        <span className="text-red-600">-{formatarMoeda(pagamento.faltas)}</span>
                      </div>
                    )}
                  </div>
                  
                  <div className="space-y-2">
                    <h4 className="font-semibold text-gray-800">Resumo</h4>
                    <div className="flex justify-between text-lg font-bold">
                      <span>Salário Líquido:</span>
                      <span className={pagamento.salario_liquido >= 0 ? "text-green-600" : "text-red-600"}>
                        {formatarMoeda(pagamento.salario_liquido)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="flex gap-2 ml-4">
                <button
                  onClick={() => handleImprimirFolha(pagamento)}
                  className="p-2 text-green-600 hover:bg-green-50 rounded-lg"
                  title="Imprimir folha de pagamento"
                >
                  <Printer size={16} />
                </button>
                <button
                  onClick={() => handleEditarPagamento(pagamento)}
                  className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"
                  title="Editar pagamento"
                >
                  <Pencil size={16} />
                </button>
                <button
                  onClick={() => handleExcluirPagamento(pagamento.id)}
                  className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                  title="Excluir pagamento"
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

      {pagamentosFiltrados.length === 0 && (
        <div className="text-center py-12">
          <DollarSign size={48} className="mx-auto text-gray-400 mb-4" />
          <p className="text-gray-500">Nenhum pagamento encontrado</p>
        </div>
      )}

      {/* Modal de formulário */}
      {mostrarFormulario && (
        <FormularioPagamento
          pagamento={pagamentoEditando}
          funcionarios={funcionariosDisponiveis}
          onSalvar={handleSalvarPagamento}
          onCancelar={() => {
            setMostrarFormulario(false);
            setPagamentoEditando(null);
          }}
        />
      )}
    </div>
  );
}

function FormularioPagamento({ pagamento, funcionarios, onSalvar, onCancelar }) {
  const [formData, setFormData] = useState({
    funcionario_nome: pagamento?.funcionario_nome || '',
    mes: pagamento?.mes || new Date().getMonth() + 1,
    ano: pagamento?.ano || new Date().getFullYear(),
    salario_base: pagamento?.salario_base || 0,
    producao: pagamento?.producao || 0,
    bonus: pagamento?.bonus || 0,
    salario_familia: pagamento?.salario_familia || 0,
    desconto_vales: pagamento?.desconto_vales || 0,
    inss: pagamento?.inss || 0,
    faltas: pagamento?.faltas || 0,
    horas_extras: pagamento?.horas_extras || 0,
    valor_hora_extra: pagamento?.valor_hora_extra || 0,
    outras_adicoes: pagamento?.outras_adicoes || 0,
    outras_deducoes: pagamento?.outras_deducoes || 0
  });

  const mesesNomes = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
  ];

  const calcularSalarioLiquido = () => {
    const proventos = parseFloat(formData.salario_base) + 
                     parseFloat(formData.producao) + 
                     parseFloat(formData.bonus) + 
                     parseFloat(formData.salario_familia) + 
                     (parseFloat(formData.horas_extras) * parseFloat(formData.valor_hora_extra)) +
                     parseFloat(formData.outras_adicoes);
    
    const descontos = parseFloat(formData.desconto_vales) + 
                     parseFloat(formData.inss) + 
                     parseFloat(formData.faltas) + 
                     parseFloat(formData.outras_deducoes);
    
    return proventos - descontos;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const pagamentoData = {
      ...formData,
      id: pagamento?.id,
      funcionario_id: pagamento?.funcionario_id || Math.floor(Math.random() * 1000),
      valor_horas_extras: parseFloat(formData.horas_extras) * parseFloat(formData.valor_hora_extra),
      salario_liquido: calcularSalarioLiquido()
    };
    onSalvar(pagamentoData);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <h3 className="text-xl font-semibold mb-4">
          {pagamento ? 'Editar Pagamento' : 'Novo Pagamento'}
        </h3>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Funcionário</label>
              <select
                value={formData.funcionario_nome}
                onChange={(e) => setFormData({...formData, funcionario_nome: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              >
                <option value="">Selecione um funcionário</option>
                {funcionarios.map(funcionario => (
                  <option key={funcionario} value={funcionario}>{funcionario}</option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Mês</label>
              <select
                value={formData.mes}
                onChange={(e) => setFormData({...formData, mes: parseInt(e.target.value)})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              >
                {mesesNomes.map((mes, index) => (
                  <option key={index + 1} value={index + 1}>{mes}</option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Ano</label>
              <input
                type="number"
                value={formData.ano}
                onChange={(e) => setFormData({...formData, ano: parseInt(e.target.value)})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <h4 className="text-lg font-semibold text-green-700 mb-3">Proventos</h4>
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Salário Base</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.salario_base}
                    onChange={(e) => setFormData({...formData, salario_base: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Produção</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.producao}
                    onChange={(e) => setFormData({...formData, producao: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Bônus</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.bonus}
                    onChange={(e) => setFormData({...formData, bonus: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Salário Família</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.salario_familia}
                    onChange={(e) => setFormData({...formData, salario_familia: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Horas Extras</label>
                    <input
                      type="number"
                      step="0.1"
                      value={formData.horas_extras}
                      onChange={(e) => setFormData({...formData, horas_extras: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Valor/Hora</label>
                    <input
                      type="number"
                      step="0.01"
                      value={formData.valor_hora_extra}
                      onChange={(e) => setFormData({...formData, valor_hora_extra: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Outras Adições</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.outras_adicoes}
                    onChange={(e) => setFormData({...formData, outras_adicoes: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>
            </div>

            <div>
              <h4 className="text-lg font-semibold text-red-700 mb-3">Descontos</h4>
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Desconto de Vales</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.desconto_vales}
                    onChange={(e) => setFormData({...formData, desconto_vales: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">INSS</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.inss}
                    onChange={(e) => setFormData({...formData, inss: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Faltas</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.faltas}
                    onChange={(e) => setFormData({...formData, faltas: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Outras Deduções</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.outras_deducoes}
                    onChange={(e) => setFormData({...formData, outras_deducoes: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="flex justify-between items-center text-lg font-bold">
              <span>Salário Líquido:</span>
              <span className={calcularSalarioLiquido() >= 0 ? "text-green-600" : "text-red-600"}>
                {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(calcularSalarioLiquido())}
              </span>
            </div>
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

export default Pagamentos;


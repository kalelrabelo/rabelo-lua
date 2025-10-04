import React, { useState, useEffect } from 'react';
import { Mail, Search, Calendar, User, FileText, ChevronLeft, ChevronRight, Filter, Printer, Eye, MapPin, Clock } from 'lucide-react';
import cartasIniciais from '../data/cartasData.js';

function Cartas() {
  const [cartas, setCartas] = useState([]);
  const [cartasFiltradas, setCartasFiltradas] = useState([]);
  const [paginaAtual, setPaginaAtual] = useState(1);
  const [cartasPorPagina] = useState(10);
  const [termoBusca, setTermoBusca] = useState('');
  const [filtroAno, setFiltroAno] = useState('');
  const [filtroMes, setFiltroMes] = useState('');
  const [filtroAutor, setFiltroAutor] = useState('');
  const [cartaSelecionada, setCartaSelecionada] = useState(null);


  const handleCreate = () => {
    // Implementação será adicionada
    console.log('Criar novo item');
  };

  const handleEdit = (item) => {
    // Implementação será adicionada
    console.log('Editar item:', item);
  };

  const handleDelete = (id) => {
    if (confirm('Tem certeza que deseja excluir este item?')) {
      // Implementação será adicionada
      console.log('Deletar item:', id);
    }
  };

  // Calcular índices para paginação
  const indiceUltimaCarta = paginaAtual * cartasPorPagina;
  const indicePrimeiraCarta = indiceUltimaCarta - cartasPorPagina;
  const cartasAtuais = cartasFiltradas.slice(indicePrimeiraCarta, indiceUltimaCarta);
  const totalPaginas = Math.ceil(cartasFiltradas.length / cartasPorPagina);

  // Obter listas únicas para filtros
  const anosDisponiveis = [...new Set(cartas.map(c => {
    if (c.data) {
      return new Date(c.data).getFullYear();
    }
    return null;
  }).filter(ano => ano !== null))].sort((a, b) => b - a);
  
  const autoresDisponiveis = [...new Set(cartas.map(c => c.autor).filter(autor => autor))].sort();

  const mesesNomes = [
    '', 'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
  ];

  useEffect(() => {
    // Carregar dados iniciais
    setCartas(cartasIniciais);
    setCartasFiltradas(cartasIniciais);
  }, []);

  useEffect(() => {
    // Filtrar cartas baseado nos critérios
    let filtradas = (Array.isArray(cartas) ? cartas : []).filter(carta => {
      const matchBusca = 
        (carta.assunto && carta.assunto.toLowerCase().includes(termoBusca.toLowerCase())) ||
        (carta.mensagem && carta.mensagem.toLowerCase().includes(termoBusca.toLowerCase())) ||
        (carta.autor && carta.autor.toLowerCase().includes(termoBusca.toLowerCase())) ||
        (carta.remetente1 && carta.remetente1.toLowerCase().includes(termoBusca.toLowerCase()));
      
      const matchAno = !filtroAno || (carta.data && new Date(carta.data).getFullYear().toString() === filtroAno);
      const matchMes = !filtroMes || (carta.data && (new Date(carta.data).getMonth() + 1).toString() === filtroMes);
      const matchAutor = !filtroAutor || carta.autor === filtroAutor;
      
      return matchBusca && matchAno && matchMes && matchAutor;
    });
    
    setCartasFiltradas(filtradas);
    setPaginaAtual(1); // Reset para primeira página quando filtrar
  }, [termoBusca, filtroAno, filtroMes, filtroAutor, cartas]);

  const formatarData = (data) => {
    if (!data) return 'Data não informada';
    try {
      return new Date(data).toLocaleDateString('pt-BR');
    } catch {
      return data;
    }
  };

  const getTipoRelatorio = (assunto) => {
    if (!assunto) return 'Relatório';
    const assuntoLower = assunto.toLowerCase();
    if (assuntoLower.includes('relatório do dia')) return 'Relatório Diário';
    if (assuntoLower.includes('tabela')) return 'Tabela';
    if (assuntoLower.includes('preços')) return 'Preços';
    if (assuntoLower.includes('produção')) return 'Produção';
    return 'Relatório';
  };

  const getCorTipo = (tipo) => {
    switch (tipo.toLowerCase()) {
      case 'relatório diário': return 'bg-blue-100 text-blue-800';
      case 'tabela': return 'bg-green-100 text-green-800';
      case 'preços': return 'bg-orange-100 text-orange-800';
      case 'produção': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const handlePaginaAnterior = () => {
    setPaginaAtual(prev => Math.max(prev - 1, 1));
  };

  const handleProximaPagina = () => {
    setPaginaAtual(prev => Math.min(prev + 1, totalPaginas));
  };

  const handleVisualizarCarta = (carta) => {
    setCartaSelecionada(carta);
  };

  const handleImprimirCarta = (carta) => {
    // Criar conteúdo para impressão
    const conteudoImpressao = `
      <html>
        <head>
          <title>Carta/Relatório - ${carta.assunto || 'Sem Assunto'}</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; line-height: 1.6; }
            .header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #333; padding-bottom: 20px; }
            .info { margin-bottom: 20px; }
            .remetente, .destinatario { margin-bottom: 15px; padding: 10px; background-color: #f5f5f5; }
            .mensagem { margin: 20px 0; padding: 15px; border-left: 4px solid #007bff; background-color: #f8f9fa; }
            .footer { margin-top: 30px; text-align: center; font-size: 12px; color: #666; }
            h1, h2, h3 { color: #333; }
            .data-local { text-align: right; margin-bottom: 20px; font-style: italic; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>CARTA/RELATÓRIO</h1>
            <h2>Sistema de Gestão de Joias</h2>
          </div>
          
          <div class="data-local">
            <p><strong>${carta.lugar || ''}</strong> ${formatarData(carta.data)}</p>
          </div>
          
          <div class="remetente">
            <h3>Remetente:</h3>
            <p><strong>${carta.remetente1 || ''}</strong></p>
            <p>${carta.remetente2 || ''}</p>
            <p>${carta.remetente3 || ''}</p>
            <p>${carta.remetente4 || ''} ${carta.remetente6 || ''}</p>
            <p>${carta.remetente7 || ''}</p>
            <p>${carta.remetente8 || ''}</p>
            <p>${carta.remetente9 || ''}</p>
            <p>${carta.remetente10 || ''}</p>
          </div>
          
          <div class="destinatario">
            <h3>Destinatário:</h3>
            <p><strong>${carta.des1 || ''}</strong></p>
            <p>${carta.des2 || ''}</p>
            <p>${carta.des3 || ''}</p>
            <p>${carta.des4 || ''}</p>
            <p>${carta.des5 || ''} ${carta.des6 || ''}</p>
            <p>${carta.des7 || ''}</p>
          </div>
          
          <div class="info">
            <h3>Assunto:</h3>
            <p><strong>${carta.assunto || 'Sem assunto'}</strong></p>
          </div>
          
          <div class="mensagem">
            <h3>Mensagem:</h3>
            <div style="white-space: pre-wrap;">${carta.mensagem || 'Sem mensagem'}</div>
          </div>
          
          <div class="footer">
            <p>Autor: ${carta.autor || 'Não informado'}</p>
            <p>Estado: ${carta.estado || 'Não informado'}</p>
            <p>Tipo: ${carta.noticia || 'Não informado'}</p>
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
    setFiltroAno('');
    setFiltroMes('');
    setFiltroAutor('');
    setTermoBusca('');
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-3xl font-bold text-gray-900">Sistema de Cartas</h2>
          <p className="text-gray-600">Gerenciamento de {cartasFiltradas.length} cartas e relatórios</p>
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
                placeholder="Assunto, mensagem, autor..."
                value={termoBusca}
                onChange={(e) => setTermoBusca(e.target.value)}
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
            <label className="block text-sm font-medium text-gray-700 mb-1">Autor</label>
            <select
              value={filtroAutor}
              onChange={(e) => setFiltroAutor(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Todos os autores</option>
              {autoresDisponiveis.map(autor => (
                <option key={autor} value={autor}>{autor}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Informações de paginação */}
      <div className="mb-4 text-sm text-gray-600">
        Mostrando {indicePrimeiraCarta + 1} a {Math.min(indiceUltimaCarta, cartasFiltradas.length)} de {cartasFiltradas.length} cartas
      </div>

      {/* Lista de cartas */}
      <div className="grid gap-4">
        {cartasAtuais.map((carta) => {
          const tipoRelatorio = getTipoRelatorio(carta.assunto);
          return (
            <div key={carta.idca} className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <Mail size={20} className="text-blue-600" />
                    <h3 className="text-xl font-semibold text-gray-900">
                      {carta.assunto || 'Sem Assunto'}
                    </h3>
                    <span className={`text-sm px-2 py-1 rounded ${getCorTipo(tipoRelatorio)}`}>
                      {tipoRelatorio}
                    </span>
                  </div>
                  
                  <div className="grid md:grid-cols-3 gap-4 text-sm text-gray-600">
                    <div className="space-y-2">
                      <h4 className="font-semibold text-gray-800">Informações</h4>
                      <div className="flex items-center gap-2">
                        <Calendar size={16} />
                        <span>{formatarData(carta.data)}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <MapPin size={16} />
                        <span>{carta.lugar || 'Local não informado'}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <User size={16} />
                        <span>{carta.autor || 'Autor não informado'}</span>
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <h4 className="font-semibold text-gray-800">Remetente</h4>
                      <p className="text-gray-700">{carta.remetente1 || 'Não informado'}</p>
                      <p className="text-gray-700">{carta.remetente2 || ''}</p>
                    </div>
                    
                    <div className="space-y-2">
                      <h4 className="font-semibold text-gray-800">Destinatário</h4>
                      <p className="text-gray-700">{carta.des1 || 'Não informado'}</p>
                      <p className="text-gray-700">{carta.des2 || ''}</p>
                    </div>
                  </div>
                  
                  {carta.mensagem && (
                    <div className="mt-4">
                      <h4 className="font-semibold text-gray-800 mb-2">Prévia da Mensagem</h4>
                      <p className="text-gray-700 text-sm line-clamp-3">
                        {carta.mensagem.substring(0, 200)}...
                      </p>
                    </div>
                  )}
                </div>
                
                <div className="flex gap-2 ml-4">
                  <button
                    onClick={() => handleVisualizarCarta(carta)}
                    className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"
                    title="Visualizar carta completa"
                  >
                    <Eye size={16} />
                  </button>
                  <button
                    onClick={() => handleImprimirCarta(carta)}
                    className="p-2 text-green-600 hover:bg-green-50 rounded-lg"
                    title="Imprimir carta"
                  >
                    <Printer size={16} />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
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

      {cartasFiltradas.length === 0 && (
        <div className="text-center py-12">
          <Mail size={48} className="mx-auto text-gray-400 mb-4" />
          <p className="text-gray-500">Nenhuma carta encontrada</p>
        </div>
      )}

      {/* Modal de visualização */}
      {cartaSelecionada && (
        <ModalVisualizacao
          carta={cartaSelecionada}
          onFechar={() => setCartaSelecionada(null)}
          onImprimir={() => handleImprimirCarta(cartaSelecionada)}
        />
      )}
    </div>
  );
}

function ModalVisualizacao({ carta, onFechar, onImprimir }) {
  const formatarData = (data) => {
    if (!data) return 'Data não informada';
    try {
      return new Date(data).toLocaleDateString('pt-BR');
    } catch {
      return data;
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg- flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-semibold">
            {carta.assunto || 'Carta sem Assunto'}
          </h3>
          <div className="flex gap-2">
            <button
              onClick={onImprimir}
              className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 flex items-center gap-2"
            >
              <Printer size={16} />
              Imprimir
            </button>
            <button
              onClick={onFechar}
              className="bg-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-400"
            >
              Fechar
            </button>
          </div>
        </div>
        
        <div className="space-y-6">
          {/* Cabeçalho */}
          <div className="text-right text-sm text-gray-600">
            <p><strong>{carta.lugar || ''}</strong> {formatarData(carta.data)}</p>
          </div>

          {/* Remetente */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <h4 className="font-semibold text-gray-800 mb-2">Remetente:</h4>
            <div className="text-sm text-gray-700">
              <p><strong>{carta.remetente1 || ''}</strong></p>
              <p>{carta.remetente2 || ''}</p>
              <p>{carta.remetente3 || ''}</p>
              <p>{carta.remetente4 || ''} {carta.remetente6 || ''}</p>
              <p>{carta.remetente7 || ''}</p>
              <p>{carta.remetente8 || ''}</p>
              <p>{carta.remetente9 || ''}</p>
              <p>{carta.remetente10 || ''}</p>
            </div>
          </div>

          {/* Destinatário */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <h4 className="font-semibold text-gray-800 mb-2">Destinatário:</h4>
            <div className="text-sm text-gray-700">
              <p><strong>{carta.des1 || ''}</strong></p>
              <p>{carta.des2 || ''}</p>
              <p>{carta.des3 || ''}</p>
              <p>{carta.des4 || ''}</p>
              <p>{carta.des5 || ''} {carta.des6 || ''}</p>
              <p>{carta.des7 || ''}</p>
            </div>
          </div>

          {/* Assunto */}
          <div>
            <h4 className="font-semibold text-gray-800 mb-2">Assunto:</h4>
            <p className="text-gray-700">{carta.assunto || 'Sem assunto'}</p>
          </div>

          {/* Mensagem */}
          <div className="bg-blue-50 p-4 rounded-lg border-l-4 border-blue-500">
            <h4 className="font-semibold text-gray-800 mb-2">Mensagem:</h4>
            <div className="text-gray-700 whitespace-pre-wrap">
              {carta.mensagem || 'Sem mensagem'}
            </div>
          </div>

          {/* Rodapé */}
          <div className="text-center text-sm text-gray-600 border-t pt-4">
            <p>Autor: {carta.autor || 'Não informado'}</p>
            <p>Estado: {carta.estado || 'Não informado'}</p>
            <p>Tipo: {carta.noticia || 'Não informado'}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Cartas;



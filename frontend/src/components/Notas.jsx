import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, Plus, Edit, Trash2, FileText, Calculator, Sparkles, X } from 'lucide-react';

function Notas() {
  const [notas, setNotas] = useState([]);
  const [impostos, setImpostos] = useState([]);
  const [selectedNota, setSelectedNota] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isCreateMode, setIsCreateMode] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredNotas, setFilteredNotas] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [sugestoes, setSugestoes] = useState([]);
  const [showSugestoes, setShowSugestoes] = useState(false);
  const itemsPerPage = 10;

  // Estado para nova nota
  const [novaNota, setNovaNota] = useState({
    remetente1: '',
    remetente2: '',
    remetente3: '',
    remetente4: '',
    remetente6: '',
    remetente7: '',
    remetente8: '',
    remetente9: '',
    remetente10: '',
    des1: '',
    des2: '',
    des3: '',
    des4: '',
    des5: '',
    des6: '',
    des7: '',
    des8: '',
    fax: '',
    email: '',
    data: '',
    lugar: '',
    mensagem: '',
    noticia: '',
    modo: '',
    autor: '',
    estadonota: '',
    pago: 0,
    desconto: 0,
    valor: '',
    cambio: 1.0
  });

  // Estado para filtro inteligente
  const [filtroInteligente, setFiltroInteligente] = useState('');
  const [tipoFiltro, setTipoFiltro] = useState('auto');

  useEffect(() => {
    fetchNotas();
    fetchImpostos();
  }, []);

  useEffect(() => {
    const filtered = (Array.isArray(notas) ? notas : []).filter(nota =>
      (nota.remetente1 || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (nota.des1 || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (nota.noticia || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (nota.modo || '').toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredNotas(filtered);
    setCurrentPage(1);
  }, [searchTerm, notas]);

  const fetchNotas = async () => {
    try {
      const response = await fetch('/api/notas');
      const data = await response.json();
      setNotas(data);
    } catch (error) {
      console.error('Erro ao buscar notas:', error);
    }
  };

  const fetchImpostos = async () => {
    try {
      const response = await fetch('/api/impostos');
      const data = await response.json();
      setImpostos(data);
    } catch (error) {
      console.error('Erro ao buscar impostos:', error);
    }
  };

  const handleNotaClick = (nota) => {
    setSelectedNota(nota);
    setIsCreateMode(false);
    setIsModalOpen(true);
  };

  const handleCreateNota = () => {
    setSelectedNota(null);
    setNovaNota({
      remetente1: '',
      remetente2: '',
      remetente3: '',
      remetente4: '',
      remetente6: '',
      remetente7: '',
      remetente8: '',
      remetente9: '',
      remetente10: '',
      des1: '',
      des2: '',
      des3: '',
      des4: '',
      des5: '',
      des6: '',
      des7: '',
      des8: '',
      fax: '',
      email: '',
      data: new Date().toISOString().slice(0, 16),
      lugar: '',
      mensagem: '',
      noticia: '',
      modo: '',
      autor: 'Sistema',
      estadonota: 'Rascunho',
      pago: 0,
      desconto: 0,
      valor: '',
      cambio: 1.0
    });
    setIsCreateMode(true);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedNota(null);
    setIsCreateMode(false);
    setFiltroInteligente('');
    setSugestoes([]);
    setShowSugestoes(false);
  };

  const handleSaveNota = async () => {
    try {
      setLoading(true);
      const url = isCreateMode 
        ? '/api/notas'
        : `/api/notas/${selectedNota.id}`;
      
      const method = isCreateMode ? 'POST' : 'PUT';
      const data = isCreateMode ? novaNota : selectedNota;

      const response = await fetch(url, {
        method: method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (response.ok) {
        await fetchNotas();
        closeModal();
      } else {
        console.error('Erro ao salvar nota');
      }
    } catch (error) {
      console.error('Erro ao salvar nota:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteNota = async (notaId) => {
    if (window.confirm('Tem certeza que deseja deletar esta nota?')) {
      try {
        const response = await fetch(`/api/notas/${notaId}`, {
          method: 'DELETE',
        });

        if (response.ok) {
          await fetchNotas();
        } else {
          console.error('Erro ao deletar nota');
        }
      } catch (error) {
        console.error('Erro ao deletar nota:', error);
      }
    }
  };

  const handleFiltroInteligente = async () => {
    if (!filtroInteligente.trim()) return;

    try {
      setLoading(true);
      const response = await fetch('/api/notas/preencher_auto', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          filtro: filtroInteligente,
          tipo_filtro: tipoFiltro
        }),
      });

      if (response.ok) {
        const data = await response.json();
        
        // Preencher os campos da nova nota com os dados retornados
        setNovaNota(prev => ({
          ...prev,
          ...data,
          data: new Date().toISOString().slice(0, 16), // Manter data atual
          autor: 'Sistema',
          estadonota: 'Rascunho'
        }));

        // Mostrar produtos encontrados se houver
        if (data.produtos_encontrados && data.produtos_encontrados.length > 0) {
          setSugestoes(data.produtos_encontrados);
          setShowSugestoes(true);
        }
      } else {
        console.error('Erro ao aplicar filtro inteligente');
      }
    } catch (error) {
      console.error('Erro ao aplicar filtro inteligente:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCalcularImpostos = async () => {
    if (!novaNota.valor) return;

    try {
      const valorBase = parseFloat(novaNota.valor.replace(/[^\d.,]/g, '').replace(',', '.'));
      
      const response = await fetch('/api/notas/calcular_impostos', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          valor_base: valorBase,
          tipo_imposto: ''
        }),
      });

      if (response.ok) {
        const data = await response.json();
        
        // Atualizar campos de imposto na nota
        if (data.impostos_aplicados.length > 0) {
          const imposto1 = data.impostos_aplicados[0];
          setNovaNota(prev => ({
            ...prev,
            imposto1: imposto1.nome,
            imposto1v: imposto1.valor.toFixed(2),
            valor: `R$ ${data.valor_total.toFixed(2)}`
          }));
        }
      }
    } catch (error) {
      console.error('Erro ao calcular impostos:', error);
    }
  };

  // Lógica de paginação
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredNotas.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredNotas.length / itemsPerPage);

  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold text-white">Sistema de Notas Fiscais</h2>
          <p className="text-gray-400">Gerencie e emita notas fiscais com preenchimento inteligente. Total: {filteredNotas.length} notas</p>
        </div>
        <Button onClick={handleCreateNota} className="bg-blue-600 hover:bg-blue-700">
          <Plus className="h-4 w-4 mr-2" />
          Nova Nota
        </Button>
      </div>

      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
        <Input
          placeholder="Pesquisar notas por cliente, destinatário, notícia ou modo..."
          className="pl-10 bg-gray-800 border-gray-600 text-white placeholder-gray-400"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {/* Notas Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {currentItems.map((nota) => (
          <Card key={nota.id} className="cursor-pointer hover:shadow-lg transition-all duration-200 hover:scale-105 bg-gray-900 border-gray-600" onClick={() => handleNotaClick(nota)}>
            <CardHeader className="p-4">
              <div className="flex justify-between items-start">
                <CardTitle className="text-lg text-white">Nota #{nota.idn || nota.id}</CardTitle>
                <div className="flex space-x-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteNota(nota.id);
                    }}
                    className="text-red-400 hover:text-red-300 hover:bg-red-900/20"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-4 pt-0">
              <div className="space-y-2">
                <div>
                  <p className="text-sm text-gray-400">Cliente:</p>
                  <p className="text-white font-medium">{nota.remetente1 || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-400">Data:</p>
                  <p className="text-white">{nota.data ? new Date(nota.data).toLocaleDateString() : 'N/A'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-400">Modo:</p>
                  <Badge variant="secondary" className="bg-gray-700 text-gray-200">{nota.modo || 'N/A'}</Badge>
                </div>
                <div>
                  <p className="text-sm text-gray-400">Status:</p>
                  <Badge variant={nota.pago ? "default" : "secondary"} className={nota.pago ? "bg-green-600" : "bg-yellow-600"}>
                    {nota.pago ? 'Pago' : 'Pendente'}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredNotas.length === 0 && (
        <div className="text-center py-12">
          <FileText className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-400 text-lg">Nenhuma nota encontrada com os critérios de pesquisa.</p>
        </div>
      )}

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="flex justify-center items-center space-x-2 mt-6">
          <Button
            variant="outline"
            onClick={() => paginate(currentPage - 1)}
            disabled={currentPage === 1}
            className="bg-gray-800 border-gray-600 text-white hover:bg-gray-700"
          >
            Anterior
          </Button>
          <span className="text-white">Página {currentPage} de {totalPages}</span>
          <Button
            variant="outline"
            onClick={() => paginate(currentPage + 1)}
            disabled={currentPage === totalPages}
            className="bg-gray-800 border-gray-600 text-white hover:bg-gray-700"
          >
            Próxima
          </Button>
        </div>
      )}

      {/* Modal for Nota Details/Create */}
      {isModalOpen && (
        <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
          <DialogContent className="sm:max-w-[900px] max-h-[90vh] overflow-y-auto bg-gray-900 border-gray-600">
            <DialogHeader>
              <div className="flex justify-between items-start">
                <div>
                  <DialogTitle className="text-2xl text-white">
                    {isCreateMode ? 'Nova Nota Fiscal' : `Nota #${selectedNota?.idn || selectedNota?.id}`}
                  </DialogTitle>
                  <DialogDescription className="text-gray-400 mt-1">
                    {isCreateMode ? 'Preencha os dados da nova nota fiscal' : 'Visualizar e editar nota fiscal'}
                  </DialogDescription>
                </div>
                <Button variant="ghost" size="sm" onClick={closeModal} className="text-white hover:bg-gray-800">
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </DialogHeader>
            
            <div className="grid gap-6 py-4">
              {isCreateMode && (
                <div className="bg-gray-800 p-4 rounded-lg">
                  <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
                    <Sparkles className="h-5 w-5 mr-2 text-blue-400" />
                    Preenchimento Inteligente
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="md:col-span-2">
                      <Input
                        placeholder="Digite cliente, produto, modo de pagamento..."
                        value={filtroInteligente}
                        onChange={(e) => setFiltroInteligente(e.target.value)}
                        className="bg-gray-700 border-gray-600 text-white"
                        onKeyPress={(e) => e.key === 'Enter' && handleFiltroInteligente()}
                      />
                    </div>
                    <div className="flex space-x-2">
                      <Select value={tipoFiltro} onValueChange={setTipoFiltro}>
                        <SelectTrigger className="bg-gray-700 border-gray-600 text-white">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-gray-700 border-gray-600">
                          <SelectItem value="auto">Auto</SelectItem>
                          <SelectItem value="cliente">Cliente</SelectItem>
                          <SelectItem value="produto">Produto</SelectItem>
                          <SelectItem value="modo">Modo</SelectItem>
                        </SelectContent>
                      </Select>
                      <Button 
                        onClick={handleFiltroInteligente} 
                        disabled={loading}
                        className="bg-blue-600 hover:bg-blue-700"
                      >
                        <Sparkles className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  
                  {showSugestoes && sugestoes.length > 0 && (
                    <div className="mt-4">
                      <h4 className="text-white font-medium mb-2">Produtos Encontrados:</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                        {(Array.isArray(sugestoes) ? sugestoes : []).map((produto, index) => (
                          <div key={index} className="bg-gray-700 p-2 rounded text-sm text-white">
                            <Badge variant="outline" className="mr-2">{produto.tipo}</Badge>
                            {produto.descricao}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Form Fields */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Dados do Remetente */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-white">Dados do Remetente</h3>
                  <div className="space-y-3">
                    <div>
                      <label className="text-sm text-gray-400">Nome/Empresa</label>
                      <Input
                        value={isCreateMode ? novaNota.remetente1 : selectedNota?.remetente1 || ''}
                        onChange={(e) => isCreateMode 
                          ? setNovaNota(prev => ({...prev, remetente1: e.target.value}))
                          : setSelectedNota(prev => ({...prev, remetente1: e.target.value}))
                        }
                        className="bg-gray-800 border-gray-600 text-white"
                      />
                    </div>
                    <div>
                      <label className="text-sm text-gray-400">Endereço</label>
                      <Input
                        value={isCreateMode ? novaNota.remetente2 : selectedNota?.remetente2 || ''}
                        onChange={(e) => isCreateMode 
                          ? setNovaNota(prev => ({...prev, remetente2: e.target.value}))
                          : setSelectedNota(prev => ({...prev, remetente2: e.target.value}))
                        }
                        className="bg-gray-800 border-gray-600 text-white"
                      />
                    </div>
                    <div>
                      <label className="text-sm text-gray-400">CEP e Cidade</label>
                      <Input
                        value={isCreateMode ? novaNota.remetente4 : selectedNota?.remetente4 || ''}
                        onChange={(e) => isCreateMode 
                          ? setNovaNota(prev => ({...prev, remetente4: e.target.value}))
                          : setSelectedNota(prev => ({...prev, remetente4: e.target.value}))
                        }
                        className="bg-gray-800 border-gray-600 text-white"
                      />
                    </div>
                    <div>
                      <label className="text-sm text-gray-400">Email</label>
                      <Input
                        value={isCreateMode ? novaNota.remetente9 : selectedNota?.remetente9 || ''}
                        onChange={(e) => isCreateMode 
                          ? setNovaNota(prev => ({...prev, remetente9: e.target.value}))
                          : setSelectedNota(prev => ({...prev, remetente9: e.target.value}))
                        }
                        className="bg-gray-800 border-gray-600 text-white"
                      />
                    </div>
                  </div>
                </div>

                {/* Dados do Destinatário */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-white">Dados do Destinatário</h3>
                  <div className="space-y-3">
                    <div>
                      <label className="text-sm text-gray-400">Nome/Empresa</label>
                      <Input
                        value={isCreateMode ? novaNota.des1 : selectedNota?.des1 || ''}
                        onChange={(e) => isCreateMode 
                          ? setNovaNota(prev => ({...prev, des1: e.target.value}))
                          : setSelectedNota(prev => ({...prev, des1: e.target.value}))
                        }
                        className="bg-gray-800 border-gray-600 text-white"
                      />
                    </div>
                    <div>
                      <label className="text-sm text-gray-400">Nome do Contato</label>
                      <Input
                        value={isCreateMode ? novaNota.des2 : selectedNota?.des2 || ''}
                        onChange={(e) => isCreateMode 
                          ? setNovaNota(prev => ({...prev, des2: e.target.value}))
                          : setSelectedNota(prev => ({...prev, des2: e.target.value}))
                        }
                        className="bg-gray-800 border-gray-600 text-white"
                      />
                    </div>
                    <div>
                      <label className="text-sm text-gray-400">Endereço</label>
                      <Input
                        value={isCreateMode ? novaNota.des3 : selectedNota?.des3 || ''}
                        onChange={(e) => isCreateMode 
                          ? setNovaNota(prev => ({...prev, des3: e.target.value}))
                          : setSelectedNota(prev => ({...prev, des3: e.target.value}))
                        }
                        className="bg-gray-800 border-gray-600 text-white"
                      />
                    </div>
                    <div>
                      <label className="text-sm text-gray-400">CEP e Cidade</label>
                      <Input
                        value={isCreateMode ? novaNota.des5 : selectedNota?.des5 || ''}
                        onChange={(e) => isCreateMode 
                          ? setNovaNota(prev => ({...prev, des5: e.target.value}))
                          : setSelectedNota(prev => ({...prev, des5: e.target.value}))
                        }
                        className="bg-gray-800 border-gray-600 text-white"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Dados da Nota */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-white">Dados da Nota</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="text-sm text-gray-400">Data</label>
                    <Input
                      type="datetime-local"
                      value={isCreateMode ? novaNota.data : selectedNota?.data || ''}
                      onChange={(e) => isCreateMode 
                        ? setNovaNota(prev => ({...prev, data: e.target.value}))
                        : setSelectedNota(prev => ({...prev, data: e.target.value}))
                      }
                      className="bg-gray-800 border-gray-600 text-white"
                    />
                  </div>
                  <div>
                    <label className="text-sm text-gray-400">Modo</label>
                    <Input
                      value={isCreateMode ? novaNota.modo : selectedNota?.modo || ''}
                      onChange={(e) => isCreateMode 
                        ? setNovaNota(prev => ({...prev, modo: e.target.value}))
                        : setSelectedNota(prev => ({...prev, modo: e.target.value}))
                      }
                      className="bg-gray-800 border-gray-600 text-white"
                    />
                  </div>
                  <div>
                    <label className="text-sm text-gray-400">Autor</label>
                    <Input
                      value={isCreateMode ? novaNota.autor : selectedNota?.autor || ''}
                      onChange={(e) => isCreateMode 
                        ? setNovaNota(prev => ({...prev, autor: e.target.value}))
                        : setSelectedNota(prev => ({...prev, autor: e.target.value}))
                      }
                      className="bg-gray-800 border-gray-600 text-white"
                    />
                  </div>
                </div>
              </div>

              {/* Valores e Impostos */}
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-semibold text-white">Valores e Impostos</h3>
                  {isCreateMode && (
                    <Button onClick={handleCalcularImpostos} variant="outline" size="sm" className="bg-gray-800 border-gray-600 text-white hover:bg-gray-700">
                      <Calculator className="h-4 w-4 mr-2" />
                      Calcular Impostos
                    </Button>
                  )}
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="text-sm text-gray-400">Valor</label>
                    <Input
                      value={isCreateMode ? novaNota.valor : selectedNota?.valor || ''}
                      onChange={(e) => isCreateMode 
                        ? setNovaNota(prev => ({...prev, valor: e.target.value}))
                        : setSelectedNota(prev => ({...prev, valor: e.target.value}))
                      }
                      className="bg-gray-800 border-gray-600 text-white"
                    />
                  </div>
                  <div>
                    <label className="text-sm text-gray-400">Desconto</label>
                    <Input
                      type="number"
                      step="0.01"
                      value={isCreateMode ? novaNota.desconto : selectedNota?.desconto || 0}
                      onChange={(e) => isCreateMode 
                        ? setNovaNota(prev => ({...prev, desconto: parseFloat(e.target.value) || 0}))
                        : setSelectedNota(prev => ({...prev, desconto: parseFloat(e.target.value) || 0}))
                      }
                      className="bg-gray-800 border-gray-600 text-white"
                    />
                  </div>
                  <div>
                    <label className="text-sm text-gray-400">Status Pagamento</label>
                    <Select 
                      value={isCreateMode ? novaNota.pago.toString() : selectedNota?.pago?.toString() || '0'}
                      onValueChange={(value) => isCreateMode 
                        ? setNovaNota(prev => ({...prev, pago: parseInt(value)}))
                        : setSelectedNota(prev => ({...prev, pago: parseInt(value)}))
                      }
                    >
                      <SelectTrigger className="bg-gray-800 border-gray-600 text-white">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-gray-700 border-gray-600">
                        <SelectItem value="0">Pendente</SelectItem>
                        <SelectItem value="1">Pago</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              {/* Observações */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-white">Observações</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm text-gray-400">Notícia Interna</label>
                    <Textarea
                      value={isCreateMode ? novaNota.noticia : selectedNota?.noticia || ''}
                      onChange={(e) => isCreateMode 
                        ? setNovaNota(prev => ({...prev, noticia: e.target.value}))
                        : setSelectedNota(prev => ({...prev, noticia: e.target.value}))
                      }
                      className="bg-gray-800 border-gray-600 text-white"
                      rows={3}
                    />
                  </div>
                  <div>
                    <label className="text-sm text-gray-400">Mensagem</label>
                    <Textarea
                      value={isCreateMode ? novaNota.mensagem : selectedNota?.mensagem || ''}
                      onChange={(e) => isCreateMode 
                        ? setNovaNota(prev => ({...prev, mensagem: e.target.value}))
                        : setSelectedNota(prev => ({...prev, mensagem: e.target.value}))
                      }
                      className="bg-gray-800 border-gray-600 text-white"
                      rows={3}
                    />
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end space-x-4 pt-4">
                <Button variant="outline" onClick={closeModal} className="bg-gray-800 border-gray-600 text-white hover:bg-gray-700">
                  Cancelar
                </Button>
                <Button onClick={handleSaveNota} disabled={loading} className="bg-blue-600 hover:bg-blue-700">
                  {loading ? 'Salvando...' : (isCreateMode ? 'Criar Nota' : 'Salvar Alterações')}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}

export default Notas;



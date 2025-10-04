import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button.jsx';
import { Input } from '@/components/ui/input.jsx';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card.jsx';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table.jsx';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog.jsx';
import { Label } from '@/components/ui/label.jsx';
import { Trash2, Plus, Edit, Search, Percent } from 'lucide-react';
import apiService from '../services/api';

function Descontos() {
  const [discounts, setDiscounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingDiscount, setEditingDiscount] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [formData, setFormData] = useState({
    soma: '',
    desconto: ''
  });

  useEffect(() => {
    fetchDiscounts();
  }, []);

  const fetchDiscounts = async () => {
    try {
      const response = await apiService.getDiscounts();
      setDiscounts(Array.isArray(response.data) ? response.data : []);
      setLoading(false);
    } catch (error) {
      console.error("Erro ao buscar descontos:", error);
      setError("Erro ao carregar descontos. Por favor, tente novamente.");
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingDiscount) {
        await apiService.updateDiscount(editingDiscount.id, formData);
      } else {
        await apiService.createDiscount(formData);
      }
      fetchDiscounts();
      setIsDialogOpen(false);
      setEditingDiscount(null);
      setFormData({
        soma: '', desconto: ''
      });
    } catch (error) {
      console.error("Erro ao salvar desconto:", error);
      setError("Erro ao salvar desconto. Verifique os dados e tente novamente.");
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm("Tem certeza que deseja excluir este desconto?")) {
      try {
        await apiService.deleteDiscount(id);
        fetchDiscounts();
      } catch (error) {
        console.error("Erro ao excluir desconto:", error);
        setError("Erro ao excluir desconto.");
      }
    }
  };

  const handleEdit = (item) => {
    setEditingDiscount(item);
    setFormData({
      soma: item.soma || '',
      desconto: item.desconto || ''
    });
    setIsDialogOpen(true);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const filteredDiscounts = discounts.filter(item =>
    (item.soma || '').toString().includes(searchTerm.toLowerCase()) ||
    (item.desconto || '').toString().includes(searchTerm.toLowerCase())
  );

  // Ordenar por valor da soma (crescente)
  const sortedDiscounts = filteredDiscounts.sort((a, b) => (a.soma || 0) - (b.soma || 0));

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 bg-black min-h-screen p-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold text-white">Descontos</h2>
          <p className="text-gray-400">Gerenciamento de tabela de descontos por volume de compra.</p>
        </div>
        
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button 
              onClick={() => {
                setEditingDiscount(null);
                setFormData({
                  soma: '', desconto: ''
                });
              }}
              className="bg-purple-600 hover:bg-purple-700"
            >
              <Plus className="h-4 w-4 mr-2" />
              Novo Desconto
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-gray-800 border-gray-600 max-w-md">
            <DialogHeader>
              <DialogTitle className="text-white">
                {editingDiscount ? 'Editar Desconto' : 'Novo Desconto'}
              </DialogTitle>
              <DialogDescription className="text-gray-400">
                Configure o valor mínimo de compra e o percentual de desconto.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit}>
              <div className="grid gap-4 py-4">
                <div>
                  <Label htmlFor="soma" className="text-white">Valor Mínimo de Compra (R$)</Label>
                  <Input
                    id="soma"
                    name="soma"
                    type="number"
                    step="0.01"
                    value={formData.soma}
                    onChange={handleInputChange}
                    className="bg-gray-700 border-gray-600 text-white"
                    placeholder="Ex: 1000.00"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="desconto" className="text-white">Percentual de Desconto (%)</Label>
                  <Input
                    id="desconto"
                    name="desconto"
                    type="number"
                    step="0.01"
                    min="0"
                    max="100"
                    value={formData.desconto}
                    onChange={handleInputChange}
                    className="bg-gray-700 border-gray-600 text-white"
                    placeholder="Ex: 5.00"
                    required
                  />
                </div>
              </div>
              <DialogFooter>
                <Button type="submit" className="bg-purple-600 hover:bg-purple-700">
                  {editingDiscount ? 'Atualizar' : 'Criar'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {error && (
        <div className="bg-red-900/20 border border-red-500 text-red-400 px-4 py-3 rounded">
          {error}
        </div>
      )}

      <Card className="bg-gray-800 border-gray-700">
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle className="text-white flex items-center">
                <Percent className="h-5 w-5 mr-2" />
                Tabela de Descontos
              </CardTitle>
              <CardDescription className="text-gray-400">
                Total de {filteredDiscounts.length} faixas de desconto configuradas
              </CardDescription>
            </div>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Pesquisar por valor ou desconto..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 bg-gray-700 border-gray-600 text-white w-80"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow className="border-gray-700">
                <TableHead className="text-gray-300">Valor Mínimo</TableHead>
                <TableHead className="text-gray-300">Desconto</TableHead>
                <TableHead className="text-gray-300">Descrição</TableHead>
                <TableHead className="text-gray-300">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedDiscounts.map((discount) => (
                <TableRow key={discount.id} className="border-gray-700 hover:bg-gray-700/50">
                  <TableCell className="text-white font-medium">
                    R$ {parseFloat(discount.soma || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </TableCell>
                  <TableCell className="text-green-400 font-medium">
                    {parseFloat(discount.desconto || 0).toFixed(2)}%
                  </TableCell>
                  <TableCell className="text-gray-300">
                    {discount.soma >= 50000 ? 'Desconto Premium' :
                     discount.soma >= 20000 ? 'Desconto Alto Volume' :
                     discount.soma >= 10000 ? 'Desconto Volume' :
                     discount.soma >= 5000 ? 'Desconto Médio' :
                     discount.soma >= 1000 ? 'Desconto Básico' :
                     'Desconto Inicial'}
                  </TableCell>
                  <TableCell>
                    <div className="flex space-x-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEdit(discount)}
                        className="text-blue-400 hover:text-blue-300"
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(discount.id)}
                        className="text-red-400 hover:text-red-300"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          
          {filteredDiscounts.length === 0 && (
            <div className="text-center py-8 text-gray-400">
              Nenhum desconto encontrado
            </div>
          )}
        </CardContent>
      </Card>

      {sortedDiscounts.length > 0 && (
        <Card className="bg-gray-800 border-gray-700">
          <CardHeader>
            <CardTitle className="text-white">Como Funciona</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-gray-300 space-y-2">
              <p>• Os descontos são aplicados automaticamente com base no valor total da compra</p>
              <p>• O sistema aplica o maior desconto disponível para o valor da compra</p>
              <p>• Os valores são cumulativos: compras acima de R$ {Math.max(...sortedDiscounts.map(d => d.soma)).toLocaleString('pt-BR')} recebem {Math.max(...sortedDiscounts.map(d => d.desconto)).toFixed(2)}% de desconto</p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

export default Descontos;

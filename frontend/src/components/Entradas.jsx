import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button.jsx';
import { Input } from '@/components/ui/input.jsx';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card.jsx';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table.jsx';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog.jsx';
import { Label } from '@/components/ui/label.jsx';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select.jsx';
import { Trash2, Plus, Edit, Search, DollarSign, TrendingUp } from 'lucide-react';
import axios from 'axios';
import apiService from '../services/api';




function Entradas() {
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDetailsDialogOpen, setIsDetailsDialogOpen] = useState(false);
  const [editingEntry, setEditingEntry] = useState(null);
  const [selectedEntry, setSelectedEntry] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [formData, setFormData] = useState({
    description: '',
    amount: '',
    category: '',
    date: '',
    source: '',
    notes: ''
  });

  const categories = [
    'Vendas',
    'Serviços',
    'Consertos',
    'Comissões',
    'Outros'
  ];

  useEffect(() => {
    fetchEntries();
  }, []);

  const fetchEntries = async () => {
    try {
      const response = await apiService.getEntries();
      setEntries(Array.isArray(response.data) ? response.data : (response.data.entries || []));
      setLoading(false);
    } catch (error) {
      console.error("Erro ao buscar entradas:", error);
      setLoading(false);
    }
  };

  // Mock data para demonstração
  useEffect(() => {
    if (entries.length === 0) {
      setEntries([
        {
          id: 1,
          description: 'Venda de Anel de Ouro',
          amount: 1500.00,
          category: 'Vendas',
          date: '2024-01-15',
          source: 'Cliente Maria Silva',
          notes: 'Pagamento à vista'
        },
        {
          id: 2,
          description: 'Conserto de Colar',
          amount: 250.00,
          category: 'Serviços',
          date: '2024-01-14',
          source: 'Cliente João Santos',
          notes: 'Troca de fecho'
        }
      ]);
      setLoading(false);
    }
  }, [entries.length]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingEntry) {
        await apiService.updateEntry(editingEntry.id, formData);
      } else {
        await apiService.createEntry(formData);
      }
      fetchEntries();
      setIsDialogOpen(false);
      setEditingEntry(null);
      setFormData({
        description: '', amount: '', category: '', date: '', source: '', notes: ''
      });
    } catch (error) {
      console.error("Erro ao salvar entrada:", error);
      // Simular adição para demonstração
      const newEntry = {
        id: Date.now(),
        ...formData,
        amount: parseFloat(formData.amount)
      };
      if (editingEntry) {
        setEntries(prev => prev.map(entry => entry.id === editingEntry.id ? { ...editingEntry, ...formData, amount: parseFloat(formData.amount) } : entry));
      } else {
        setEntries(prev => [...prev, newEntry]);
      }
      setIsDialogOpen(false);
      setEditingEntry(null);
      setFormData({
        description: '', amount: '', category: '', date: '', source: '', notes: ''
      });
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm("Tem certeza que deseja excluir esta entrada?")) {
      try {
        await apiService.deleteEntry(id);
        fetchEntries();
      } catch (error) {
        console.error("Erro ao excluir entrada:", error);
        // Simular exclusão para demonstração
        setEntries(prev => prev.filter(entry => entry.id !== id));
      }
    }
  };

  const handleEdit = (entry) => {
    setEditingEntry(entry);
    setFormData({
      description: entry.description || '',
      amount: entry.amount || '',
      category: entry.category || '',
      date: entry.date || '',
      source: entry.source || '',
      notes: entry.notes || ''
    });
    setIsDialogOpen(true);
  };

  const handleViewDetails = (entry) => {
    setSelectedEntry(entry);
    setIsDetailsDialogOpen(true);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const filteredEntries = (Array.isArray(entries) ? entries : []).filter(entry =>
    (entry.description || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (entry.category || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (entry.source || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalEntries = filteredEntries.reduce((sum, entry) => sum + (parseFloat(entry.amount) || 0), 0);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-green-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold text-white">Entradas Financeiras</h2>
          <p className="text-gray-400">Gerenciamento de receitas e entradas de dinheiro.</p>
        </div>
        
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => {
              setEditingEntry(null);
              setFormData({
                description: '', amount: '', category: '', date: '', source: '', notes: ''
              });
            }} className="bg-green-600 hover:bg-green-700">
              <Plus className="h-4 w-4 mr-2" />
              Nova Entrada
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-gray-800 border-gray-600 max-w-2xl">
            <DialogHeader>
              <DialogTitle className="text-white">
                {editingEntry ? 'Editar Entrada' : 'Nova Entrada'}
              </DialogTitle>
              <DialogDescription className="text-gray-400">
                Registre uma nova entrada financeira.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit}>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="description" className="text-white">Descrição</Label>
                    <Input
                      id="description"
                      name="description"
                      value={formData.description}
                      onChange={handleInputChange}
                      className="bg-gray-700 border-gray-600 text-white"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="amount" className="text-white">Valor (R$)</Label>
                    <Input
                      id="amount"
                      name="amount"
                      type="number"
                      step="0.01"
                      value={formData.amount}
                      onChange={handleInputChange}
                      className="bg-gray-700 border-gray-600 text-white"
                      required
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="category" className="text-white">Categoria</Label>
                    <Select value={formData.category} onValueChange={(value) => setFormData(prev => ({ ...prev, category: value }))}>
                      <SelectTrigger className="bg-gray-700 border-gray-600 text-white">
                        <SelectValue placeholder="Selecione uma categoria" />
                      </SelectTrigger>
                      <SelectContent className="bg-gray-800 border-gray-600">
                        {categories.map((category) => (
                          <SelectItem key={category} value={category} className="text-white hover:bg-gray-700">
                            {category}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="date" className="text-white">Data</Label>
                    <Input
                      id="date"
                      name="date"
                      type="date"
                      value={formData.date}
                      onChange={handleInputChange}
                      className="bg-gray-700 border-gray-600 text-white"
                      required
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="source" className="text-white">Origem/Cliente</Label>
                  <Input
                    id="source"
                    name="source"
                    value={formData.source}
                    onChange={handleInputChange}
                    className="bg-gray-700 border-gray-600 text-white"
                  />
                </div>
                <div>
                  <Label htmlFor="notes" className="text-white">Observações</Label>
                  <Input
                    id="notes"
                    name="notes"
                    value={formData.notes}
                    onChange={handleInputChange}
                    className="bg-gray-700 border-gray-600 text-white"
                  />
                </div>
              </div>
              <DialogFooter>
                <Button type="submit" className="bg-green-600 hover:bg-green-700">
                  {editingEntry ? 'Atualizar' : 'Registrar'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        {/* Dialog for Entry Details */}
        <Dialog open={isDetailsDialogOpen} onOpenChange={setIsDetailsDialogOpen}>
          <DialogContent className="bg-gray-800 border-gray-600">
            <DialogHeader>
              <DialogTitle className="text-white">Detalhes da Entrada</DialogTitle>
              <DialogDescription className="text-gray-400">
                Informações completas da entrada financeira.
              </DialogDescription>
            </DialogHeader>
            {selectedEntry && (
              <div className="grid gap-4 py-4 text-white">
                <p><strong>ID:</strong> {selectedEntry.id}</p>
                <p><strong>Descrição:</strong> {selectedEntry.description}</p>
                <p><strong>Valor:</strong> R$ {parseFloat(selectedEntry.amount).toFixed(2)}</p>
                <p><strong>Categoria:</strong> {selectedEntry.category || '-'}</p>
                <p><strong>Data:</strong> {selectedEntry.date ? new Date(selectedEntry.date).toLocaleDateString('pt-BR') : '-'}</p>
                <p><strong>Origem:</strong> {selectedEntry.source || '-'}</p>
                <p><strong>Observações:</strong> {selectedEntry.notes || '-'}</p>
              </div>
            )}
            <DialogFooter>
              <Button onClick={() => setIsDetailsDialogOpen(false)} className="bg-gray-600 hover:bg-gray-700">Fechar</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Summary Card */}
      <Card className="bg-gradient-to-r from-green-800 to-green-600 border-green-500">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-100 text-sm">Total de Entradas</p>
              <p className="text-3xl font-bold text-white">R$ {totalEntries.toFixed(2)}</p>
              <p className="text-green-200 text-sm">{filteredEntries.length} registros</p>
            </div>
            <TrendingUp className="h-12 w-12 text-green-200" />
          </div>
        </CardContent>
      </Card>

      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
        <Input
          placeholder="Pesquisar entradas por descrição, categoria ou origem..."
          className="pl-10 bg-gray-800 border-gray-600 text-white placeholder-gray-400"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      <Card className="bg-gray-800 border-gray-600">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            Registro de Entradas
          </CardTitle>
          <CardDescription className="text-gray-400">
            Histórico de todas as entradas financeiras
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-gray-300">Data</TableHead>
                <TableHead className="text-gray-300">Descrição</TableHead>
                <TableHead className="text-gray-300">Categoria</TableHead>
                <TableHead className="text-gray-300">Origem</TableHead>
                <TableHead className="text-gray-300">Valor</TableHead>
                <TableHead className="text-gray-300">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredEntries.map((entry) => (
                <TableRow key={entry.id} onClick={() => handleViewDetails(entry)} className="cursor-pointer hover:bg-gray-700 text-white">
                  <TableCell>{entry.date ? new Date(entry.date).toLocaleDateString('pt-BR') : '-'}</TableCell>
                  <TableCell>{entry.description}</TableCell>
                  <TableCell>
                    <span className="px-2 py-1 bg-green-600 text-white rounded-full text-xs">
                      {entry.category || 'Sem categoria'}
                    </span>
                  </TableCell>
                  <TableCell>{entry.source || '-'}</TableCell>
                  <TableCell className="font-bold text-green-400">
                    R$ {parseFloat(entry.amount).toFixed(2)}
                  </TableCell>
                  <TableCell onClick={(e) => e.stopPropagation()}>
                    <div className="flex space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEdit(entry)}
                        className="border-gray-600 text-gray-300 hover:bg-gray-700"
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDelete(entry.id)}
                        className="border-gray-600 text-gray-300 hover:bg-gray-700"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

export default Entradas;



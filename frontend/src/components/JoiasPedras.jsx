import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button.jsx';
import { Input } from '@/components/ui/input.jsx';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card.jsx';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table.jsx';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog.jsx';
import { Label } from '@/components/ui/label.jsx';
import { Trash2, Plus, Edit, Search, Gem } from 'lucide-react';
import axios from 'axios';
import apiService from '../services/api';



function JoiasPedras() {
  const [stones, setStones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingStone, setEditingStone] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    type: '',
    color: '',
    hardness: '',
    origin: '',
    price_per_carat: '',
    description: ''
  });

  useEffect(() => {
    fetchStones();
  }, []);

  const fetchStones = async () => {
    try {
      const response = await apiService.getStones();
      // Mapear campos da API para o formato esperado pelo frontend
      const mappedStones = Array.isArray(response.data.stones) ? response.data.stones.map(stone => ({
        id: stone.id,
        idpe: stone.idpe,
        name: stone.material || stone.material_pedra || 'Sem nome',
        type: stone.tipo || stone.tipo_pedra || 'Não especificado',
        color: stone.cor || stone.cor_pedra || 'Não especificado',
        hardness: stone.altura || stone.altura_pedra || 0,
        origin: stone.lapidacao || stone.lapidacao_pedra || 'Não especificado',
        price_per_carat: stone.preco || stone.preco_pedra || 0,
        description: stone.noticia || 'Sem descrição',
        // Campos originais para compatibilidade
        material: stone.material || stone.material_pedra,
        cor: stone.cor || stone.cor_pedra,
        tipo: stone.tipo || stone.tipo_pedra,
        lapidacao: stone.lapidacao || stone.lapidacao_pedra,
        preco: stone.preco || stone.preco_pedra
      })) : [];
      setStones(mappedStones);
      setLoading(false);
    } catch (error) {
      console.error("Erro ao buscar pedras:", error);
      setError("Erro ao carregar pedras. Por favor, tente novamente.");
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingStone) {
        await apiService.updateStone(editingStone.id, formData);
      } else {
        await apiService.createStone(formData);
      }
      fetchStones();
      setIsDialogOpen(false);
      setEditingStone(null);
      setFormData({
        name: '', type: '', color: '', hardness: '', origin: '', price_per_carat: '', description: ''
      });
    } catch (error) {
      console.error("Erro ao salvar pedra:", error);
      setError("Erro ao salvar pedra. Verifique os dados e tente novamente.");
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm("Tem certeza que deseja excluir esta pedra?")) {
      try {
        await apiService.deleteStone(id);
        fetchStones();
      } catch (error) {
        console.error("Erro ao excluir pedra:", error);
        setError("Erro ao excluir pedra.");
      }
    }
  };

  const handleEdit = (item) => {
    setEditingStone(item);
    setFormData({
      name: item.name || '',
      type: item.type || '',
      color: item.color || '',
      hardness: item.hardness || '',
      origin: item.origin || '',
      price_per_carat: item.price_per_carat || '',
      description: item.description || ''
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

  const filteredStones = stones.filter(item =>
    (item.name || item.material || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (item.type || item.tipo || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (item.color || item.cor || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (item.origin || item.lapidacao || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

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
          <h2 className="text-3xl font-bold text-white">Pedras</h2>
          <p className="text-gray-400">Gerenciamento de pedras preciosas e semi-preciosas.</p>
        </div>
        
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button 
              onClick={() => {
                setEditingStone(null);
                setFormData({
                  name: '', type: '', color: '', hardness: '', origin: '', price_per_carat: '', description: ''
                });
              }}
              className="bg-purple-600 hover:bg-purple-700"
            >
              <Plus className="h-4 w-4 mr-2" />
              Nova Pedra
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-gray-800 border-gray-600 max-w-2xl">
            <DialogHeader>
              <DialogTitle className="text-white">
                {editingStone ? 'Editar Pedra' : 'Nova Pedra'}
              </DialogTitle>
              <DialogDescription className="text-gray-400">
                Preencha as informações da pedra.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit}>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="name" className="text-white">Nome</Label>
                    <Input
                      id="name"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      className="bg-gray-700 border-gray-600 text-white"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="type" className="text-white">Tipo</Label>
                    <Input
                      id="type"
                      name="type"
                      value={formData.type}
                      onChange={handleInputChange}
                      className="bg-gray-700 border-gray-600 text-white"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="color" className="text-white">Cor</Label>
                    <Input
                      id="color"
                      name="color"
                      value={formData.color}
                      onChange={handleInputChange}
                      className="bg-gray-700 border-gray-600 text-white"
                    />
                  </div>
                  <div>
                    <Label htmlFor="hardness" className="text-white">Dureza</Label>
                    <Input
                      id="hardness"
                      name="hardness"
                      value={formData.hardness}
                      onChange={handleInputChange}
                      className="bg-gray-700 border-gray-600 text-white"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="origin" className="text-white">Origem</Label>
                    <Input
                      id="origin"
                      name="origin"
                      value={formData.origin}
                      onChange={handleInputChange}
                      className="bg-gray-700 border-gray-600 text-white"
                    />
                  </div>
                  <div>
                    <Label htmlFor="price_per_carat" className="text-white">Preço por Quilate</Label>
                    <Input
                      id="price_per_carat"
                      name="price_per_carat"
                      type="number"
                      step="0.01"
                      value={formData.price_per_carat}
                      onChange={handleInputChange}
                      className="bg-gray-700 border-gray-600 text-white"
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="description" className="text-white">Descrição</Label>
                  <Input
                    id="description"
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    className="bg-gray-700 border-gray-600 text-white"
                  />
                </div>
              </div>
              <DialogFooter>
                <Button type="submit" className="bg-purple-600 hover:bg-purple-700">
                  {editingStone ? 'Atualizar' : 'Criar'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
        <Input
          placeholder="Pesquisar pedras por nome, tipo ou cor..."
          className="pl-10 bg-gray-800 border-gray-600 text-white placeholder-gray-400"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      <Card className="bg-gray-800 border-gray-600">
        {error && (
          <div className="bg-red-900 border border-red-600 text-red-200 px-4 py-3 rounded mb-4">
            <p className="font-bold">Erro</p>
            <p className="text-sm">{error}</p>
            <button 
              onClick={() => {setError(null); fetchStones();}} 
              className="mt-2 text-sm underline hover:no-underline"
            >
              Tentar novamente
            </button>
          </div>
        )}
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Gem className="h-5 w-5" />
            Catálogo de Pedras
          </CardTitle>
          <CardDescription className="text-gray-400">
            Total de {filteredStones.length} pedras cadastradas
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-gray-300">Nome</TableHead>
                <TableHead className="text-gray-300">Tipo</TableHead>
                <TableHead className="text-gray-300">Cor</TableHead>
                <TableHead className="text-gray-300">Dureza</TableHead>
                <TableHead className="text-gray-300">Origem</TableHead>
                <TableHead className="text-gray-300">Preço/Quilate</TableHead>
                <TableHead className="text-gray-300">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredStones.map((item) => (
                <TableRow key={item.id} className="hover:bg-gray-700 text-white">
                  <TableCell className="font-medium">{item.name}</TableCell>
                  <TableCell>{item.type || '-'}</TableCell>
                  <TableCell>{item.color || '-'}</TableCell>
                  <TableCell>{item.hardness || '-'}</TableCell>
                  <TableCell>{item.origin || '-'}</TableCell>
                  <TableCell>
                    {item.price_per_carat ? `R$ ${parseFloat(item.price_per_carat).toFixed(2)}` : '-'}
                  </TableCell>
                  <TableCell>
                    <div className="flex space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEdit(item)}
                        className="border-gray-600 text-white hover:bg-gray-700"
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDelete(item.id)}
                        className="border-red-600 text-red-400 hover:bg-red-900"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {filteredStones.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-gray-400 py-8">
                    Nenhuma pedra encontrada
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

export default JoiasPedras;



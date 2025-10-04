import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button.jsx';
import { Input } from '@/components/ui/input.jsx';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card.jsx';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table.jsx';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog.jsx';
import { Label } from '@/components/ui/label.jsx';
import { Trash2, Plus, Edit, Search, Ruler } from 'lucide-react';
import axios from 'axios';
import apiService from '../services/api';



function JoiasTamanhos() {
  const [sizes, setSizes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingSize, setEditingSize] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    description: ''
  });

  useEffect(() => {
    fetchSizes();
  }, []);

  const fetchSizes = async () => {
    try {
      const response = await apiService.getSizes();
      setSizes(Array.isArray(response.data) ? response.data : []);
      setLoading(false);
    } catch (error) {
      console.error("Erro ao buscar tamanhos:", error);
      setError("Erro ao carregar tamanhos. Por favor, tente novamente.");
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingSize) {
        await apiService.updateSize(editingSize.id, formData);
      } else {
        await apiService.createSize(formData);
      }
      fetchSizes();
      setIsDialogOpen(false);
      setEditingSize(null);
      setFormData({
        name: '', description: ''
      });
    } catch (error) {
      console.error("Erro ao salvar tamanho:", error);
      setError("Erro ao salvar tamanho. Verifique os dados e tente novamente.");
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm("Tem certeza que deseja excluir este tamanho?")) {
      try {
        await apiService.deleteSize(id);
        fetchSizes();
      } catch (error) {
        console.error("Erro ao excluir tamanho:", error);
        setError("Erro ao excluir tamanho.");
      }
    }
  };

  const handleEdit = (item) => {
    setEditingSize(item);
    setFormData({
      name: item.name || '',
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

  const filteredSizes = sizes.filter(item =>
    (item.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (item.description || '').toLowerCase().includes(searchTerm.toLowerCase())
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
          <h2 className="text-3xl font-bold text-white">Tamanhos</h2>
          <p className="text-gray-400">Gerenciamento de tamanhos para joias.</p>
        </div>
        
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button 
              onClick={() => {
                setEditingSize(null);
                setFormData({
                  name: '', description: ''
                });
              }}
              className="bg-purple-600 hover:bg-purple-700"
            >
              <Plus className="h-4 w-4 mr-2" />
              Novo Tamanho
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-gray-800 border-gray-600 max-w-2xl">
            <DialogHeader>
              <DialogTitle className="text-white">
                {editingSize ? 'Editar Tamanho' : 'Novo Tamanho'}
              </DialogTitle>
              <DialogDescription className="text-gray-400">
                Preencha as informações do tamanho.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit}>
              <div className="grid gap-4 py-4">
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
                  {editingSize ? 'Atualizar' : 'Criar'}
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
          placeholder="Pesquisar tamanhos por nome ou descrição..."
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
              onClick={() => {setError(null); fetchSizes();}} 
              className="mt-2 text-sm underline hover:no-underline"
            >
              Tentar novamente
            </button>
          </div>
        )}
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Ruler className="h-5 w-5" />
            Catálogo de Tamanhos
          </CardTitle>
          <CardDescription className="text-gray-400">
            Total de {filteredSizes.length} tamanhos cadastrados
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-gray-300">Nome</TableHead>
                <TableHead className="text-gray-300">Descrição</TableHead>
                <TableHead className="text-gray-300">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredSizes.map((item) => (
                <TableRow key={item.id} className="hover:bg-gray-700 text-white">
                  <TableCell className="font-medium">{item.name}</TableCell>
                  <TableCell>{item.description || '-'}</TableCell>
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
              {filteredSizes.length === 0 && (
                <TableRow>
                  <TableCell colSpan={3} className="text-center text-gray-400 py-8">
                    Nenhum tamanho encontrado
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

export default JoiasTamanhos;

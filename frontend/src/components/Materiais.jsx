import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button.jsx';
import { Input } from '@/components/ui/input.jsx';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card.jsx';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table.jsx';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog.jsx';
import { Label } from '@/components/ui/label.jsx';
import { Trash2, Plus, Edit, Search, Package } from 'lucide-react';
import axios from 'axios';
import apiService from '../services/api';



function Materiais() {
  const [materials, setMaterials] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingMaterial, setEditingMaterial] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [formData, setFormData] = useState({
    nome: '',
    tipo: '',
    dimensao: '',
    precopordimensao: '',
    cor: '',
    noticia: '',
    ststoque: '',
    qmin: 0,
    webexport: false
  });

  useEffect(() => {
    fetchMaterials();
  }, []);

  const fetchMaterials = async () => {
    try {
      const response = await apiService.getMaterials();
      const data = response.data;
      setMaterials(Array.isArray(data.materials) ? data.materials : []);
      setLoading(false);
    } catch (error) {
      console.error("Erro ao buscar materiais:", error);
      setError("Erro ao carregar materiais. Por favor, tente novamente.");
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingMaterial) {
        await apiService.updateMaterial(editingMaterial.id, formData);
      } else {
        await apiService.createMaterial(formData);
      }
      fetchMaterials();
      setIsDialogOpen(false);
      setEditingMaterial(null);
      setFormData({
        name: '', type: '', purity: '', density: '', price_per_gram: '', supplier: '', description: ''
      });
    } catch (error) {
      console.error("Erro ao salvar material:", error);
      setError("Erro ao salvar material. Verifique os dados e tente novamente.");
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm("Tem certeza que deseja excluir este material?")) {
      try {
        await apiService.deleteMaterial(id);
        fetchMaterials();
      } catch (error) {
        console.error("Erro ao excluir material:", error);
        setError("Erro ao excluir material.");
      }
    }
  };

  const handleEdit = (item) => {
    setEditingMaterial(item);
    setFormData({
      nome: item.nome || '',
      tipo: item.tipo || '',
      dimensao: item.dimensao || '',
      precopordimensao: item.precopordimensao || '',
      cor: item.cor || '',
      noticia: item.noticia || '',
      ststoque: item.ststoque || '',
      qmin: item.qmin || 0,
      webexport: item.webexport || false
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

  const filteredMaterials = materials.filter(item =>
    (item.nome || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (item.tipo || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (item.cor || '').toLowerCase().includes(searchTerm.toLowerCase())
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
          <h2 className="text-3xl font-bold text-white">Materiais</h2>
          <p className="text-gray-400">Gerenciamento de materiais para joias.</p>
        </div>
        
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button 
              onClick={() => {
                setEditingMaterial(null);
                setFormData({
                  nome: '', tipo: '', dimensao: '', precopordimensao: '', cor: '', noticia: '', ststoque: '', qmin: 0, webexport: false
                });
              }}
              className="bg-purple-600 hover:bg-purple-700"
            >
              <Plus className="h-4 w-4 mr-2" />
              Novo Material
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-gray-800 border-gray-600 max-w-2xl">
            <DialogHeader>
              <DialogTitle className="text-white">
                {editingMaterial ? 'Editar Material' : 'Novo Material'}
              </DialogTitle>
              <DialogDescription className="text-gray-400">
                Preencha as informações do material.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit}>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="nome" className="text-white">Nome</Label>
                    <Input
                      id="nome"
                      name="nome"
                      value={formData.nome}
                      onChange={handleInputChange}
                      className="bg-gray-700 border-gray-600 text-white"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="tipo" className="text-white">Tipo</Label>
                    <Input
                      id="tipo"
                      name="tipo"
                      value={formData.tipo}
                      onChange={handleInputChange}
                      className="bg-gray-700 border-gray-600 text-white"
                      placeholder="Ex: Ouro, Prata, Platina"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="dimensao" className="text-white">Dimensão/Unidade</Label>
                    <Input
                      id="dimensao"
                      name="dimensao"
                      value={formData.dimensao}
                      onChange={handleInputChange}
                      className="bg-gray-700 border-gray-600 text-white"
                      placeholder="Ex: g, mt, Kg, Unid."
                    />
                  </div>
                  <div>
                    <Label htmlFor="precopordimensao" className="text-white">Preço por Dimensão</Label>
                    <Input
                      id="precopordimensao"
                      name="precopordimensao"
                      type="number"
                      step="0.01"
                      value={formData.precopordimensao}
                      onChange={handleInputChange}
                      className="bg-gray-700 border-gray-600 text-white"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="cor" className="text-white">Cor</Label>
                    <Input
                      id="cor"
                      name="cor"
                      value={formData.cor}
                      onChange={handleInputChange}
                      className="bg-gray-700 border-gray-600 text-white"
                    />
                  </div>
                  <div>
                    <Label htmlFor="ststoque" className="text-white">Status Estoque</Label>
                    <Input
                      id="ststoque"
                      name="ststoque"
                      value={formData.ststoque}
                      onChange={handleInputChange}
                      className="bg-gray-700 border-gray-600 text-white"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="qmin" className="text-white">Quantidade Mínima</Label>
                    <Input
                      id="qmin"
                      name="qmin"
                      type="number"
                      value={formData.qmin}
                      onChange={handleInputChange}
                      className="bg-gray-700 border-gray-600 text-white"
                    />
                  </div>
                  <div className="flex items-center space-x-2 pt-6">
                    <input
                      id="webexport"
                      name="webexport"
                      type="checkbox"
                      checked={formData.webexport}
                      onChange={(e) => setFormData(prev => ({...prev, webexport: e.target.checked}))}
                      className="rounded"
                    />
                    <Label htmlFor="webexport" className="text-white">Exportar para Web</Label>
                  </div>
                </div>
                <div>
                  <Label htmlFor="noticia" className="text-white">Notícia/Descrição</Label>
                  <Input
                    id="noticia"
                    name="noticia"
                    value={formData.noticia}
                    onChange={handleInputChange}
                    className="bg-gray-700 border-gray-600 text-white"
                  />
                </div>
              </div>
              <DialogFooter>
                <Button type="submit" className="bg-purple-600 hover:bg-purple-700">
                  {editingMaterial ? 'Atualizar' : 'Criar'}
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
          placeholder="Pesquisar materiais por nome, tipo ou fornecedor..."
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
              onClick={() => {setError(null); fetchMaterials();}} 
              className="mt-2 text-sm underline hover:no-underline"
            >
              Tentar novamente
            </button>
          </div>
        )}
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Package className="h-5 w-5" />
            Catálogo de Materiais
          </CardTitle>
          <CardDescription className="text-gray-400">
            Total de {filteredMaterials.length} materiais cadastrados
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-gray-300">Nome</TableHead>
                <TableHead className="text-gray-300">Tipo</TableHead>
                <TableHead className="text-gray-300">Dimensão</TableHead>
                <TableHead className="text-gray-300">Preço/Dimensão</TableHead>
                <TableHead className="text-gray-300">Cor</TableHead>
                <TableHead className="text-gray-300">Status Estoque</TableHead>
                <TableHead className="text-gray-300">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredMaterials.map((item) => (
                <TableRow key={item.id} className="hover:bg-gray-700 text-white">
                  <TableCell className="font-medium">{item.nome}</TableCell>
                  <TableCell>{item.tipo || '-'}</TableCell>
                  <TableCell>{item.dimensao || '-'}</TableCell>
                  <TableCell>
                    {item.precopordimensao ? `R$ ${parseFloat(item.precopordimensao).toFixed(2)}` : '-'}
                  </TableCell>
                  <TableCell>{item.cor || '-'}</TableCell>
                  <TableCell>{item.ststoque || '-'}</TableCell>
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
              {filteredMaterials.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-gray-400 py-8">
                    Nenhum material encontrado
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

export default Materiais;

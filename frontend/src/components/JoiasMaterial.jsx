import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button.jsx';
import { Input } from '@/components/ui/input.jsx';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card.jsx';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table.jsx';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog.jsx';
import { Label } from '@/components/ui/label.jsx';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select.jsx';
import { Trash2, Plus, Edit, Search, Diamond } from 'lucide-react';
import axios from 'axios';


// Helper para obter headers com autenticação
const getAuthHeaders = () => {
  const token = localStorage.getItem('token');
  return token ? { Authorization: `Bearer ${token}` } : {};
};

function JoiasMaterial() {
  const [jewelry, setJewelry] = useState([]);
  const [materials, setMaterials] = useState([]);
  const [stones, setStones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDetailsDialogOpen, setIsDetailsDialogOpen] = useState(false);
  const [editingJewelry, setEditingJewelry] = useState(null);
  const [selectedJewelry, setSelectedJewelry] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    category: '',
    material: '',
    stone: '',
    size: '',
    price: '',
    cost: '',
    stock_quantity: '',
    description: ''
  });

  useEffect(() => {
    fetchJewelry();
    fetchMaterials();
    fetchStones();
  }, []);

  const fetchJewelry = async () => {
    try {
      const response = await axios.get("http://localhost:5000/api/jewelry", { headers: getAuthHeaders() });
      setJewelry(Array.isArray(response.data) ? response.data : (response.data.jewelry || []));
      setLoading(false);
    } catch (error) {
      console.error("Erro ao buscar joias:", error);
      setError("Erro ao carregar joias. Por favor, tente novamente.");
      setLoading(false);
      
      // Tentar rota alternativa se a principal falhar
      try {
        const response = await axios.get("http://localhost:5000/api/joias", { headers: getAuthHeaders() });
        setJewelry(Array.isArray(response.data) ? response.data : (response.data.jewelry || []));
        setError(null); // Limpar erro se segunda tentativa funcionar
      } catch (secondError) {
        console.error("Erro na rota alternativa:", secondError);
      }
    }
  };

  const fetchMaterials = async () => {
    try {
      const response = await axios.get("http://localhost:5000/api/materials", { headers: getAuthHeaders() });
      setMaterials(response.data);
    } catch (error) {
      console.error("Erro ao buscar materiais:", error);
    }
  };

  const fetchStones = async () => {
    try {
      const response = await axios.get("http://localhost:5000/api/stones", { headers: getAuthHeaders() });
      setStones(response.data);
    } catch (error) {
      console.error("Erro ao buscar pedras:", error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingJewelry) {
        await axios.put(`http://localhost:5000/api/jewelry/${editingJewelry.id}`, formData, { headers: getAuthHeaders() });
      } else {
        await axios.post("http://localhost:5000/api/jewelry", formData, { headers: getAuthHeaders() });
      }
      fetchJewelry();
      setIsDialogOpen(false);
      setEditingJewelry(null);
      setFormData({
        name: '', code: '', category: '', material: '', stone: '', size: '',
        price: '', cost: '', stock_quantity: '', description: ''
      });
    } catch (error) {
      console.error("Erro ao salvar joia:", error);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm("Tem certeza que deseja excluir esta joia?")) {
      try {
        await axios.delete(`http://localhost:5000/api/jewelry/${id}`, { headers: getAuthHeaders() });
        fetchJewelry();
      } catch (error) {
        console.error("Erro ao excluir joia:", error);
      }
    }
  };

  const handleEdit = (item) => {
    setEditingJewelry(item);
    setFormData({
      name: item.name || '',
      code: item.code || '',
      category: item.category || '',
      material: item.material || '',
      stone: item.stone || '',
      size: item.size || '',
      price: item.price || '',
      cost: item.cost || '',
      stock_quantity: item.stock_quantity || '',
      description: item.description || ''
    });
    setIsDialogOpen(true);
  };

  const handleViewDetails = (item) => {
    setSelectedJewelry(item);
    setIsDetailsDialogOpen(true);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const filteredJewelry = (Array.isArray(jewelry) ? jewelry : []).filter(item =>
    (item.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (item.code || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (item.category || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (item.material || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold text-white">Joias</h2>
          <p className="text-gray-400">Gerenciamento do catálogo de joias.</p>
        </div>
        
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => {
              setEditingJewelry(null);
              setFormData({
                name: '', code: '', category: '', material: '', stone: '', size: '',
                price: '', cost: '', stock_quantity: '', description: ''
              });
            }}>
              <Plus className="h-4 w-4 mr-2" />
              Nova Joia
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-gray-800 border-gray-600 max-w-2xl">
            <DialogHeader>
              <DialogTitle className="text-white">
                {editingJewelry ? 'Editar Joia' : 'Nova Joia'}
              </DialogTitle>
              <DialogDescription className="text-gray-400">
                Preencha as informações da joia.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit}>
              <div className="grid gap-4 py-4 max-h-96 overflow-y-auto">
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
                    <Label htmlFor="code" className="text-white">Código</Label>
                    <Input
                      id="code"
                      name="code"
                      value={formData.code}
                      onChange={handleInputChange}
                      className="bg-gray-700 border-gray-600 text-white"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="category" className="text-white">Categoria</Label>
                    <Input
                      id="category"
                      name="category"
                      value={formData.category}
                      onChange={handleInputChange}
                      className="bg-gray-700 border-gray-600 text-white"
                    />
                  </div>
                  <div>
                    <Label htmlFor="material" className="text-white">Material</Label>
                    <Input
                      id="material"
                      name="material"
                      value={formData.material}
                      onChange={handleInputChange}
                      className="bg-gray-700 border-gray-600 text-white"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="stone" className="text-white">Pedra</Label>
                    <Input
                      id="stone"
                      name="stone"
                      value={formData.stone}
                      onChange={handleInputChange}
                      className="bg-gray-700 border-gray-600 text-white"
                    />
                  </div>
                  <div>
                    <Label htmlFor="size" className="text-white">Tamanho</Label>
                    <Input
                      id="size"
                      name="size"
                      value={formData.size}
                      onChange={handleInputChange}
                      className="bg-gray-700 border-gray-600 text-white"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="price" className="text-white">Preço</Label>
                    <Input
                      id="price"
                      name="price"
                      type="number"
                      step="0.01"
                      value={formData.price}
                      onChange={handleInputChange}
                      className="bg-gray-700 border-gray-600 text-white"
                    />
                  </div>
                  <div>
                    <Label htmlFor="cost" className="text-white">Custo</Label>
                    <Input
                      id="cost"
                      name="cost"
                      type="number"
                      step="0.01"
                      value={formData.cost}
                      onChange={handleInputChange}
                      className="bg-gray-700 border-gray-600 text-white"
                    />
                  </div>
                  <div>
                    <Label htmlFor="stock_quantity" className="text-white">Estoque</Label>
                    <Input
                      id="stock_quantity"
                      name="stock_quantity"
                      type="number"
                      value={formData.stock_quantity}
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
                  {editingJewelry ? 'Atualizar' : 'Criar'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        {/* Dialog for Jewelry Details */}
        <Dialog open={isDetailsDialogOpen} onOpenChange={setIsDetailsDialogOpen}>
          <DialogContent className="bg-gray-800 border-gray-600">
            <DialogHeader>
              <DialogTitle className="text-white">Detalhes da Joia</DialogTitle>
              <DialogDescription className="text-gray-400">
                Informações completas da joia.
              </DialogDescription>
            </DialogHeader>
            {selectedJewelry && (
              <div className="grid gap-4 py-4 text-white">
                <p><strong>ID:</strong> {selectedJewelry.id}</p>
                <p><strong>Nome:</strong> {selectedJewelry.name}</p>
                <p><strong>Código:</strong> {selectedJewelry.code || '-'}</p>
                <p><strong>Categoria:</strong> {selectedJewelry.category || '-'}</p>
                <p><strong>Material:</strong> {selectedJewelry.material || '-'}</p>
                <p><strong>Pedra:</strong> {selectedJewelry.stone || '-'}</p>
                <p><strong>Tamanho:</strong> {selectedJewelry.size || '-'}</p>
                <p><strong>Preço:</strong> {selectedJewelry.price ? `R$ ${parseFloat(selectedJewelry.price).toFixed(2)}` : '-'}</p>
                <p><strong>Custo:</strong> {selectedJewelry.cost ? `R$ ${parseFloat(selectedJewelry.cost).toFixed(2)}` : '-'}</p>
                <p><strong>Estoque:</strong> {selectedJewelry.stock_quantity || '0'}</p>
                <p><strong>Descrição:</strong> {selectedJewelry.description || '-'}</p>
              </div>
            )}
            <DialogFooter>
              <Button onClick={() => setIsDetailsDialogOpen(false)} className="bg-gray-600 hover:bg-gray-700">Fechar</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
        <Input
          placeholder="Pesquisar joias por nome, código, categoria ou material..."
          className="pl-10 bg-gray-800 border-gray-600 text-white placeholder-gray-400"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      <Card className="bg-gray-800 border-gray-600">
        {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          <p className="font-bold">Erro</p>
          <p className="text-sm">{error}</p>
          <button 
            onClick={() => {setError(null); fetchJewelry();}} 
            className="mt-2 text-sm underline hover:no-underline"
          >
            Tentar novamente
          </button>
        </div>
      )}
      <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Diamond className="h-5 w-5" />
            Catálogo de Joias
          </CardTitle>
          <CardDescription className="text-gray-400">
            Total de {filteredJewelry.length} joias cadastradas
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-gray-300">Código</TableHead>
                <TableHead className="text-gray-300">Nome</TableHead>
                <TableHead className="text-gray-300">Categoria</TableHead>
                <TableHead className="text-gray-300">Material</TableHead>
                <TableHead className="text-gray-300">Preço</TableHead>
                <TableHead className="text-gray-300">Estoque</TableHead>
                <TableHead className="text-gray-300">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredJewelry.map((item) => (
                <TableRow key={item.id} onClick={() => handleViewDetails(item)} className="cursor-pointer hover:bg-gray-700 text-white">
                  <TableCell>{item.code || '-'}</TableCell>
                  <TableCell>{item.name}</TableCell>
                  <TableCell>{item.category || '-'}</TableCell>
                  <TableCell>{item.material || '-'}</TableCell>
                  <TableCell>
                    {item.price ? `R$ ${parseFloat(item.price).toFixed(2)}` : '-'}
                  </TableCell>
                  <TableCell>{item.stock_quantity || '0'}</TableCell>
                  <TableCell onClick={(e) => e.stopPropagation()}>
                    <div className="flex space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEdit(item)}
                        className="border-gray-600 text-gray-300 hover:bg-gray-700"
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDelete(item.id)}
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

export default JoiasMaterial;



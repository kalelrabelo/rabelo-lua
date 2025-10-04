import React, { useState, useEffect } from 'react';
import { Search, Package, AlertTriangle, Edit, Trash2, Plus, Filter } from 'lucide-react';

function Estoque() {
  const [inventory, setInventory] = useState([]);
  const [filteredInventory, setFilteredInventory] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [filterCategory, setFilterCategory] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    category: '',
    quantity: 0,
    min_quantity: 0,
    unit: '',
    unit_price: 0,
    supplier: '',
    description: ''
  });

  // Dados de exemplo
  useEffect(() => {
    const exampleInventory = [
      {
        id: 1,
        name: 'Ouro 18k',
        category: 'Metal Precioso',
        quantity: 125.5,
        min_quantity: 50,
        unit: 'gramas',
        unit_price: 85.50,
        supplier: 'Casa da Moeda',
        description: 'Ouro puro 750/1000',
        status: 'normal',
        last_updated: '2025-10-01'
      },
      {
        id: 2,
        name: 'Diamante 0.5ct',
        category: 'Pedra Preciosa',
        quantity: 8,
        min_quantity: 10,
        unit: 'unidades',
        unit_price: 2500.00,
        supplier: 'Diamond Brasil',
        description: 'Diamante lapidação brilhante',
        status: 'critico',
        last_updated: '2025-09-28'
      },
      {
        id: 3,
        name: 'Prata 950',
        category: 'Metal Precioso',
        quantity: 200.8,
        min_quantity: 100,
        unit: 'gramas',
        unit_price: 4.20,
        supplier: 'Metais Finos Ltda',
        description: 'Prata pura para joias',
        status: 'normal',
        last_updated: '2025-09-30'
      },
      {
        id: 4,
        name: 'Esmeralda Colombiana',
        category: 'Pedra Preciosa',
        quantity: 3,
        min_quantity: 5,
        unit: 'unidades',
        unit_price: 1800.00,
        supplier: 'Gemas do Brasil',
        description: 'Esmeralda natural certificada',
        status: 'critico',
        last_updated: '2025-09-25'
      },
      {
        id: 5,
        name: 'Corrente Rommanel 40cm',
        category: 'Componente',
        quantity: 25,
        min_quantity: 15,
        unit: 'unidades',
        unit_price: 45.00,
        supplier: 'Rommanel S.A.',
        description: 'Corrente folheada a ouro',
        status: 'normal',
        last_updated: '2025-10-01'
      },
      {
        id: 6,
        name: 'Pérola Akoya 8mm',
        category: 'Pedra Preciosa',
        quantity: 12,
        min_quantity: 20,
        unit: 'unidades',
        unit_price: 150.00,
        supplier: 'Pérolas do Oriente',
        description: 'Pérola natural cultivada',
        status: 'baixo',
        last_updated: '2025-09-29'
      }
    ];
    
    setInventory(exampleInventory);
    setFilteredInventory(exampleInventory);
  }, []);

  // Filtros
  useEffect(() => {
    let filtered = inventory.filter(item =>
      (item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
       item.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
       item.supplier.toLowerCase().includes(searchTerm.toLowerCase())) &&
      (filterCategory === '' || item.category === filterCategory)
    );
    
    setFilteredInventory(filtered);
  }, [searchTerm, filterCategory, inventory]);

  const getStatusColor = (item) => {
    if (item.quantity <= item.min_quantity * 0.5) return 'text-red-500 bg-red-50';
    if (item.quantity <= item.min_quantity) return 'text-orange-500 bg-orange-50';
    return 'text-green-500 bg-green-50';
  };

  const getStatusText = (item) => {
    if (item.quantity <= item.min_quantity * 0.5) return 'Crítico';
    if (item.quantity <= item.min_quantity) return 'Baixo';
    return 'Normal';
  };

  const getStatusIcon = (item) => {
    if (item.quantity <= item.min_quantity * 0.5) return <AlertTriangle className="h-4 w-4" />;
    if (item.quantity <= item.min_quantity) return <Package className="h-4 w-4" />;
    return <Package className="h-4 w-4" />;
  };

  const handleEdit = (item) => {
    setEditingItem(item);
    setFormData({
      name: item.name,
      category: item.category,
      quantity: item.quantity,
      min_quantity: item.min_quantity,
      unit: item.unit,
      unit_price: item.unit_price,
      supplier: item.supplier,
      description: item.description
    });
    setShowForm(true);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (editingItem) {
      // Atualizar item existente
      const updatedInventory = inventory.map(item =>
        item.id === editingItem.id 
          ? { ...item, ...formData, last_updated: new Date().toISOString().split('T')[0] }
          : item
      );
      setInventory(updatedInventory);
      alert('Item atualizado com sucesso!');
    } else {
      // Criar novo item
      const newItem = {
        id: Date.now(),
        ...formData,
        status: 'normal',
        last_updated: new Date().toISOString().split('T')[0]
      };
      setInventory([...inventory, newItem]);
      alert('Item adicionado com sucesso!');
    }
    
    resetForm();
  };

  const handleDelete = (id) => {
    if (window.confirm('Tem certeza que deseja excluir este item?')) {
      setInventory(inventory.filter(item => item.id !== id));
      alert('Item excluído com sucesso!');
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      category: '',
      quantity: 0,
      min_quantity: 0,
      unit: '',
      unit_price: 0,
      supplier: '',
      description: ''
    });
    setEditingItem(null);
    setShowForm(false);
  };

  const categories = [...new Set(inventory.map(item => item.category))];
  const criticalItems = inventory.filter(item => item.quantity <= item.min_quantity * 0.5);
  const lowStockItems = inventory.filter(item => item.quantity <= item.min_quantity && item.quantity > item.min_quantity * 0.5);
  const totalValue = inventory.reduce((sum, item) => sum + (item.quantity * item.unit_price), 0);

  return (
    <div className="p-6 space-y-6 bg-black min-h-screen">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-white">Controle de Estoque</h1>
          <p className="text-gray-400">Gerenciamento completo do inventário</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2"
        >
          <Plus size={20} />
          Novo Item
        </button>
      </div>

      {/* Cards de Resumo */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-gray-800 border border-gray-700 p-4 rounded-lg">
          <h3 className="text-white font-semibold">Total de Itens</h3>
          <p className="text-2xl font-bold text-blue-400">{inventory.length}</p>
        </div>
        <div className="bg-gray-800 border border-gray-700 p-4 rounded-lg">
          <h3 className="text-white font-semibold">Valor Total</h3>
          <p className="text-2xl font-bold text-green-400">
            {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(totalValue)}
          </p>
        </div>
        <div className="bg-gray-800 border border-red-600 p-4 rounded-lg">
          <h3 className="text-white font-semibold">Estoque Crítico</h3>
          <p className="text-2xl font-bold text-red-400">{criticalItems.length}</p>
        </div>
        <div className="bg-gray-800 border border-orange-600 p-4 rounded-lg">
          <h3 className="text-white font-semibold">Estoque Baixo</h3>
          <p className="text-2xl font-bold text-orange-400">{lowStockItems.length}</p>
        </div>
      </div>

      {/* Filtros */}
      <div className="bg-gray-800 border border-gray-700 p-4 rounded-lg">
        <div className="flex flex-wrap gap-4">
          <div className="relative flex-1 min-w-64">
            <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Pesquisar por nome, descrição ou fornecedor..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 w-full bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Todas as Categorias</option>
            {categories.map(category => (
              <option key={category} value={category}>{category}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Tabela */}
      <div className="bg-gray-800 border border-gray-700 rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-700">
            <thead className="bg-gray-900">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                  Item
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                  Categoria
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                  Quantidade
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                  Valor Unitário
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                  Valor Total
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                  Ações
                </th>
              </tr>
            </thead>
            <tbody className="bg-gray-800 divide-y divide-gray-700">
              {filteredInventory.map((item) => (
                <tr key={item.id} className="hover:bg-gray-700">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-white">{item.name}</div>
                      <div className="text-sm text-gray-400">{item.description}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                    {item.category}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                    {item.quantity} {item.unit}
                    <div className="text-xs text-gray-400">
                      Min: {item.min_quantity} {item.unit}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                    {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(item.unit_price)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                    {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(item.quantity * item.unit_price)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center gap-1 px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(item)}`}>
                      {getStatusIcon(item)}
                      {getStatusText(item)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleEdit(item)}
                        className="text-blue-400 hover:text-blue-300"
                      >
                        <Edit size={16} />
                      </button>
                      <button
                        onClick={() => handleDelete(item.id)}
                        className="text-red-400 hover:text-red-300"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal do Formulário */}
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 border border-gray-700 p-6 rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold text-white mb-4">
              {editingItem ? 'Editar Item' : 'Novo Item'}
            </h2>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                    Nome do Item *
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    className="w-full p-2 bg-gray-700 border border-gray-600 rounded-lg text-white"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                    Categoria *
                  </label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({...formData, category: e.target.value})}
                    className="w-full p-2 bg-gray-700 border border-gray-600 rounded-lg text-white"
                    required
                  >
                    <option value="">Selecione...</option>
                    <option value="Metal Precioso">Metal Precioso</option>
                    <option value="Pedra Preciosa">Pedra Preciosa</option>
                    <option value="Componente">Componente</option>
                    <option value="Ferramenta">Ferramenta</option>
                    <option value="Embalagem">Embalagem</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                    Quantidade *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.quantity}
                    onChange={(e) => setFormData({...formData, quantity: parseFloat(e.target.value) || 0})}
                    className="w-full p-2 bg-gray-700 border border-gray-600 rounded-lg text-white"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                    Quantidade Mínima *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.min_quantity}
                    onChange={(e) => setFormData({...formData, min_quantity: parseFloat(e.target.value) || 0})}
                    className="w-full p-2 bg-gray-700 border border-gray-600 rounded-lg text-white"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                    Unidade *
                  </label>
                  <select
                    value={formData.unit}
                    onChange={(e) => setFormData({...formData, unit: e.target.value})}
                    className="w-full p-2 bg-gray-700 border border-gray-600 rounded-lg text-white"
                    required
                  >
                    <option value="">Selecione...</option>
                    <option value="gramas">gramas</option>
                    <option value="quilates">quilates</option>
                    <option value="unidades">unidades</option>
                    <option value="metros">metros</option>
                    <option value="centímetros">centímetros</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                    Valor Unitário (R$) *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.unit_price}
                    onChange={(e) => setFormData({...formData, unit_price: parseFloat(e.target.value) || 0})}
                    className="w-full p-2 bg-gray-700 border border-gray-600 rounded-lg text-white"
                    required
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Fornecedor
                </label>
                <input
                  type="text"
                  value={formData.supplier}
                  onChange={(e) => setFormData({...formData, supplier: e.target.value})}
                  className="w-full p-2 bg-gray-700 border border-gray-600 rounded-lg text-white"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Descrição
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  className="w-full p-2 bg-gray-700 border border-gray-600 rounded-lg text-white"
                  rows="3"
                />
              </div>
              
              <div className="flex gap-4 pt-4">
                <button
                  type="submit"
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-lg"
                >
                  {editingItem ? 'Atualizar' : 'Criar'}
                </button>
                <button
                  type="button"
                  onClick={resetForm}
                  className="flex-1 bg-gray-600 hover:bg-gray-700 text-white py-2 px-4 rounded-lg"
                >
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      
      {filteredInventory.length === 0 && (
        <div className="text-center py-8 text-gray-400">
          <Package size={48} className="mx-auto mb-4 opacity-50" />
          <p>Nenhum item encontrado no estoque</p>
        </div>
      )}
    </div>
  );
}

export default Estoque;
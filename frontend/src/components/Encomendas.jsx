import React, { useState, useEffect } from 'react';

const Encomendas = () => {
  const [orders, setOrders] = useState([]);
  const [jewelries, setJewelries] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editingOrder, setEditingOrder] = useState(null);
  const [formData, setFormData] = useState({
    customer_name: '',
    customer_contact: '',
    jewelry_id: '',
    quantity: 1,
    unit_price: '',
    delivery_date: '',
    notes: '',
    auto_reserve_materials: true
  });

  const handleCreate = () => {
    // Implementação será adicionada
    console.log('Criar novo item');
  };



  const handleDelete = (id) => {
    if (confirm('Tem certeza que deseja excluir este item?')) {
      // Implementação será adicionada
      console.log('Deletar item:', id);
    }
  };

  useEffect(() => {
    fetchOrders();
    fetchJewelries();
  }, []);

  const fetchOrders = async () => {
    try {
      // Dados de exemplo - substituir pela API real quando estiver pronta
      const exampleOrders = [
        {
          id: 1,
          customer_name: 'Maria Silva',
          customer_contact: '(11) 99999-9999',
          jewelry_name: 'Anel de Noivado Solitário',
          quantity: 1,
          unit_price: 2500.00,
          total_price: 2500.00,
          delivery_date: '2025-11-15',
          status: 'Em Produção',
          created_at: '2025-10-01T10:00:00Z',
          notes: 'Cliente prefere ouro branco 18k'
        },
        {
          id: 2,
          customer_name: 'João Santos',
          customer_contact: '(11) 88888-8888',
          jewelry_name: 'Colar Riviera',
          quantity: 1,
          unit_price: 4500.00,
          total_price: 4500.00,
          delivery_date: '2025-11-20',
          status: 'Aguardando Material',
          created_at: '2025-09-28T15:30:00Z',
          notes: 'Diamantes de 0.5ct cada'
        },
        {
          id: 3,
          customer_name: 'Ana Costa',
          customer_contact: '(11) 77777-7777',
          jewelry_name: 'Brincos de Pérola',
          quantity: 1,
          unit_price: 850.00,
          total_price: 850.00,
          delivery_date: '2025-11-10',
          status: 'Finalizado',
          created_at: '2025-09-25T09:15:00Z',
          notes: 'Pérolas cultivadas naturais'
        }
      ];
      
      setOrders(exampleOrders);
      
      // Código para API real (comentado)
      /*
      const response = await fetch('/api/orders');
      const data = await response.json();
      setOrders(data);
      */
    } catch (error) {
      console.error('Erro ao buscar encomendas:', error);
    }
  };

  const fetchJewelries = async () => {
    try {
      // Dados de exemplo - substituir pela API real quando estiver pronta
      const exampleJewelries = [
        { id: 1, name: 'Anel de Noivado Solitário', price: 2500.00 },
        { id: 2, name: 'Colar Riviera', price: 4500.00 },
        { id: 3, name: 'Brincos de Pérola', price: 850.00 },
        { id: 4, name: 'Pulseira Tennis', price: 3200.00 },
        { id: 5, name: 'Anel Aparador', price: 1200.00 }
      ];
      
      setJewelries(exampleJewelries);
      
      // Código para API real (comentado)
      /*
      const response = await fetch('http://localhost:5000/api/jewelry', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      });
      const data = await response.json();
      setJewelries(data);
      */
    } catch (error) {
      console.error('Erro ao buscar joias:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const url = editingOrder 
        ? `/api/orders/${editingOrder.id}`
        : '/api/orders';
      
      const method = editingOrder ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        const result = await response.json();
        alert(result.message || 'Encomenda salva com sucesso!');
        
        // Mostrar resultado da reserva de materiais se houver
        if (result.reservation_result) {
          if (result.reservation_result.error) {
            alert(`Aviso: ${result.reservation_result.error}`);
          } else {
            alert(`Materiais reservados: ${result.reservation_result.success}`);
          }
        }
        
        fetchOrders();
        resetForm();
      } else {
        const error = await response.json();
        alert(`Erro: ${error.error}`);
      }
    } catch (error) {
      console.error('Erro ao salvar encomenda:', error);
      alert('Erro ao salvar encomenda');
    }
  };

  const handleCompleteOrder = async (orderId) => {
    if (!confirm('Tem certeza que deseja finalizar esta encomenda? Esta ação irá:\n- Consumir materiais do estoque\n- Registrar custos automáticos\n- Calcular lucros')) {
      return;
    }

    try {
      const response = await fetch(`/api/orders/${orderId}/complete`, {
        method: 'POST',
      });

      const result = await response.json();
      
      if (response.ok) {
        alert('Encomenda finalizada com sucesso!\nCustos e lucros foram registrados automaticamente.');
        fetchOrders();
      } else {
        alert(`Erro: ${result.error}`);
      }
    } catch (error) {
      console.error('Erro ao finalizar encomenda:', error);
      alert('Erro ao finalizar encomenda');
    }
  };

  const handleEdit = (order) => {
    setEditingOrder(order);
    setFormData({
      customer_name: order.customer_name,
      customer_contact: order.customer_contact || '',
      jewelry_id: order.jewelry_id,
      quantity: order.quantity,
      unit_price: order.unit_price,
      delivery_date: order.delivery_date ? order.delivery_date.split('T')[0] : '',
      notes: order.notes || '',
      auto_reserve_materials: false
    });
    setShowForm(true);
  };

  const resetForm = () => {
    setFormData({
      customer_name: '',
      customer_contact: '',
      jewelry_id: '',
      quantity: 1,
      unit_price: '',
      delivery_date: '',
      notes: '',
      auto_reserve_materials: true
    });
    setEditingOrder(null);
    setShowForm(false);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'in_progress': return 'bg-blue-100 text-blue-800';
      case 'completed': return 'bg-green-100 text-green-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'pending': return 'Pendente';
      case 'in_progress': return 'Em Andamento';
      case 'completed': return 'Finalizada';
      case 'cancelled': return 'Cancelada';
      default: return status;
    }
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Encomendas</h1>
        <button
          onClick={() => setShowForm(true)}
          className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg"
        >
          Nova Encomenda
        </button>
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg w-full max-w-md max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold mb-4">
              {editingOrder ? 'Editar Encomenda' : 'Nova Encomenda'}
            </h2>
            <form onSubmit={handleSubmit}>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nome do Cliente *
                </label>
                <input
                  type="text"
                  value={formData.customer_name}
                  onChange={(e) => setFormData({...formData, customer_name: e.target.value})}
                  className="w-full p-2 border border-gray-300 rounded-lg"
                  required
                />
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Joia *
                </label>
                <select
                  value={formData.jewelry_id}
                  onChange={(e) => setFormData({...formData, jewelry_id: e.target.value})}
                  className="w-full p-2 border border-gray-300 rounded-lg"
                  required
                >
                  <option value="">Selecione uma joia</option>
                  {(Array.isArray(jewelries) ? jewelries : []).map((jewelry) => (
                    <option key={jewelry.id} value={jewelry.id}>
                      {jewelry.name} - R$ {jewelry.price?.toFixed(2)}
                    </option>
                  ))}
                </select>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Preço Unitário (R$) *
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.unit_price}
                  onChange={(e) => setFormData({...formData, unit_price: parseFloat(e.target.value)})}
                  className="w-full p-2 border border-gray-300 rounded-lg"
                  required
                />
              </div>

              <div className="flex gap-2">
                <button
                  type="submit"
                  className="flex-1 bg-blue-500 hover:bg-blue-600 text-white py-2 px-4 rounded-lg"
                >
                  {editingOrder ? 'Atualizar' : 'Criar'}
                </button>
                <button
                  type="button"
                  onClick={resetForm}
                  className="flex-1 bg-gray-500 hover:bg-gray-600 text-white py-2 px-4 rounded-lg"
                >
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Cliente
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Joia
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Valor Total
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Ações
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {(Array.isArray(orders) ? orders : []).map((order) => (
                <tr key={order.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {order.customer_name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {order.jewelry_name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    R$ {order.total_price?.toFixed(2)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(order.status)}`}>
                      {order.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex gap-2">
                      {order.status === 'pending' && (
                        <>
                          <button
                            onClick={() => handleEdit(order)}
                            className="text-blue-600 hover:text-blue-900"
                          >
                            Editar
                          </button>
                          <button
                            onClick={() => handleCompleteOrder(order.id)}
                            className="text-green-600 hover:text-green-900"
                          >
                            Finalizar
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {orders.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          Nenhuma encomenda encontrada
        </div>
      )}
    </div>
  );
};

export default Encomendas;



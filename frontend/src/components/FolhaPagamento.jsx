import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button.jsx';
import { Input } from '@/components/ui/input.jsx';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card.jsx';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table.jsx';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog.jsx';
import { Label } from '@/components/ui/label.jsx';
import { Trash2, Plus, Edit } from 'lucide-react';

function FolhaPagamento() {
  const [payroll, setPayroll] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingPayroll, setEditingPayroll] = useState(null);
  const [funcionarios, setFuncionarios] = useState([]);
  const [formData, setFormData] = useState({
    employeeId: '',
    month: '',
    year: '',
    baseSalary: '',
    discounts: [],
    netSalary: ''
  });

  useEffect(() => {
    fetchPayroll();
    fetchFuncionarios();
  }, []);

  const fetchPayroll = async () => {
    try {
      const response = await fetch('/api/payroll');
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      setPayroll(data.sort((a, b) => {
        const dateA = new Date(a.year, a.month - 1);
        const dateB = new Date(b.year, b.month - 1);
        return dateB - dateA;
      }));
      setLoading(false);
    } catch (error) {
      console.error("Erro ao buscar folhas de pagamento:", error);
      setLoading(false);
    }
  };

  const fetchFuncionarios = async () => {
    try {
      const response = await fetch('/api/employees');
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      setFuncionarios(data);
    } catch (error) {
      console.error("Erro ao buscar funcionários:", error);
    }
  };

  const calculateNetSalary = (baseSalary, discounts) => {
    const totalDiscounts = discounts.reduce((sum, discount) => sum + (parseFloat(discount.value) || 0), 0);
    return (parseFloat(baseSalary) || 0) - totalDiscounts;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const netSalary = calculateNetSalary(formData.baseSalary, formData.discounts);
    try {
      const method = editingPayroll ? 'PUT' : 'POST';
      const url = editingPayroll ? `/api/payroll/${editingPayroll.id}` : '/api/payroll';
      
      const response = await fetch(url, {
        method: method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          employee_id: formData.employeeId,
          month: parseInt(formData.month),
          year: parseInt(formData.year),
          base_salary: parseFloat(formData.baseSalary),
          discounts: formData.discounts, // Backend precisa lidar com isso se for para persistir
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
      }

      await fetchPayroll();
      setIsDialogOpen(false);
      setEditingPayroll(null);
      setFormData({ employeeId: '', month: '', year: '', baseSalary: '', discounts: [], netSalary: '' });
    } catch (error) {
      console.error("Erro ao salvar folha de pagamento:", error);
      alert(`Erro ao salvar folha de pagamento: ${error.message}`);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Tem certeza que deseja excluir esta folha de pagamento?')) {
      try {
        const response = await fetch(`/api/payroll/${id}`, {
          method: 'DELETE',
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
        }

        await fetchPayroll();
      } catch (error) {
        console.error("Erro ao excluir folha de pagamento:", error);
        alert(`Erro ao excluir folha de pagamento: ${error.message}`);
      }
    }
  };

  const handleEdit = (item) => {
    setEditingPayroll(item);
    setFormData({
      employeeId: item.employee_id,
      month: item.month,
      year: item.year,
      baseSalary: item.base_salary,
      discounts: item.discounts || [],
      netSalary: item.net_salary
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

  const handleDiscountChange = (index, e) => {
    const { name, value } = e.target;
    const newDiscounts = [...formData.discounts];
    newDiscounts[index] = { ...newDiscounts[index], [name]: value };
    setFormData(prev => ({
      ...prev,
      discounts: newDiscounts
    }));
  };

  const addDiscount = () => {
    setFormData(prev => ({
      ...prev,
      discounts: [...prev.discounts, { description: '', value: '' }]
    }));
  };

  const removeDiscount = (index) => {
    setFormData(prev => ({
      ...prev,
      discounts: prev.discounts.filter((_, i) => i !== index)
    }));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold text-gray-900">Folha de Pagamento</h2>
          <p className="text-gray-600">Gerenciamento de folhas de pagamento dos funcionários.</p>
        </div>
        
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => {
              setEditingPayroll(null);
              setFormData({ employeeId: '', month: '', year: '', baseSalary: '', discounts: [], netSalary: '' });
            }}>
              <Plus className="h-4 w-4 mr-2" />
              Nova Folha de Pagamento
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {editingPayroll ? 'Editar Folha de Pagamento' : 'Nova Folha de Pagamento'}
              </DialogTitle>
              <DialogDescription>
                Preencha as informações da folha de pagamento.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit}>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="employeeId" className="text-right">
                    Funcionário
                  </Label>
                  <select
                    id="employeeId"
                    name="employeeId"
                    value={formData.employeeId}
                    onChange={handleInputChange}
                    className="col-span-3 p-2 border rounded-md"
                    required
                  >
                    <option value="">Selecione um funcionário</option>
                    {(Array.isArray(funcionarios) ? funcionarios : []).map(employee => (
                      <option key={employee.id} value={employee.id}>
                        {employee.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="month" className="text-right">
                    Mês
                  </Label>
                  <Input
                    id="month"
                    name="month"
                    type="number"
                    value={formData.month}
                    onChange={handleInputChange}
                    className="col-span-3"
                    required
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="year" className="text-right">
                    Ano
                  </Label>
                  <Input
                    id="year"
                    name="year"
                    type="number"
                    value={formData.year}
                    onChange={handleInputChange}
                    className="col-span-3"
                    required
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="baseSalary" className="text-right">
                    Salário Base
                  </Label>
                  <Input
                    id="baseSalary"
                    name="baseSalary"
                    type="number"
                    step="0.01"
                    value={formData.baseSalary}
                    onChange={handleInputChange}
                    className="col-span-3"
                    required
                  />
                </div>
                {/* Descontos não são diretamente editáveis aqui, pois são calculados do backend */}
                {/* <div className="col-span-4">
                  <h4 className="text-lg font-semibold mb-2">Descontos</h4>
                  {formData.discounts.map((discount, index) => (
                    <div key={index} className="grid grid-cols-4 items-center gap-4 mb-2">
                      <Input
                        name="description"
                        placeholder="Descrição"
                        value={discount.description}
                        onChange={(e) => handleDiscountChange(index, e)}
                        className="col-span-2"
                      />
                      <Input
                        name="value"
                        placeholder="Valor"
                        type="number"
                        step="0.01"
                        value={discount.value}
                        onChange={(e) => handleDiscountChange(index, e)}
                        className="col-span-1"
                      />
                      <Button type="button" variant="destructive" size="sm" onClick={() => removeDiscount(index)}>
                        Remover
                      </Button>
                    </div>
                  ))}
                  <Button type="button" variant="outline" size="sm" onClick={addDiscount}>
                    Adicionar Desconto
                  </Button>
                </div> */}
              </div>
              <DialogFooter>
                <Button type="submit">
                  {editingPayroll ? 'Atualizar' : 'Criar'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Lista de Folhas de Pagamento</CardTitle>
          <CardDescription>
            Total de {payroll.length} folhas de pagamento registradas
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID</TableHead>
                <TableHead>Funcionário</TableHead>
                <TableHead>Mês/Ano</TableHead>
                <TableHead>Salário Base</TableHead>
                <TableHead>Total Vales</TableHead>
                <TableHead>Salário Líquido</TableHead>
                <TableHead>Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(Array.isArray(payroll) ? payroll : []).map((item) => {
                const employee = funcionarios.find(emp => emp.id === item.employee_id);
                return (
                  <TableRow key={item.id}>
                    <TableCell>{item.id}</TableCell>
                    <TableCell>{employee ? employee.name : 'N/A'}</TableCell>
                    <TableCell>{item.month}/{item.year}</TableCell>
                    <TableCell>R$ {parseFloat(item.base_salary || 0).toFixed(2)}</TableCell>
                    <TableCell>R$ {parseFloat(item.total_vales || 0).toFixed(2)}</TableCell>
                    <TableCell>R$ {parseFloat(item.net_salary || 0).toFixed(2)}</TableCell>
                    <TableCell>
                      <div className="flex space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEdit(item)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDelete(item.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

export default FolhaPagamento;



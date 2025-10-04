import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button.jsx';
import { Input } from '@/components/ui/input.jsx';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card.jsx';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table.jsx';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog.jsx';
import { Label } from '@/components/ui/label.jsx';
import { Trash2, Plus, Edit, Image as ImageIcon } from 'lucide-react';
import axios from 'axios';
import apiService from '../services/api';




function Funcionarios() {
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDetailsDialogOpen, setIsDetailsDialogOpen] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState(null);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    cpf: '',
    role: '',
    phone: '',
    email: '',
    salary: ''
  });

  useEffect(() => {
    fetchEmployees();
  }, []);

  const fetchEmployees = async () => {
    try {
      const response = await apiService.getEmployees();
      setEmployees(Array.isArray(response.data) ? response.data : (response.data.employees || []));
      setLoading(false);
    } catch (error) {
      console.error("Erro ao buscar funcionários:", error);
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingEmployee) {
        await apiService.updateEmployee(editingEmployee.id, formData);
      } else {
        await apiService.createEmployee(formData);
      }
      fetchEmployees(); // Recarrega os dados após a operação
      setIsDialogOpen(false);
      setEditingEmployee(null);
      setFormData({ name: '', cpf: '', role: '', phone: '', email: '', salary: '' });
    } catch (error) {
      console.error("Erro ao salvar funcionário:", error);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm("Tem certeza que deseja excluir este funcionário?")) {
      try {
        await apiService.deleteEmployee(id);
        fetchEmployees(); // Recarrega os dados após a exclusão
      } catch (error) {
        console.error("Erro ao excluir funcionário:", error);
      }
    }
  };

  const handleEdit = (employee) => {
    setEditingEmployee(employee);
    setFormData({
      name: employee.name,
      cpf: employee.cpf || '',
      role: employee.role || '',
      phone: employee.phone || '',
      email: employee.email || '',
      salary: employee.salary || ''
    });
    setIsDialogOpen(true);
  };

  const handleViewDetails = (employee) => {
    setSelectedEmployee(employee);
    setIsDetailsDialogOpen(true);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
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
          <h2 className="text-3xl font-bold text-white">Funcionários</h2>
          <p className="text-gray-400">Gerenciamento de informações de funcionários.</p>
        </div>
        
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => {
              setEditingEmployee(null);
              setFormData({ name: '', cpf: '', role: '', phone: '', email: '', salary: '' });
            }}>
              <Plus className="h-4 w-4 mr-2" />
              Novo Funcionário
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-gray-800 border-gray-600">
            <DialogHeader>
              <DialogTitle className="text-white">
                {editingEmployee ? 'Editar Funcionário' : 'Novo Funcionário'}
              </DialogTitle>
              <DialogDescription className="text-gray-400">
                Preencha as informações do funcionário.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit}>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="name" className="text-right text-white">
                    Nome
                  </Label>
                  <Input
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    className="col-span-3 bg-gray-700 border-gray-600 text-white"
                    required
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="cpf" className="text-right text-white">
                    CPF
                  </Label>
                  <Input
                    id="cpf"
                    name="cpf"
                    value={formData.cpf}
                    onChange={handleInputChange}
                    className="col-span-3 bg-gray-700 border-gray-600 text-white"
                    required
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="role" className="text-right text-white">
                    Cargo
                  </Label>
                  <Input
                    id="role"
                    name="role"
                    value={formData.role}
                    onChange={handleInputChange}
                    className="col-span-3 bg-gray-700 border-gray-600 text-white"
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="phone" className="text-right text-white">
                    Telefone
                  </Label>
                  <Input
                    id="phone"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    className="col-span-3 bg-gray-700 border-gray-600 text-white"
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="email" className="text-right text-white">
                    Email
                  </Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    className="col-span-3 bg-gray-700 border-gray-600 text-white"
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="salary" className="text-right text-white">
                    Salário
                  </Label>
                  <Input
                    id="salary"
                    name="salary"
                    type="number"
                    step="0.01"
                    value={formData.salary}
                    onChange={handleInputChange}
                    className="col-span-3 bg-gray-700 border-gray-600 text-white"
                  />
                </div>
              </div>
              <DialogFooter>
                <Button type="submit" className="bg-purple-600 hover:bg-purple-700">
                  {editingEmployee ? 'Atualizar' : 'Criar'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        {/* Dialog for Employee Details */}
        <Dialog open={isDetailsDialogOpen} onOpenChange={setIsDetailsDialogOpen}>
          <DialogContent className="bg-gray-800 border-gray-600">
            <DialogHeader>
              <DialogTitle className="text-white">Detalhes do Funcionário</DialogTitle>
              <DialogDescription className="text-gray-400">
                Informações completas do funcionário.
              </DialogDescription>
            </DialogHeader>
            {selectedEmployee && (
              <div className="grid gap-4 py-4 text-white">
                <p><strong>ID:</strong> {selectedEmployee.id}</p>
                <p><strong>Nome:</strong> {selectedEmployee.name}</p>
                <p><strong>CPF:</strong> {selectedEmployee.cpf || '-'}</p>
                <p><strong>Cargo:</strong> {selectedEmployee.role || '-'}</p>
                <p><strong>Telefone:</strong> {selectedEmployee.phone || '-'}</p>
                <p><strong>Email:</strong> {selectedEmployee.email || '-'}</p>
                <p><strong>Salário:</strong> {selectedEmployee.salary ? `R$ ${parseFloat(selectedEmployee.salary).toFixed(2)}` : '-'}</p>
                <p><strong>Ativo:</strong> {selectedEmployee.active ? 'Sim' : 'Não'}</p>
              </div>
            )}
            <DialogFooter>
              <Button onClick={() => setIsDetailsDialogOpen(false)} className="bg-gray-600 hover:bg-gray-700">Fechar</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <Card className="bg-gray-800 border-gray-600">
        <CardHeader>
          <CardTitle className="text-white">Lista de Funcionários</CardTitle>
          <CardDescription className="text-gray-400">
            Total de {employees.length} funcionários cadastrados
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-gray-300">ID</TableHead>
                <TableHead className="text-gray-300">Nome</TableHead>
                <TableHead className="text-gray-300">CPF</TableHead>
                <TableHead className="text-gray-300">Cargo</TableHead>
                <TableHead className="text-gray-300">Salário</TableHead>
                <TableHead className="text-gray-300">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(Array.isArray(employees) ? employees : []).map((employee) => (
                <TableRow key={employee.id} onClick={() => handleViewDetails(employee)} className="cursor-pointer hover:bg-gray-700 text-white">
                  <TableCell>{employee.id}</TableCell>
                  <TableCell>{employee.name}</TableCell>
                  <TableCell>{employee.cpf || '-'}</TableCell>
                  <TableCell>{employee.role || '-'}</TableCell>
                  <TableCell>
                    {employee.salary ? `R$ ${parseFloat(employee.salary).toFixed(2)}` : '-'}
                  </TableCell>
                  <TableCell onClick={(e) => e.stopPropagation()}> {/* Prevent row click from triggering when clicking buttons */}
                    <div className="flex space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEdit(employee)}
                        className="border-gray-600 text-gray-300 hover:bg-gray-700"
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDelete(employee.id)}
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

export default Funcionarios;



import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { 
  DollarSign, 
  TrendingUp, 
  TrendingDown, 
  PieChart, 
  BarChart3,
  Users,
  Calendar,
  Receipt,
  Target,
  AlertCircle
} from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart as RechartsPieChart, Cell, BarChart, Bar } from 'recharts';

const FinanceDashboard = () => {
  const [financialData, setFinancialData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState('month');

  useEffect(() => {
    fetchFinancialData();
  }, [selectedPeriod]);

  const fetchFinancialData = async () => {
    try {
      const response = await fetch('/api/lua/dashboard/financial');
      const data = await response.json();
      
      if (data.status === 'success') {
        setFinancialData(data.data);
      }
    } catch (error) {
      console.error('Erro ao buscar dados financeiros:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value || 0);
  };

  const formatPercentage = (value) => {
    return `${(value || 0).toFixed(1)}%`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const financialSummary = financialData?.financial_summary || {};
  const valeReport = financialData?.vale_report || {};

  // Dados para gráficos
  const profitData = [
    { name: 'Receitas', value: financialSummary.total_income || 0, color: '#10B981' },
    { name: 'Despesas', value: financialSummary.total_expenses || 0, color: '#EF4444' },
    { name: 'Custos', value: financialSummary.total_costs || 0, color: '#F59E0B' }
  ];

  const valesByEmployee = Object.entries(valeReport.vales_by_employee || {}).map(([name, data]) => ({
    name,
    total: data.total,
    count: data.count
  }));

  const COLORS = ['#10B981', '#EF4444', '#F59E0B', '#3B82F6', '#8B5CF6'];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-white">💰 Dashboard Financeiro</h2>
          <p className="text-gray-400">Análise de custos, lucros e vales</p>
        </div>
        
        <div className="flex space-x-2">
          {['month', 'week', 'day'].map((period) => (
            <Button
              key={period}
              variant={selectedPeriod === period ? "default" : "outline"}
              onClick={() => setSelectedPeriod(period)}
              className="capitalize"
            >
              {period === 'month' ? 'Mensal' : period === 'week' ? 'Semanal' : 'Diário'}
            </Button>
          ))}
        </div>
      </div>

      {/* Cards de Resumo Financeiro */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="bg-gray-800 border-gray-700">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-300">Receita Total</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">
              {formatCurrency(financialSummary.total_income)}
            </div>
            <p className="text-xs text-gray-400">
              {financialSummary.period || 'Período atual'}
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gray-800 border-gray-700">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-300">Despesas</CardTitle>
            <TrendingDown className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">
              {formatCurrency(financialSummary.total_expenses)}
            </div>
            <p className="text-xs text-gray-400">
              Gastos operacionais
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gray-800 border-gray-700">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-300">Lucro Líquido</CardTitle>
            <Target className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">
              {formatCurrency(financialSummary.net_profit)}
            </div>
            <p className="text-xs text-gray-400">
              Margem: {formatPercentage(financialSummary.profit_margin)}
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gray-800 border-gray-700">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-300">Total Vales</CardTitle>
            <Receipt className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">
              {formatCurrency(valeReport.total_vales)}
            </div>
            <p className="text-xs text-gray-400">
              {valeReport.total_count || 0} vales emitidos
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Gráficos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Gráfico de Distribuição Financeira */}
        <Card className="bg-gray-800 border-gray-700">
          <CardHeader>
            <CardTitle className="text-white">Distribuição Financeira</CardTitle>
            <CardDescription className="text-gray-400">
              Receitas vs Despesas vs Custos
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <RechartsPieChart>
                <Pie
                  data={profitData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {profitData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip 
                  formatter={(value) => [formatCurrency(value), '']}
                  contentStyle={{ 
                    backgroundColor: '#1F2937', 
                    border: '1px solid #374151',
                    borderRadius: '8px'
                  }}
                  labelStyle={{ color: '#F3F4F6' }}
                />
              </RechartsPieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Gráfico de Vales por Funcionário */}
        <Card className="bg-gray-800 border-gray-700">
          <CardHeader>
            <CardTitle className="text-white">Vales por Funcionário</CardTitle>
            <CardDescription className="text-gray-400">
              Distribuição de vales emitidos
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={valesByEmployee}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis dataKey="name" stroke="#9CA3AF" />
                <YAxis stroke="#9CA3AF" />
                <Tooltip 
                  formatter={(value, name) => [
                    name === 'total' ? formatCurrency(value) : value,
                    name === 'total' ? 'Total' : 'Quantidade'
                  ]}
                  contentStyle={{ 
                    backgroundColor: '#1F2937', 
                    border: '1px solid #374151',
                    borderRadius: '8px'
                  }}
                  labelStyle={{ color: '#F3F4F6' }}
                />
                <Bar dataKey="total" fill="#8B5CF6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Detalhes dos Vales */}
      <Card className="bg-gray-800 border-gray-700">
        <CardHeader>
          <CardTitle className="text-white">📋 Relatório Detalhado de Vales</CardTitle>
          <CardDescription className="text-gray-400">
            Vales emitidos por funcionário no período
          </CardDescription>
        </CardHeader>
        <CardContent>
          {Object.keys(valeReport.vales_by_employee || {}).length > 0 ? (
            <div className="space-y-4">
              {Object.entries(valeReport.vales_by_employee || {}).map(([employeeName, employeeData]) => (
                <div key={employeeName} className="p-4 bg-gray-700 rounded-lg">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-3">
                      <Users className="h-5 w-5 text-blue-400" />
                      <h4 className="font-semibold text-white">{employeeName}</h4>
                    </div>
                    <div className="flex space-x-4">
                      <Badge className="bg-purple-600 text-white">
                        {employeeData.count} vales
                      </Badge>
                      <Badge className="bg-green-600 text-white">
                        {formatCurrency(employeeData.total)}
                      </Badge>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    {employeeData.vales?.slice(0, 3).map((vale, index) => (
                      <div key={index} className="flex items-center justify-between text-sm">
                        <span className="text-gray-300">
                          {new Date(vale.date).toLocaleDateString('pt-BR')}
                        </span>
                        <span className="text-white font-medium">
                          {formatCurrency(vale.amount)}
                        </span>
                      </div>
                    ))}
                    {employeeData.vales?.length > 3 && (
                      <div className="text-xs text-gray-400 text-center">
                        ... e mais {employeeData.vales.length - 3} vales
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <AlertCircle className="h-12 w-12 text-gray-500 mx-auto mb-4" />
              <p className="text-gray-400">Nenhum vale encontrado no período selecionado</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Comandos Rápidos */}
      <Card className="bg-gray-800 border-gray-700">
        <CardHeader>
          <CardTitle className="text-white">Comandos Rápidos Financeiros</CardTitle>
          <CardDescription className="text-gray-400">
            Use estes comandos no chat da Lua para análises rápidas
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="p-4 bg-gray-700 rounded-lg">
              <h4 className="font-semibold text-white mb-2">💰 Financeiro</h4>
              <div className="space-y-1 text-sm text-gray-300">
                <div>"mostra resumo financeiro"</div>
                <div>"calcula lucro mensal"</div>
                <div>"analisa margem de lucro"</div>
              </div>
            </div>
            
            <div className="p-4 bg-gray-700 rounded-lg">
              <h4 className="font-semibold text-white mb-2">📋 Vales</h4>
              <div className="space-y-1 text-sm text-gray-300">
                <div>"relatório de vales mensal"</div>
                <div>"vales por funcionário"</div>
                <div>"adiciona vale para [nome]"</div>
              </div>
            </div>
            
            <div className="p-4 bg-gray-700 rounded-lg">
              <h4 className="font-semibold text-white mb-2">📊 Análises</h4>
              <div className="space-y-1 text-sm text-gray-300">
                <div>"compara receitas e despesas"</div>
                <div>"mostra tendência financeira"</div>
                <div>"analisa custos operacionais"</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default FinanceDashboard;


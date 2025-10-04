import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Alert, AlertDescription } from './ui/alert';
import { 
  Zap, 
  TrendingUp, 
  TrendingDown, 
  Calendar, 
  DollarSign, 
  Activity,
  Upload,
  AlertTriangle,
  Info
} from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';

const EnergyDashboard = () => {
  const [energyData, setEnergyData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [uploadFile, setUploadFile] = useState(null);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    fetchEnergyData();
  }, []);

  const fetchEnergyData = async () => {
    try {
      const response = await fetch('/api/lua/dashboard/energy');
      const data = await response.json();
      
      if (data.status === 'success') {
        setEnergyData(data.data);
      }
    } catch (error) {
      console.error('Erro ao buscar dados de energia:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async () => {
    if (!uploadFile) return;

    setUploading(true);
    const formData = new FormData();
    formData.append('file', uploadFile);

    try {
      const response = await fetch('/api/lua/energy/upload', {
        method: 'POST',
        body: formData
      });

      const result = await response.json();
      
      if (result.status === 'success') {
        alert('✅ Arquivo de energia processado com sucesso!');
        fetchEnergyData(); // Recarregar dados
        setUploadFile(null);
      } else {
        alert(`❌ Erro: ${result.message}`);
      }
    } catch (error) {
      alert('❌ Erro ao fazer upload do arquivo');
    } finally {
      setUploading(false);
    }
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value || 0);
  };

  const formatKwh = (value) => {
    return `${(value || 0).toFixed(1)} kWh`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const metrics = energyData?.metrics || {};
  const history = energyData?.history || [];
  const alerts = energyData?.alerts || [];

  // Preparar dados para gráficos
  const chartData = history.map((item, index) => ({
    month: `Mês ${index + 1}`,
    consumption: item.consumption_kwh || 0,
    cost: item.cost_total || 0,
    costPerKwh: item.cost_per_kwh || 0
  }));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-white">⚡ Dashboard de Energia</h2>
          <p className="text-gray-400">Monitoramento e análise do consumo energético</p>
        </div>
        
        {/* Upload de Arquivo */}
        <div className="flex items-center space-x-4">
          <input
            type="file"
            accept=".pdf,.csv,.xlsx,.xls"
            onChange={(e) => setUploadFile(e.target.files[0])}
            className="hidden"
            id="energy-file-upload"
          />
          <label htmlFor="energy-file-upload">
            <Button variant="outline" className="cursor-pointer">
              <Upload className="mr-2 h-4 w-4" />
              Selecionar Arquivo
            </Button>
          </label>
          {uploadFile && (
            <Button 
              onClick={handleFileUpload} 
              disabled={uploading}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {uploading ? 'Processando...' : 'Processar Conta'}
            </Button>
          )}
        </div>
      </div>

      {/* Alertas */}
      {alerts.length > 0 && (
        <div className="space-y-2">
          {alerts.map((alert, index) => (
            <Alert key={index} className={`border-l-4 ${
              alert.type === 'warning' ? 'border-yellow-500 bg-yellow-50' : 'border-blue-500 bg-blue-50'
            }`}>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription className="text-gray-800">
                <strong>{alert.title}:</strong> {alert.message}
              </AlertDescription>
            </Alert>
          ))}
        </div>
      )}

      {/* Cards de Métricas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="bg-gray-800 border-gray-700">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-300">Consumo Mensal</CardTitle>
            <Zap className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">
              {formatKwh(metrics.consumption_kwh)}
            </div>
            <p className="text-xs text-gray-400">
              Período atual
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gray-800 border-gray-700">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-300">Custo Total</CardTitle>
            <DollarSign className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">
              {formatCurrency(metrics.cost_total)}
            </div>
            <p className="text-xs text-gray-400">
              Valor da conta
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gray-800 border-gray-700">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-300">Custo por kWh</CardTitle>
            <Activity className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">
              {formatCurrency(metrics.cost_per_kwh)}
            </div>
            <p className="text-xs text-gray-400">
              Tarifa média
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gray-800 border-gray-700">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-300">Histórico</CardTitle>
            <Calendar className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">
              {history.length}
            </div>
            <p className="text-xs text-gray-400">
              Meses registrados
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Gráficos */}
      {chartData.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Gráfico de Consumo */}
          <Card className="bg-gray-800 border-gray-700">
            <CardHeader>
              <CardTitle className="text-white">Histórico de Consumo</CardTitle>
              <CardDescription className="text-gray-400">
                Consumo em kWh por período
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis dataKey="month" stroke="#9CA3AF" />
                  <YAxis stroke="#9CA3AF" />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: '#1F2937', 
                      border: '1px solid #374151',
                      borderRadius: '8px'
                    }}
                    labelStyle={{ color: '#F3F4F6' }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="consumption" 
                    stroke="#EAB308" 
                    strokeWidth={2}
                    dot={{ fill: '#EAB308', strokeWidth: 2, r: 4 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Gráfico de Custos */}
          <Card className="bg-gray-800 border-gray-700">
            <CardHeader>
              <CardTitle className="text-white">Histórico de Custos</CardTitle>
              <CardDescription className="text-gray-400">
                Valor das contas por período
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis dataKey="month" stroke="#9CA3AF" />
                  <YAxis stroke="#9CA3AF" />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: '#1F2937', 
                      border: '1px solid #374151',
                      borderRadius: '8px'
                    }}
                    labelStyle={{ color: '#F3F4F6' }}
                    formatter={(value) => [formatCurrency(value), 'Custo']}
                  />
                  <Bar dataKey="cost" fill="#10B981" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Comandos Rápidos */}
      <Card className="bg-gray-800 border-gray-700">
        <CardHeader>
          <CardTitle className="text-white">Comandos Rápidos de Energia</CardTitle>
          <CardDescription className="text-gray-400">
            Use estes comandos no chat da Lua para análises rápidas
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="p-4 bg-gray-700 rounded-lg">
              <h4 className="font-semibold text-white mb-2">📊 Análises</h4>
              <div className="space-y-1 text-sm text-gray-300">
                <div>"calcula energia mensal"</div>
                <div>"calcula energia semanal"</div>
                <div>"calcula energia diária"</div>
              </div>
            </div>
            
            <div className="p-4 bg-gray-700 rounded-lg">
              <h4 className="font-semibold text-white mb-2">📈 Histórico</h4>
              <div className="space-y-1 text-sm text-gray-300">
                <div>"histórico energia"</div>
                <div>"mostra consumo anterior"</div>
                <div>"compara energia"</div>
              </div>
            </div>
            
            <div className="p-4 bg-gray-700 rounded-lg">
              <h4 className="font-semibold text-white mb-2">🚨 Alertas</h4>
              <div className="space-y-1 text-sm text-gray-300">
                <div>"alertas energia"</div>
                <div>"verifica aumento consumo"</div>
                <div>"analisa eficiência"</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Informações de Upload */}
      {!energyData?.metrics?.consumption_kwh && (
        <Card className="bg-blue-900 border-blue-700">
          <CardHeader>
            <CardTitle className="text-white flex items-center">
              <Info className="mr-2 h-5 w-5" />
              Como Começar
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-blue-100 space-y-2">
              <p>Para começar a usar o dashboard de energia:</p>
              <ol className="list-decimal list-inside space-y-1 ml-4">
                <li>Faça upload da sua conta de energia (PDF, CSV ou XLSX)</li>
                <li>A Lua processará automaticamente os dados</li>
                <li>Visualize gráficos e métricas de consumo</li>
                <li>Receba alertas sobre variações no consumo</li>
              </ol>
              <p className="mt-4 text-sm">
                <strong>Formatos suportados:</strong> PDF (contas digitais), CSV/XLSX (dados estruturados)
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default EnergyDashboard;


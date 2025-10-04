import React, { useState, useEffect } from 'react';
import { Printer, Settings, CheckCircle, AlertCircle, TestTube } from 'lucide-react';
import { Button } from '@/components/ui/button.jsx';
import { Input } from '@/components/ui/input.jsx';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card.jsx';
import { Badge } from '@/components/ui/badge.jsx';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select.jsx';

const PrinterConfig = () => {
  const [printerConfig, setPrinterConfig] = useState({
    name: 'Impressora Padrão',
    type: 'usb',
    ip: '',
    port: '9100',
    status: 'disconnected'
  });
  const [testResult, setTestResult] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    // Carregar configuração salva
    const savedConfig = localStorage.getItem('printer_config');
    if (savedConfig) {
      setPrinterConfig(JSON.parse(savedConfig));
    }
  }, []);

  const saveConfig = () => {
    localStorage.setItem('printer_config', JSON.stringify(printerConfig));
    setTestResult({
      status: 'success',
      message: 'Configuração salva com sucesso!'
    });
  };

  const testPrinter = async () => {
    setIsLoading(true);
    setTestResult(null);

    try {
      // Simular teste de impressora
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Simular resultado do teste
      const success = Math.random() > 0.3; // 70% de chance de sucesso
      
      if (success) {
        setTestResult({
          status: 'success',
          message: 'Impressora conectada e funcionando corretamente!'
        });
        setPrinterConfig(prev => ({ ...prev, status: 'connected' }));
      } else {
        setTestResult({
          status: 'error',
          message: 'Falha na conexão com a impressora. Verifique as configurações.'
        });
        setPrinterConfig(prev => ({ ...prev, status: 'error' }));
      }
    } catch (error) {
      setTestResult({
        status: 'error',
        message: 'Erro ao testar impressora: ' + error.message
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusBadge = () => {
    switch (printerConfig.status) {
      case 'connected':
        return <Badge className="bg-green-600 text-white">Conectada</Badge>;
      case 'error':
        return <Badge className="bg-red-600 text-white">Erro</Badge>;
      default:
        return <Badge className="bg-gray-600 text-white">Desconectada</Badge>;
    }
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Printer className="h-5 w-5" />
          Configuração de Impressora
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Status da Impressora */}
        <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
          <div className="flex items-center gap-3">
            <Printer className="h-6 w-6 text-gray-600" />
            <div>
              <p className="font-medium">{printerConfig.name}</p>
              <p className="text-sm text-gray-500">
                {printerConfig.type === 'usb' ? 'Conexão USB' : `Rede: ${printerConfig.ip}:${printerConfig.port}`}
              </p>
            </div>
          </div>
          {getStatusBadge()}
        </div>

        {/* Configurações */}
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Nome da Impressora</label>
            <Input
              value={printerConfig.name}
              onChange={(e) => setPrinterConfig(prev => ({ ...prev, name: e.target.value }))}
              placeholder="Nome da impressora"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Tipo de Conexão</label>
            <Select
              value={printerConfig.type}
              onValueChange={(value) => setPrinterConfig(prev => ({ ...prev, type: value }))}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="usb">USB</SelectItem>
                <SelectItem value="network">Rede</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {printerConfig.type === 'network' && (
            <>
              <div>
                <label className="block text-sm font-medium mb-2">Endereço IP</label>
                <Input
                  value={printerConfig.ip}
                  onChange={(e) => setPrinterConfig(prev => ({ ...prev, ip: e.target.value }))}
                  placeholder="192.168.1.100"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Porta</label>
                <Input
                  value={printerConfig.port}
                  onChange={(e) => setPrinterConfig(prev => ({ ...prev, port: e.target.value }))}
                  placeholder="9100"
                />
              </div>
            </>
          )}
        </div>

        {/* Resultado do Teste */}
        {testResult && (
          <div className={`p-4 rounded-lg flex items-center gap-3 ${
            testResult.status === 'success' ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'
          }`}>
            {testResult.status === 'success' ? (
              <CheckCircle className="h-5 w-5" />
            ) : (
              <AlertCircle className="h-5 w-5" />
            )}
            <p>{testResult.message}</p>
          </div>
        )}

        {/* Botões */}
        <div className="flex gap-3">
          <Button onClick={testPrinter} disabled={isLoading} className="flex items-center gap-2">
            <TestTube className="h-4 w-4" />
            {isLoading ? 'Testando...' : 'Testar Impressora'}
          </Button>
          
          <Button onClick={saveConfig} variant="outline" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            Salvar Configuração
          </Button>
        </div>

        {/* Informações Adicionais */}
        <div className="text-sm text-gray-600 space-y-2">
          <p><strong>Dica:</strong> Para impressoras USB, certifique-se de que estão conectadas e instaladas no sistema.</p>
          <p><strong>Rede:</strong> Para impressoras de rede, use o endereço IP e porta corretos (geralmente 9100).</p>
          <p><strong>Vales:</strong> Os comprovantes de vales serão enviados automaticamente para esta impressora.</p>
        </div>
      </CardContent>
    </Card>
  );
};

export default PrinterConfig;


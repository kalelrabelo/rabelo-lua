import React, { useState, useEffect } from 'react';
import { Receipt, User, Calendar, DollarSign, Printer, CheckCircle, XCircle, Clock } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card.jsx';
import { Badge } from '@/components/ui/badge.jsx';
import { Button } from '@/components/ui/button.jsx';

const ValeHistory = () => {
  const [vales, setVales] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadValeHistory();
  }, []);

  const loadValeHistory = async () => {
    try {
      // Simular carregamento de histórico de vales
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Dados simulados de vales
      const mockVales = [
        {
          id: 1,
          employee: 'João Silva',
          amount: 500.00,
          date: '2025-08-18',
          time: '14:30',
          printStatus: 'printed',
          pdfPath: '/tmp/vales_impressos/vale_joao_silva_20250818_143000.pdf'
        },
        {
          id: 2,
          employee: 'Maria Santos',
          amount: 300.00,
          date: '2025-08-18',
          time: '10:15',
          printStatus: 'printed',
          pdfPath: '/tmp/vales_impressos/vale_maria_santos_20250818_101500.pdf'
        },
        {
          id: 3,
          employee: 'Pedro Costa',
          amount: 250.00,
          date: '2025-08-17',
          time: '16:45',
          printStatus: 'error',
          pdfPath: '/tmp/vales_impressos/vale_pedro_costa_20250817_164500.pdf'
        },
        {
          id: 4,
          employee: 'Ana Oliveira',
          amount: 400.00,
          date: '2025-08-17',
          time: '09:20',
          printStatus: 'pending',
          pdfPath: '/tmp/vales_impressos/vale_ana_oliveira_20250817_092000.pdf'
        }
      ];
      
      setVales(mockVales);
    } catch (error) {
      console.error('Erro ao carregar histórico de vales:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getPrintStatusBadge = (status) => {
    switch (status) {
      case 'printed':
        return <Badge className="bg-green-600 text-white flex items-center gap-1">
          <CheckCircle className="h-3 w-3" />
          Impresso
        </Badge>;
      case 'error':
        return <Badge className="bg-red-600 text-white flex items-center gap-1">
          <XCircle className="h-3 w-3" />
          Erro
        </Badge>;
      case 'pending':
        return <Badge className="bg-yellow-600 text-white flex items-center gap-1">
          <Clock className="h-3 w-3" />
          Pendente
        </Badge>;
      default:
        return <Badge className="bg-gray-600 text-white">Desconhecido</Badge>;
    }
  };

  const retryPrint = async (vale) => {
    try {
      // Simular reimpressão
      console.log(`Reimprimindo vale ${vale.id} para ${vale.employee}`);
      
      // Atualizar status
      setVales(prev => prev.map(v => 
        v.id === vale.id ? { ...v, printStatus: 'printed' } : v
      ));
    } catch (error) {
      console.error('Erro ao reimprimir vale:', error);
    }
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('pt-BR');
  };

  if (isLoading) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Receipt className="h-5 w-5" />
            Histórico de Vales
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <span className="ml-2">Carregando histórico...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Receipt className="h-5 w-5" />
          Histórico de Vales Emitidos
        </CardTitle>
        <p className="text-sm text-gray-600">
          {vales.length} vales registrados
        </p>
      </CardHeader>
      <CardContent>
        {vales.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <Receipt className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>Nenhum vale encontrado</p>
          </div>
        ) : (
          <div className="space-y-4">
            {vales.map((vale) => (
              <div
                key={vale.id}
                className="border rounded-lg p-4 hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="bg-blue-100 p-2 rounded-lg">
                      <User className="h-5 w-5 text-blue-600" />
                    </div>
                    
                    <div>
                      <h3 className="font-medium">{vale.employee}</h3>
                      <div className="flex items-center gap-4 text-sm text-gray-600 mt-1">
                        <div className="flex items-center gap-1">
                          <DollarSign className="h-4 w-4" />
                          {formatCurrency(vale.amount)}
                        </div>
                        <div className="flex items-center gap-1">
                          <Calendar className="h-4 w-4" />
                          {formatDate(vale.date)} às {vale.time}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    {getPrintStatusBadge(vale.printStatus)}
                    
                    {vale.printStatus === 'error' && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => retryPrint(vale)}
                        className="flex items-center gap-1"
                      >
                        <Printer className="h-4 w-4" />
                        Reimprimir
                      </Button>
                    )}
                  </div>
                </div>

                {vale.pdfPath && (
                  <div className="mt-3 pt-3 border-t text-xs text-gray-500">
                    <div className="flex items-center gap-1">
                      <Receipt className="h-3 w-3" />
                      PDF: {vale.pdfPath.split('/').pop()}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Resumo */}
        {vales.length > 0 && (
          <div className="mt-6 pt-4 border-t">
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <p className="text-2xl font-bold text-green-600">
                  {vales.filter(v => v.printStatus === 'printed').length}
                </p>
                <p className="text-sm text-gray-600">Impressos</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-yellow-600">
                  {vales.filter(v => v.printStatus === 'pending').length}
                </p>
                <p className="text-sm text-gray-600">Pendentes</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-red-600">
                  {vales.filter(v => v.printStatus === 'error').length}
                </p>
                <p className="text-sm text-gray-600">Com Erro</p>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ValeHistory;


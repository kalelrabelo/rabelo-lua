import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog.jsx';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table.jsx';

const SalesModal = ({ isOpen, onClose, salesData }) => {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[800px] bg-gray-900 text-white border-gray-700">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-blue-400">📊 Relatório de Vendas</DialogTitle>
          <DialogDescription className="text-gray-400">
            Aqui estão os detalhes das vendas registradas no sistema.
          </DialogDescription>
        </DialogHeader>
        <div className="mt-4 max-h-[400px] overflow-y-auto">
          {salesData && salesData.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-800 hover:bg-gray-700">
                  <TableHead className="w-[100px] text-blue-300">ID</TableHead>
                  <TableHead className="text-blue-300">Cliente</TableHead>
                  <TableHead className="text-blue-300">Total</TableHead>
                  <TableHead className="text-blue-300">Status</TableHead>
                  <TableHead className="text-blue-300">Data</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {salesData.map((sale) => (
                  <TableRow key={sale.id} className="hover:bg-gray-700">
                    <TableCell className="font-medium text-gray-300">{sale.id}</TableCell>
                    <TableCell className="text-gray-300">{sale.customer_name}</TableCell>
                    <TableCell className="text-green-400">R$ {sale.total_price ? sale.total_price.toFixed(2) : '0.00'}</TableCell>
                    <TableCell className="text-gray-300">{sale.status}</TableCell>
                    <TableCell className="text-gray-300">{sale.order_date}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <p className="text-center text-gray-400">Nenhuma venda encontrada para exibir.</p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default SalesModal;



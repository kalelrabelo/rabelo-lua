import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';

const InventoryModal = ({ isOpen, onClose, data }) => {
  if (!data) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[800px] bg-gray-900 text-white border-gray-700">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-blue-400">Detalhes do Inventário</DialogTitle>
          <DialogDescription className="text-gray-400">
            Informações detalhadas sobre os itens do seu estoque.
          </DialogDescription>
        </DialogHeader>
        <div className="py-4">
          {data.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow className="border-gray-700">
                  <TableHead className="text-blue-300">Material</TableHead>
                  <TableHead className="text-blue-300">Quantidade Disponível</TableHead>
                  <TableHead className="text-blue-300">Unidade</TableHead>
                  <TableHead className="text-blue-300">Estoque Mínimo</TableHead>
                  <TableHead className="text-blue-300">Custo por Unidade</TableHead>
                  <TableHead className="text-blue-300">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.map((item) => (
                  <TableRow key={item.id} className="border-gray-800 hover:bg-gray-800">
                    <TableCell className="font-medium text-gray-200">{item.material_name}</TableCell>
                    <TableCell className="text-gray-300">{item.quantity_available}</TableCell>
                    <TableCell className="text-gray-300">{item.unit}</TableCell>
                    <TableCell className="text-gray-300">{item.minimum_stock}</TableCell>
                    <TableCell className="text-gray-300">R$ {item.cost_per_unit ? item.cost_per_unit.toFixed(2) : '0.00'}</TableCell>
                    <TableCell>
                      <Badge className={`${item.is_low_stock ? 'bg-red-600' : 'bg-green-600'} text-white`}>
                        {item.is_low_stock ? 'Baixo Estoque' : 'Em Estoque'}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <p className="text-center text-gray-400">Nenhum item de inventário encontrado.</p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default InventoryModal;



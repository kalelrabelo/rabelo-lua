import React, { useState, useEffect } from 'react';
import axios from 'axios';
import apiService from '../services/api';
import { Input } from '@/components/ui/input.jsx';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card.jsx';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table.jsx';

function JoiasMateriaisPedrasRel() {
  const [jewelry, setJewelry] = useState([]);
  const [materials, setMaterials] = useState([]);
  const [stones, setStones] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [jewelryRes, materialsRes, stonesRes] = await Promise.all([
          apiService.getProducts(),
          apiService.getMaterials(),
          apiService.getStones()
        ]);
        setJewelry(Array.isArray(jewelryRes.data) ? jewelryRes.data : []);
        setMaterials(Array.isArray(materialsRes.data?.materials) ? materialsRes.data.materials : Array.isArray(materialsRes.data) ? materialsRes.data : []);
        setStones(Array.isArray(stonesRes.data?.stones) ? stonesRes.data.stones : Array.isArray(stonesRes.data) ? stonesRes.data : []);
      } catch (err) {
        setError('Erro ao carregar dados: ' + err.message);
        console.error('Erro ao carregar dados para relatórios:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const filteredJewelry = Array.isArray(jewelry) ? jewelry.filter(item =>
    (item.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (item.code || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (item.category || '').toLowerCase().includes(searchTerm.toLowerCase())
  ) : [];

  const filteredMaterials = Array.isArray(materials) ? materials.filter(item =>
    (item.name || item.nome || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (item.description || item.noticia || '').toLowerCase().includes(searchTerm.toLowerCase())
  ) : [];

  const filteredStones = Array.isArray(stones) ? stones.filter(item =>
    (item.name || item.nome || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (item.description || item.noticia || '').toLowerCase().includes(searchTerm.toLowerCase())
  ) : [];

  if (loading) {
    return <div className="text-gray-300 p-6">Carregando relatórios...</div>;
  }

  if (error) {
    return <div className="text-red-500 p-6">Erro: {error}</div>;
  }

  return (
    <div className="p-6 bg-gray-900 min-h-screen text-gray-100">
      <h1 className="text-3xl font-bold mb-6">Relatórios de Joias, Materiais e Pedras</h1>

      <div className="mb-6">
        <Input
          type="text"
          placeholder="Pesquisar em joias, materiais ou pedras..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full bg-gray-800 border-gray-700 text-gray-100 placeholder-gray-400"
        />
      </div>

      <Card className="mb-6 bg-gray-800 border-gray-700">
        <CardHeader>
          <CardTitle className="text-white">Joias</CardTitle>
        </CardHeader>
        <CardContent>
          {filteredJewelry.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow className="border-gray-700">
                  <TableHead className="text-gray-400">Nome</TableHead>
                  <TableHead className="text-gray-400">Código</TableHead>
                  <TableHead className="text-gray-400">Categoria</TableHead>
                  <TableHead className="text-gray-400">Preço</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredJewelry.map((item) => (
                  <TableRow key={item.id} className="border-gray-700">
                    <TableCell className="font-medium text-white">{item.name}</TableCell>
                    <TableCell className="text-gray-300">{item.code}</TableCell>
                    <TableCell className="text-gray-300">{item.category}</TableCell>
                    <TableCell className="text-gray-300">R$ {item.price ? item.price.toFixed(2) : 'N/A'}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <p className="text-gray-400">Nenhuma joia encontrada.</p>
          )}
        </CardContent>
      </Card>

      <Card className="mb-6 bg-gray-800 border-gray-700">
        <CardHeader>
          <CardTitle className="text-white">Materiais</CardTitle>
        </CardHeader>
        <CardContent>
          {filteredMaterials.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow className="border-gray-700">
                  <TableHead className="text-gray-400">Nome</TableHead>
                  <TableHead className="text-gray-400">Descrição</TableHead>
                  <TableHead className="text-gray-400">Quantidade</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredMaterials.map((item) => (
                  <TableRow key={item.id} className="border-gray-700">
                    <TableCell className="font-medium text-white">{item.name}</TableCell>
                    <TableCell className="text-gray-300">{item.description}</TableCell>
                    <TableCell className="text-gray-300">{item.quantity} {item.unit}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <p className="text-gray-400">Nenhum material encontrado.</p>
          )}
        </CardContent>
      </Card>

      <Card className="bg-gray-800 border-gray-700">
        <CardHeader>
          <CardTitle className="text-white">Pedras</CardTitle>
        </CardHeader>
        <CardContent>
          {filteredStones.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow className="border-gray-700">
                  <TableHead className="text-gray-400">Nome</TableHead>
                  <TableHead className="text-gray-400">Descrição</TableHead>
                  <TableHead className="text-gray-400">Cor</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredStones.map((item) => (
                  <TableRow key={item.id} className="border-gray-700">
                    <TableCell className="font-medium text-white">{item.name}</TableCell>
                    <TableCell className="text-gray-300">{item.description}</TableCell>
                    <TableCell className="text-gray-300">{item.color}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <p className="text-gray-400">Nenhuma pedra encontrada.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default JoiasMateriaisPedrasRel;


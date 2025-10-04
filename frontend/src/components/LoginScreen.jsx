import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card.jsx';
import { Input } from '@/components/ui/input.jsx';
import { Button } from '@/components/ui/button.jsx';

function LoginScreen({ onLogin }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleLogin = () => {
    if (username === 'rabelo' && password === 'rabeloce') {
      onLogin();
    } else {
      setError('Usuário ou senha incorretos.');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-black">
      <Card className="w-full max-w-md bg-gray-900 border-gray-700 text-white">
        <CardHeader className="text-center">
          <img src="/images/logo.png" alt="Logo Antônio Rabelo" className="mx-auto h-24 w-24 mb-4" />
          <CardTitle className="text-3xl font-bold">Login</CardTitle>
          <CardDescription className="text-gray-400">Acesse o sistema de gestão de joias</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label htmlFor="username" className="block text-sm font-medium text-gray-300">Usuário</label>
            <Input
              id="username"
              type="text"
              placeholder="rabelo"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="mt-1 block w-full bg-gray-800 border-gray-600 text-white placeholder-gray-500"
            />
          </div>
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-300">Senha</label>
            <Input
              id="password"
              type="password"
              placeholder="rabeloce"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1 block w-full bg-gray-800 border-gray-600 text-white placeholder-gray-500"
            />
          </div>
          {error && <p className="text-red-500 text-sm text-center">{error}</p>}
          <Button onClick={handleLogin} className="w-full bg-blue-600 hover:bg-blue-700 text-white">
            Entrar
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

export default LoginScreen;


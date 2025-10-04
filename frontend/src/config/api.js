// Configuração da API
export const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

// Helper para construir URLs da API
export const apiUrl = (path) => {
  const cleanPath = path.startsWith('/') ? path : '/' + path;
  return `${API_URL}${cleanPath}`;
};

export default API_URL;
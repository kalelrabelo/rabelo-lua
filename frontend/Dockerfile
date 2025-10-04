# Frontend - React + Vite
FROM node:20-alpine

# Instalar curl para healthcheck
RUN apk add --no-cache curl

WORKDIR /app

# Copiar arquivos de dependências
COPY package*.json ./

# Limpar cache e instalar dependências
RUN npm cache clean --force && \
    npm install --legacy-peer-deps

# Copiar código da aplicação
COPY . .

# Criar diretório de build
RUN mkdir -p /app/dist

# Variáveis de ambiente
ENV VITE_API_URL=http://backend:5000
ENV VITE_KOKORO_URL=http://kokoro:8000
ENV VITE_OLLAMA_URL=http://ollama:11434
ENV VITE_WEBUI_URL=http://webui:8080

EXPOSE 5173

HEALTHCHECK --interval=30s --timeout=10s --start-period=90s --retries=5 \
  CMD curl -f http://localhost:5173 || exit 1

# Comando para desenvolvimento
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"]
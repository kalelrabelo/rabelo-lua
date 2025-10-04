# Backend - FastAPI com isolamento de dependências
FROM python:3.11-slim

# Instalar uv para gerenciamento rápido de dependências
RUN pip install --no-cache-dir uv

# Criar diretório de trabalho
WORKDIR /app

# Copiar arquivos de requisitos
COPY requirements.txt .

# Instalar dependências com uv (mais rápido que pip)
RUN uv pip install --system --no-cache -r requirements.txt

# Copiar código da aplicação
COPY . .

# Criar diretório de dados
RUN mkdir -p /app/data

# Expor porta
EXPOSE 5000

# Health check endpoint
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=5 \
  CMD curl -f http://localhost:5000/health || exit 1

# Comando padrão
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "5000", "--reload"]
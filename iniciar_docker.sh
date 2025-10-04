#!/bin/bash

# Script de Inicialização do Sistema LUA com Docker
# Sistema de IA Conversacional e Multimodal

set -e  # Sair em caso de erro

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Função para imprimir com cores
print_msg() {
    echo -e "${2}${1}${NC}"
}

# Banner
clear
print_msg "========================================" "$BLUE"
print_msg "    Sistema LUA - IA Conversacional    " "$BLUE"
print_msg "========================================" "$BLUE"
echo

# Verificar Docker
print_msg "🔍 Verificando Docker..." "$YELLOW"
if ! command -v docker &> /dev/null; then
    print_msg "❌ Docker não está instalado!" "$RED"
    exit 1
fi

if ! docker compose version &> /dev/null; then
    print_msg "❌ Docker Compose não está instalado!" "$RED"
    exit 1
fi

print_msg "✅ Docker e Docker Compose encontrados" "$GREEN"

# Criar diretórios necessários
print_msg "\n📁 Criando diretórios necessários..." "$YELLOW"
mkdir -p backend/data
mkdir -p kokoro/models
mkdir -p kokoro/output
mkdir -p kokoro/cache
mkdir -p webui/data
mkdir -p nginx/ssl
print_msg "✅ Diretórios criados" "$GREEN"

# Criar arquivo .env se não existir
if [ ! -f .env ]; then
    print_msg "\n📝 Criando arquivo .env..." "$YELLOW"
    cat > .env << EOF
# Configurações do Sistema LUA
NODE_ENV=development
JWT_SECRET_KEY=$(openssl rand -hex 32)
WEBUI_SECRET_KEY=$(openssl rand -hex 32)

# URLs dos Serviços
OLLAMA_API=http://ollama:11434
KOKORO_API=http://kokoro:8000
REDIS_URL=redis://redis:6379
BACKEND_API=http://backend:5000
WEBUI_URL=http://webui:8080

# Configurações Ollama
OLLAMA_MODELS=llama3.2:latest,mistral:latest

# Configurações TTS
TTS_MODEL=tts_models/ja/kokoro/tacotron2-DDC
TTS_LANGUAGE=pt-BR

# Database
DATABASE_URL=sqlite:///app/data/lua.db
EOF
    print_msg "✅ Arquivo .env criado" "$GREEN"
fi

# Parar containers antigos
print_msg "\n🛑 Parando containers antigos..." "$YELLOW"
docker compose down 2>/dev/null || true

# Limpar volumes antigos (opcional)
read -p "Deseja limpar volumes antigos? (y/N): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    print_msg "🗑️  Removendo volumes antigos..." "$YELLOW"
    docker volume prune -f
fi

# Build das imagens
print_msg "\n🔨 Construindo imagens Docker..." "$YELLOW"
docker compose build --no-cache

# Iniciar serviços
print_msg "\n🚀 Iniciando serviços..." "$YELLOW"
docker compose up -d

# Aguardar serviços ficarem prontos
print_msg "\n⏳ Aguardando serviços iniciarem..." "$YELLOW"

check_service() {
    local service=$1
    local url=$2
    local max_attempts=30
    local attempt=1
    
    while [ $attempt -le $max_attempts ]; do
        if curl -s -f "$url" > /dev/null 2>&1; then
            print_msg "✅ $service está pronto!" "$GREEN"
            return 0
        fi
        echo -n "."
        sleep 2
        attempt=$((attempt + 1))
    done
    
    print_msg "\n❌ $service não iniciou corretamente!" "$RED"
    return 1
}

echo
check_service "Redis" "http://localhost:6379" || true
check_service "Ollama" "http://localhost:11434/api/tags" || true
check_service "Kokoro TTS" "http://localhost:8000/api/voice/status" || true
check_service "Backend" "http://localhost:5000/health" || true
check_service "WebUI" "http://localhost:8080/health" || true
check_service "Frontend" "http://localhost:5173" || true
check_service "Nginx" "http://localhost/health" || true

# Baixar modelos do Ollama
print_msg "\n📦 Baixando modelos do Ollama..." "$YELLOW"
docker exec ollama ollama pull llama3.2:latest 2>/dev/null || true
docker exec ollama ollama pull mistral:latest 2>/dev/null || true

# Status dos containers
print_msg "\n📊 Status dos containers:" "$BLUE"
docker compose ps

# URLs de acesso
print_msg "\n🌐 URLs de Acesso:" "$GREEN"
print_msg "  Frontend:    http://localhost" "$YELLOW"
print_msg "  Backend API: http://localhost/api" "$YELLOW"
print_msg "  TTS API:     http://localhost/tts" "$YELLOW"
print_msg "  Ollama API:  http://localhost/ollama" "$YELLOW"
print_msg "  WebUI:       http://localhost/webui" "$YELLOW"
print_msg "  Health:      http://localhost/health" "$YELLOW"

# Logs
print_msg "\n📜 Para ver os logs use:" "$BLUE"
print_msg "  docker compose logs -f [serviço]" "$YELLOW"
print_msg "  Serviços: redis, ollama, kokoro, backend, frontend, webui, nginx" "$YELLOW"

print_msg "\n✅ Sistema LUA iniciado com sucesso!" "$GREEN"
print_msg "========================================" "$BLUE"
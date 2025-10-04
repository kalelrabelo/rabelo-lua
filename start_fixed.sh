#!/bin/bash

echo "======================================"
echo "🚀 Lua TTS System - Fixed Version"
echo "======================================"

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker não está rodando. Por favor, inicie o Docker Desktop."
    exit 1
fi

# Clean up any existing containers
echo "🧹 Limpando containers antigos..."
docker-compose down 2>/dev/null || true
docker rm -f lua-backend lua-redis 2>/dev/null || true

# Build the Docker image
echo "🔨 Construindo imagem Docker..."
docker build -t lua-tts-fixed -f Dockerfile .

if [ $? -ne 0 ]; then
    echo "❌ Erro ao construir imagem Docker"
    exit 1
fi

# Start services with docker-compose
echo "🚀 Iniciando serviços..."
docker-compose up -d

if [ $? -ne 0 ]; then
    echo "❌ Erro ao iniciar serviços"
    exit 1
fi

# Wait for services to be ready
echo "⏳ Aguardando serviços iniciarem..."
sleep 10

# Check health
echo "🔍 Verificando status dos serviços..."
docker ps | grep lua-

# Test the API
echo "🧪 Testando API..."
curl -s http://localhost:8000/health | python -m json.tool

echo ""
echo "======================================"
echo "✅ Sistema iniciado com sucesso!"
echo "======================================"
echo ""
echo "📍 Acesse:"
echo "   - Frontend: http://localhost:8000"
echo "   - API Docs: http://localhost:8000/docs"
echo "   - WebSocket: ws://localhost:8000/ws"
echo ""
echo "🎤 Para iniciar o modo conversa:"
echo '   Diga: "Lua, iniciar modo conversa"'
echo ""
echo "🛑 Para parar o sistema:"
echo "   ./parar_docker.sh"
echo ""
echo "📊 Para ver logs:"
echo "   docker-compose logs -f"
echo ""
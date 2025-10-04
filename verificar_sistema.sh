#!/bin/bash

# Script de Verificação de Saúde do Sistema LUA

set -e

# Cores
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

print_msg() {
    echo -e "${2}${1}${NC}"
}

check_service() {
    local name=$1
    local url=$2
    
    if curl -s -f "$url" > /dev/null 2>&1; then
        print_msg "✅ $name: OK" "$GREEN"
        return 0
    else
        print_msg "❌ $name: FALHOU" "$RED"
        return 1
    fi
}

clear
print_msg "========================================" "$BLUE"
print_msg "    Verificação de Saúde - Sistema LUA " "$BLUE"
print_msg "========================================" "$BLUE"
echo

# Verificar Docker
print_msg "🐳 Docker Status:" "$YELLOW"
if docker compose ps | grep -q "Up"; then
    print_msg "✅ Containers rodando" "$GREEN"
else
    print_msg "❌ Nenhum container rodando" "$RED"
    exit 1
fi

echo
print_msg "🔍 Verificando Serviços:" "$YELLOW"
echo

# Verificar cada serviço
check_service "Redis" "http://localhost:6379"
check_service "Ollama" "http://localhost:11434/api/tags"
check_service "Kokoro TTS" "http://localhost:8000/api/voice/status"
check_service "Backend API" "http://localhost:5000/health"
check_service "WebUI" "http://localhost:8080/health"
check_service "Frontend" "http://localhost:5173"
check_service "Nginx Proxy" "http://localhost/health"

echo
print_msg "📊 Status dos Containers:" "$YELLOW"
docker compose ps

echo
print_msg "💾 Uso de Disco (Volumes):" "$YELLOW"
docker system df -v | grep -A 10 "VOLUME NAME" | head -15

echo
print_msg "🔄 Últimas linhas de log:" "$YELLOW"
docker compose logs --tail=5

echo
print_msg "========================================" "$BLUE"
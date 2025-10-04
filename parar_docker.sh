#!/bin/bash

# Script para parar o Sistema LUA

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

clear
print_msg "========================================" "$BLUE"
print_msg "    Parando Sistema LUA                " "$BLUE"
print_msg "========================================" "$BLUE"
echo

print_msg "🛑 Parando todos os containers..." "$YELLOW"
docker compose down

print_msg "✅ Sistema parado com sucesso!" "$GREEN"

# Perguntar se deseja limpar volumes
read -p "Deseja limpar os volumes de dados? (y/N): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    print_msg "🗑️  Removendo volumes..." "$YELLOW"
    docker compose down -v
    print_msg "✅ Volumes removidos" "$GREEN"
fi

print_msg "\n📊 Status atual:" "$BLUE"
docker ps -a | grep lua_ || echo "Nenhum container LUA rodando"
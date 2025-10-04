#!/usr/bin/env python3
"""
Script de teste completo do Sistema LUA
Verifica todos os serviços e funcionalidades
"""

import requests
import json
import time
import sys
from colorama import Fore, Back, Style, init

# Inicializar colorama
init(autoreset=True)

# URLs dos serviços
SERVICES = {
    "Redis": "http://localhost:6379",
    "Ollama": "http://localhost:11434/api/tags",
    "Kokoro TTS": "http://localhost:8000/api/voice/status",
    "Backend API": "http://localhost:5000/health",
    "Frontend": "http://localhost:5173",
    "WebUI": "http://localhost:8080/health",
    "Nginx": "http://localhost/health"
}

# URLs via Nginx
NGINX_ENDPOINTS = {
    "API Health": "http://localhost/api/health",
    "TTS Status": "http://localhost/tts/api/voice/status",
    "Ollama Models": "http://localhost/ollama/api/tags",
    "WebUI Health": "http://localhost/webui/health"
}

def print_header():
    """Imprimir cabeçalho"""
    print(f"\n{Fore.CYAN}{'='*60}")
    print(f"{Fore.CYAN}    Sistema LUA - Teste Completo de Serviços")
    print(f"{Fore.CYAN}{'='*60}\n")

def test_service(name, url, timeout=5):
    """Testar um serviço"""
    try:
        response = requests.get(url, timeout=timeout)
        if response.status_code == 200:
            print(f"{Fore.GREEN}✅ {name}: OK")
            return True
        else:
            print(f"{Fore.YELLOW}⚠️  {name}: Status {response.status_code}")
            return False
    except requests.exceptions.ConnectionError:
        print(f"{Fore.RED}❌ {name}: Não conecta")
        return False
    except requests.exceptions.Timeout:
        print(f"{Fore.RED}❌ {name}: Timeout")
        return False
    except Exception as e:
        print(f"{Fore.RED}❌ {name}: Erro - {str(e)}")
        return False

def test_chat():
    """Testar funcionalidade de chat"""
    print(f"\n{Fore.YELLOW}🤖 Testando Chat com Ollama...")
    try:
        response = requests.post(
            "http://localhost/api/chat",
            json={
                "message": "Olá! Responda apenas: 'Sistema funcionando'",
                "model": "llama3.2:latest"
            },
            timeout=30
        )
        if response.status_code == 200:
            print(f"{Fore.GREEN}✅ Chat funcionando!")
            data = response.json()
            if 'response' in data:
                print(f"{Fore.CYAN}   Resposta: {data['response'][:100]}...")
            return True
        else:
            print(f"{Fore.RED}❌ Chat falhou: Status {response.status_code}")
            return False
    except Exception as e:
        print(f"{Fore.RED}❌ Erro no chat: {str(e)}")
        return False

def test_tts():
    """Testar síntese de voz"""
    print(f"\n{Fore.YELLOW}🎙️ Testando TTS...")
    try:
        response = requests.post(
            "http://localhost/tts/api/voice/synthesize",
            json={
                "text": "Sistema de voz funcionando perfeitamente",
                "language": "pt-BR"
            },
            timeout=20
        )
        if response.status_code == 200:
            print(f"{Fore.GREEN}✅ TTS funcionando!")
            data = response.json()
            if data.get('success'):
                print(f"{Fore.CYAN}   Áudio gerado: {data.get('audio_url')}")
            return True
        else:
            print(f"{Fore.RED}❌ TTS falhou: Status {response.status_code}")
            return False
    except Exception as e:
        print(f"{Fore.RED}❌ Erro no TTS: {str(e)}")
        return False

def main():
    """Função principal"""
    print_header()
    
    # Testar serviços diretos
    print(f"{Fore.CYAN}📡 Testando Serviços Diretos:")
    print(f"{Fore.CYAN}{'-'*40}")
    
    results = {}
    for name, url in SERVICES.items():
        results[name] = test_service(name, url)
        time.sleep(0.5)
    
    # Testar endpoints via Nginx
    print(f"\n{Fore.CYAN}🌐 Testando Endpoints via Nginx:")
    print(f"{Fore.CYAN}{'-'*40}")
    
    for name, url in NGINX_ENDPOINTS.items():
        results[f"Nginx/{name}"] = test_service(name, url)
        time.sleep(0.5)
    
    # Testes funcionais
    print(f"\n{Fore.CYAN}🔧 Testes Funcionais:")
    print(f"{Fore.CYAN}{'-'*40}")
    
    # Apenas testar se os serviços básicos estão OK
    if results.get("Backend API") and results.get("Ollama"):
        results["Chat"] = test_chat()
    else:
        print(f"{Fore.YELLOW}⚠️  Chat: Pulando (serviços não disponíveis)")
        results["Chat"] = False
    
    if results.get("Kokoro TTS"):
        results["TTS"] = test_tts()
    else:
        print(f"{Fore.YELLOW}⚠️  TTS: Pulando (Kokoro não disponível)")
        results["TTS"] = False
    
    # Resumo
    print(f"\n{Fore.CYAN}{'='*60}")
    print(f"{Fore.CYAN}📊 RESUMO DOS TESTES")
    print(f"{Fore.CYAN}{'='*60}")
    
    total = len(results)
    success = sum(1 for v in results.values() if v)
    failed = total - success
    
    print(f"\n{Fore.GREEN}✅ Sucessos: {success}/{total}")
    if failed > 0:
        print(f"{Fore.RED}❌ Falhas: {failed}/{total}")
        print(f"\n{Fore.YELLOW}Serviços com falha:")
        for name, status in results.items():
            if not status:
                print(f"  {Fore.RED}• {name}")
    
    # Status final
    if success == total:
        print(f"\n{Fore.GREEN}🎉 SISTEMA TOTALMENTE OPERACIONAL!")
        return 0
    elif success >= total * 0.7:
        print(f"\n{Fore.YELLOW}⚠️  Sistema parcialmente operacional")
        return 1
    else:
        print(f"\n{Fore.RED}❌ Sistema com problemas críticos")
        return 2

if __name__ == "__main__":
    try:
        exit_code = main()
        sys.exit(exit_code)
    except KeyboardInterrupt:
        print(f"\n{Fore.YELLOW}Teste interrompido pelo usuário")
        sys.exit(3)
    except Exception as e:
        print(f"\n{Fore.RED}Erro fatal: {str(e)}")
        sys.exit(4)
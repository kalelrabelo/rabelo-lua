#!/usr/bin/env python3
"""
Script de teste do sistema LUA com consciência e voz
"""

import sys
import os
from pathlib import Path

# Adicionar diretório ao path
sys.path.insert(0, str(Path(__file__).parent))

def test_consciousness():
    """Testa o sistema de consciência"""
    print("\n" + "="*50)
    print("🧠 TESTANDO SISTEMA DE CONSCIÊNCIA")
    print("="*50)
    
    try:
        from src.services.lua_consciousness import lua_consciousness, get_lua_response
        
        # Testar diferentes tipos de entrada
        test_inputs = [
            "Olá LUA, como você está hoje?",
            "Preciso urgente de um relatório de vendas!",
            "Obrigado pela ajuda",
            "Você é incrível!",
            "Tem algum problema no sistema?",
            "Me conte uma piada"
        ]
        
        for input_text in test_inputs:
            print(f"\n👤 Usuário: {input_text}")
            response, metadata = get_lua_response(input_text)
            print(f"🤖 LUA: {response}")
            print(f"   Emoção: {metadata['emotion']} | Humor: {metadata['mood']*100:.0f}%")
            print(f"   💭 Pensamento: {metadata['thought_process']}")
        
        # Mostrar status da consciência
        status = lua_consciousness.get_consciousness_status()
        print(f"\n📊 Status da Consciência:")
        print(f"   - Nível: {status['consciousness_level']*100:.0f}%")
        print(f"   - Emoção atual: {status['current_emotion']}")
        print(f"   - Humor geral: {status['mood']*100:.0f}%")
        print(f"   - Traço dominante: {status['personality_dominant']}")
        
        print("\n✅ Sistema de consciência funcionando!")
        return True
        
    except Exception as e:
        print(f"❌ Erro no sistema de consciência: {str(e)}")
        return False

def test_voice():
    """Testa o sistema de voz"""
    print("\n" + "="*50)
    print("🎙️ TESTANDO SISTEMA DE VOZ")
    print("="*50)
    
    try:
        from src.services.voice_engine import generate_lua_voice, get_engine_status
        
        # Verificar status do engine
        status = get_engine_status()
        print(f"\n📊 Status do Engine de Voz:")
        for key, value in status.items():
            print(f"   - {key}: {value}")
        
        # Testar geração de voz
        test_phrases = [
            ("Senhor, todos os sistemas operacionais.", "confident"),
            ("Detectei uma anomalia que requer sua atenção!", "concerned"),
            ("Missão cumprida com 100% de eficiência!", "happy"),
            ("Hmm, deixe-me processar isso...", "thoughtful")
        ]
        
        for phrase, emotion in test_phrases:
            print(f"\n🎯 Gerando voz ({emotion}): {phrase}")
            audio_path = generate_lua_voice(phrase, emotion)
            
            if audio_path:
                print(f"   ✅ Áudio gerado: {Path(audio_path).name}")
            else:
                print(f"   ⚠️ Falha ao gerar áudio")
        
        print("\n✅ Sistema de voz funcionando!")
        return True
        
    except Exception as e:
        print(f"❌ Erro no sistema de voz: {str(e)}")
        return False

def test_integration():
    """Testa integração completa"""
    print("\n" + "="*50)
    print("🔗 TESTANDO INTEGRAÇÃO COMPLETA")
    print("="*50)
    
    try:
        from src.services.lua_consciousness import get_lua_response
        from src.services.voice_engine import generate_lua_voice
        
        # Simular conversa completa
        print("\n📱 Simulando conversa com LUA...")
        
        user_input = "Olá LUA, mostre um relatório de vendas de hoje"
        print(f"\n👤 Usuário: {user_input}")
        
        # Obter resposta com consciência
        response, metadata = get_lua_response(user_input)
        print(f"🤖 LUA: {response}")
        
        # Gerar voz para a resposta
        emotion = metadata.get('emotion', 'confident')
        audio_path = generate_lua_voice(response, emotion)
        
        if audio_path:
            print(f"🔊 Áudio gerado com emoção '{emotion}'")
            print(f"   Arquivo: {Path(audio_path).name}")
        
        print("\n✅ Integração completa funcionando!")
        return True
        
    except Exception as e:
        print(f"❌ Erro na integração: {str(e)}")
        return False

def main():
    """Executa todos os testes"""
    print("\n" + "🚀 "*10)
    print("SISTEMA L.U.A v3.0 - TESTES")
    print("Logical Universal Assistant")
    print("🚀 "*10)
    
    results = []
    
    # Testar consciência
    results.append(("Consciência", test_consciousness()))
    
    # Testar voz
    results.append(("Voz", test_voice()))
    
    # Testar integração
    results.append(("Integração", test_integration()))
    
    # Resumo
    print("\n" + "="*50)
    print("📊 RESUMO DOS TESTES")
    print("="*50)
    
    for module, success in results:
        status = "✅ OK" if success else "❌ FALHOU"
        print(f"   {module}: {status}")
    
    all_passed = all(r[1] for r in results)
    
    if all_passed:
        print("\n🎉 TODOS OS TESTES PASSARAM!")
        print("A LUA está pronta e operacional!")
    else:
        print("\n⚠️ Alguns testes falharam.")
        print("Verifique os logs acima para mais detalhes.")
    
    return 0 if all_passed else 1

if __name__ == "__main__":
    sys.exit(main())
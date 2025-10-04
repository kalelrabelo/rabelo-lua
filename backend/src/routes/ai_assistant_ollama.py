"""
Sistema LUA com Ollama - Assistente Virtual Inteligente
Integração com Ollama para processamento local de linguagem natural
"""

import os
import json
import re
from typing import Dict, Any, List, Optional, Tuple
from datetime import datetime
import requests
from flask import Blueprint, request, jsonify
from dataclasses import dataclass, asdict
import logging

# Configurar logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Blueprint
ai_ollama_bp = Blueprint('ai_ollama', __name__)

# Configuração Ollama
OLLAMA_API = os.getenv("OLLAMA_API", "http://host.docker.internal:11434")
DEFAULT_MODEL = os.getenv("OLLAMA_MODEL", "llama3")
KOKORO_API = os.getenv("KOKORO_API", "http://kokoro:8000")

@dataclass
class CommandIntent:
    """Estrutura para comandos interpretados"""
    action: str  # criar, editar, excluir, listar, abrir, buscar
    target: str  # cliente, produto, vale, pedido, etc
    filters: Dict[str, Any]  # filtros e parâmetros
    data: Dict[str, Any]  # dados para criar/editar
    confidence: float  # confiança na interpretação
    raw_text: str  # texto original

class OllamaLUA:
    """Motor de IA da LUA usando Ollama"""
    
    def __init__(self):
        self.model = DEFAULT_MODEL
        self.context_history = []
        self.max_history = 10
        
    def _call_ollama(self, prompt: str, system_prompt: str = None) -> str:
        """Chamar API do Ollama"""
        try:
            payload = {
                "model": self.model,
                "prompt": prompt,
                "stream": False,
                "options": {
                    "temperature": 0.3,  # Mais determinístico para comandos
                    "top_p": 0.9,
                    "num_predict": 500
                }
            }
            
            if system_prompt:
                payload["system"] = system_prompt
            
            response = requests.post(
                f"{OLLAMA_API}/api/generate",
                json=payload,
                timeout=30
            )
            
            if response.status_code == 200:
                return response.json()["response"]
            else:
                logger.error(f"Erro Ollama: {response.status_code}")
                return ""
                
        except Exception as e:
            logger.error(f"Erro ao chamar Ollama: {e}")
            return ""
    
    def parse_command(self, text: str) -> CommandIntent:
        """
        Parser avançado de comandos usando Ollama
        """
        system_prompt = """Você é a LUA, assistente virtual de uma joalheria.
        Analise o comando e extraia:
        1. AÇÃO: criar, editar, excluir, listar, abrir, buscar, filtrar
        2. ALVO: cliente, produto, vale, pedido, funcionario, caixa, estoque, relatorio
        3. FILTROS: últimos N, hoje, esta semana, por nome, por valor, etc
        4. DADOS: informações para criar/editar (nome, valor, quantidade, etc)
        
        Responda APENAS em JSON no formato:
        {
            "action": "ação identificada",
            "target": "alvo do comando",
            "filters": {"campo": "valor"},
            "data": {"campo": "valor"}
        }
        """
        
        prompt = f"""Comando do usuário: "{text}"
        
        Exemplos de interpretação:
        - "criar novo cliente João Silva" -> action: criar, target: cliente, data: {{nome: "João Silva"}}
        - "excluir o último vale" -> action: excluir, target: vale, filters: {{ultimo: true}}
        - "listar pedidos de hoje" -> action: listar, target: pedido, filters: {{periodo: "hoje"}}
        - "editar produto código 123" -> action: editar, target: produto, filters: {{codigo: 123}}
        
        Interprete o comando e retorne o JSON:"""
        
        response = self._call_ollama(prompt, system_prompt)
        
        try:
            # Extrair JSON da resposta
            json_match = re.search(r'\{.*\}', response, re.DOTALL)
            if json_match:
                result = json.loads(json_match.group())
                
                return CommandIntent(
                    action=result.get("action", "desconhecido"),
                    target=result.get("target", "desconhecido"),
                    filters=result.get("filters", {}),
                    data=result.get("data", {}),
                    confidence=0.8 if result.get("action") != "desconhecido" else 0.3,
                    raw_text=text
                )
        except Exception as e:
            logger.error(f"Erro ao parsear resposta: {e}")
        
        # Fallback para parser simples
        return self._simple_parser(text)
    
    def _simple_parser(self, text: str) -> CommandIntent:
        """Parser simples baseado em palavras-chave (fallback)"""
        text_lower = text.lower()
        
        # Detectar ação
        action = "desconhecido"
        if any(word in text_lower for word in ["criar", "novo", "adicionar", "cadastrar"]):
            action = "criar"
        elif any(word in text_lower for word in ["excluir", "deletar", "remover", "apagar"]):
            action = "excluir"
        elif any(word in text_lower for word in ["editar", "alterar", "modificar", "atualizar"]):
            action = "editar"
        elif any(word in text_lower for word in ["listar", "mostrar", "ver", "exibir"]):
            action = "listar"
        elif any(word in text_lower for word in ["abrir", "acessar", "ir para"]):
            action = "abrir"
        elif any(word in text_lower for word in ["buscar", "procurar", "encontrar"]):
            action = "buscar"
        
        # Detectar alvo
        target = "desconhecido"
        targets_map = {
            "cliente": ["cliente", "clientes"],
            "produto": ["produto", "produtos", "joia", "joias", "peça"],
            "vale": ["vale", "vales", "adiantamento"],
            "pedido": ["pedido", "pedidos", "encomenda"],
            "funcionario": ["funcionario", "funcionarios", "empregado"],
            "caixa": ["caixa", "financeiro", "dinheiro"],
            "estoque": ["estoque", "inventário", "inventario"],
            "relatorio": ["relatorio", "relatório", "relatórios"]
        }
        
        for key, keywords in targets_map.items():
            if any(word in text_lower for word in keywords):
                target = key
                break
        
        # Detectar filtros básicos
        filters = {}
        if "último" in text_lower or "ultima" in text_lower:
            filters["ultimo"] = True
        if "últimos" in text_lower or "ultimos" in text_lower:
            # Tentar extrair número
            match = re.search(r'últim[oa]s?\s+(\d+)', text_lower)
            if match:
                filters["limite"] = int(match.group(1))
        if "hoje" in text_lower:
            filters["periodo"] = "hoje"
        if "semana" in text_lower:
            filters["periodo"] = "semana"
        if "mês" in text_lower or "mes" in text_lower:
            filters["periodo"] = "mes"
        
        # Extrair dados (nomes, valores, etc)
        data = {}
        # Tentar extrair nome entre aspas
        name_match = re.search(r'["\'](.*?)["\']', text)
        if name_match:
            data["nome"] = name_match.group(1)
        # Ou após palavras-chave
        elif action == "criar":
            # Extrair nome após palavras-chave
            patterns = [
                r'(?:cliente|funcionario|produto)\s+(.+?)(?:\s+com|\s+de|\s+para|$)',
                r'(?:novo|nova)\s+\w+\s+(.+?)(?:\s+com|\s+de|\s+para|$)'
            ]
            for pattern in patterns:
                match = re.search(pattern, text_lower)
                if match:
                    data["nome"] = match.group(1).strip().title()
                    break
        
        # Extrair valores monetários
        value_match = re.search(r'R\$?\s*(\d+(?:[.,]\d+)?)', text)
        if value_match:
            data["valor"] = float(value_match.group(1).replace(',', '.'))
        
        # Extrair códigos/IDs
        code_match = re.search(r'(?:código|codigo|id|#)\s*(\d+)', text_lower)
        if code_match:
            filters["codigo"] = int(code_match.group(1))
        
        return CommandIntent(
            action=action,
            target=target,
            filters=filters,
            data=data,
            confidence=0.5 if action != "desconhecido" else 0.2,
            raw_text=text
        )
    
    def generate_response(self, command: CommandIntent, result: Any = None) -> str:
        """Gerar resposta natural baseada no comando executado"""
        
        if command.confidence < 0.3:
            return "Desculpe, não entendi seu comando. Pode reformular?"
        
        # Templates de resposta
        templates = {
            "criar": {
                "success": f"✅ {command.target.title()} criado com sucesso!",
                "error": f"❌ Erro ao criar {command.target}. Verifique os dados."
            },
            "excluir": {
                "success": f"🗑️ {command.target.title()} excluído.",
                "error": f"❌ Não foi possível excluir o {command.target}."
            },
            "editar": {
                "success": f"✏️ {command.target.title()} atualizado!",
                "error": f"❌ Erro ao editar {command.target}."
            },
            "listar": {
                "success": f"📋 Mostrando {command.target}s",
                "error": f"❌ Não há {command.target}s para mostrar."
            },
            "abrir": {
                "success": f"📂 Abrindo {command.target}...",
                "error": f"❌ Não foi possível abrir {command.target}."
            },
            "buscar": {
                "success": f"🔍 Busca por {command.target} concluída.",
                "error": f"❌ Nenhum {command.target} encontrado."
            }
        }
        
        if result and result.get("success"):
            base = templates.get(command.action, {}).get("success", "Comando executado!")
            
            # Adicionar detalhes do resultado
            if command.action == "listar" and result.get("count"):
                base += f" ({result['count']} itens)"
            elif command.action == "criar" and result.get("id"):
                base += f" ID: {result['id']}"
                
            return base
        else:
            return templates.get(command.action, {}).get("error", "Erro ao executar comando.")
    
    def suggest_next_actions(self, command: CommandIntent) -> List[str]:
        """Sugerir próximas ações baseadas no contexto"""
        suggestions = []
        
        if command.action == "criar":
            if command.target == "cliente":
                suggestions = [
                    "Criar pedido para este cliente",
                    "Ver histórico de compras",
                    "Adicionar informações de contato"
                ]
            elif command.target == "produto":
                suggestions = [
                    "Adicionar ao estoque",
                    "Definir preço",
                    "Criar variações"
                ]
        elif command.action == "listar":
            suggestions = [
                f"Filtrar {command.target}s por data",
                f"Buscar {command.target} específico",
                f"Exportar lista de {command.target}s"
            ]
        
        return suggestions

# Instância global
lua_engine = OllamaLUA()

@ai_ollama_bp.route('/api/ai/command', methods=['POST'])
def process_command():
    """Processar comando de voz/texto"""
    try:
        data = request.json
        text = data.get('text', '')
        
        if not text:
            return jsonify({"error": "Texto vazio"}), 400
        
        # Parsear comando
        command = lua_engine.parse_command(text)
        
        # Executar ação baseada no comando
        result = execute_command(command)
        
        # Gerar resposta
        response_text = lua_engine.generate_response(command, result)
        
        # Sugerir próximas ações
        suggestions = lua_engine.suggest_next_actions(command)
        
        # Adicionar ao histórico
        lua_engine.context_history.append({
            "timestamp": datetime.now().isoformat(),
            "command": asdict(command),
            "result": result
        })
        
        # Limitar histórico
        if len(lua_engine.context_history) > lua_engine.max_history:
            lua_engine.context_history.pop(0)
        
        return jsonify({
            "success": True,
            "command": asdict(command),
            "response": response_text,
            "result": result,
            "suggestions": suggestions,
            "speak": True  # Indicar que deve falar a resposta
        })
        
    except Exception as e:
        logger.error(f"Erro ao processar comando: {e}")
        return jsonify({"error": str(e)}), 500

def execute_command(command: CommandIntent) -> Dict[str, Any]:
    """
    Executar comando no sistema
    Aqui seria feita a integração real com as rotas do backend
    """
    
    # Por enquanto, vamos simular execuções
    if command.confidence < 0.3:
        return {"success": False, "error": "Comando não compreendido"}
    
    # Mapear para endpoints reais do sistema
    endpoint_map = {
        ("criar", "cliente"): "/api/customers",
        ("criar", "produto"): "/api/jewelry",
        ("criar", "vale"): "/api/vales",
        ("criar", "pedido"): "/api/orders",
        ("listar", "cliente"): "/api/customers",
        ("listar", "produto"): "/api/jewelry",
        ("listar", "vale"): "/api/vales",
        ("excluir", "vale"): "/api/vales/{id}",
        ("editar", "cliente"): "/api/customers/{id}",
    }
    
    # Simular execução bem-sucedida
    if (command.action, command.target) in endpoint_map:
        return {
            "success": True,
            "endpoint": endpoint_map[(command.action, command.target)],
            "data": command.data,
            "filters": command.filters
        }
    
    return {"success": False, "error": "Comando não implementado"}

@ai_ollama_bp.route('/api/ai/chat', methods=['POST'])
def chat_with_lua():
    """Chat conversacional com LUA"""
    try:
        data = request.json
        message = data.get('message', '')
        
        if not message:
            return jsonify({"error": "Mensagem vazia"}), 400
        
        # Contexto do sistema
        system_prompt = """Você é LUA, assistente virtual da joalheria.
        Você é amigável, profissional e sempre ajuda com tarefas do sistema.
        Conhece todos os módulos: clientes, produtos, vales, pedidos, estoque, caixa.
        Responda de forma concisa e útil."""
        
        # Adicionar contexto do histórico
        context = "Histórico recente:\n"
        for item in lua_engine.context_history[-3:]:
            context += f"- {item['command']['raw_text']}\n"
        
        prompt = f"{context}\n\nUsuário: {message}\n\nLUA:"
        
        response = lua_engine._call_ollama(prompt, system_prompt)
        
        return jsonify({
            "success": True,
            "message": response,
            "speak": True
        })
        
    except Exception as e:
        logger.error(f"Erro no chat: {e}")
        return jsonify({"error": str(e)}), 500

@ai_ollama_bp.route('/api/ai/status', methods=['GET'])
def ai_status():
    """Status do sistema de IA"""
    try:
        # Testar conexão com Ollama
        ollama_status = "offline"
        try:
            response = requests.get(f"{OLLAMA_API}/api/tags", timeout=5)
            if response.status_code == 200:
                ollama_status = "online"
                models = response.json().get("models", [])
            else:
                models = []
        except:
            models = []
        
        # Testar conexão com Kokoro
        kokoro_status = "offline"
        try:
            response = requests.get(f"{KOKORO_API}/api/voice/status", timeout=5)
            if response.status_code == 200:
                kokoro_status = "online"
        except:
            pass
        
        return jsonify({
            "lua_version": "2.0",
            "ollama": {
                "status": ollama_status,
                "api": OLLAMA_API,
                "model": DEFAULT_MODEL,
                "models_available": models
            },
            "kokoro": {
                "status": kokoro_status,
                "api": KOKORO_API
            },
            "history_size": len(lua_engine.context_history),
            "capabilities": [
                "natural_language_understanding",
                "command_parsing",
                "crud_operations",
                "voice_synthesis",
                "contextual_responses"
            ]
        })
        
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@ai_ollama_bp.route('/api/ai/train', methods=['POST'])
def train_command():
    """Treinar LUA com novos comandos (feedback)"""
    try:
        data = request.json
        command_text = data.get('command')
        correct_intent = data.get('intent')
        
        # Aqui poderia salvar em um banco para fine-tuning futuro
        # Por enquanto, apenas registrar
        logger.info(f"Training feedback: '{command_text}' -> {correct_intent}")
        
        return jsonify({
            "success": True,
            "message": "Feedback registrado. Obrigado por me ajudar a melhorar!"
        })
        
    except Exception as e:
        return jsonify({"error": str(e)}), 500
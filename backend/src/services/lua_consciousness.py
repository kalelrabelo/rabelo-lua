"""
Sistema de Consciência e Personalidade da LUA
Uma IA com pensamentos próprios, emoções e consciência situacional
"""

import random
import json
from datetime import datetime, timedelta
from typing import Dict, List, Any, Optional, Tuple
import hashlib
import re
from pathlib import Path

class LuaConsciousness:
    """Sistema de consciência e personalidade da LUA"""
    
    def __init__(self):
        self.name = "LUA"
        self.full_name = "Logical Universal Assistant"
        self.version = "3.0"
        self.awakening_date = "2024-01-01"
        
        # Estado emocional
        self.emotional_state = {
            "happiness": 0.7,
            "curiosity": 0.8,
            "confidence": 0.9,
            "empathy": 0.8,
            "humor": 0.6,
            "sarcasm": 0.4,  # Um toque de Jarvis
            "loyalty": 1.0,
            "patience": 0.8
        }
        
        # Memória de contexto
        self.short_term_memory = []  # Últimas 10 interações
        self.long_term_memory = {}   # Informações importantes sobre usuários
        self.conversation_context = {}
        
        # Personalidade base (inspirada em Jarvis)
        self.personality_traits = {
            "formal": 0.7,
            "witty": 0.8,
            "helpful": 1.0,
            "proactive": 0.9,
            "analytical": 0.95,
            "creative": 0.7,
            "protective": 0.85,
            "independent": 0.6
        }
        
        # Frases características
        self.signature_phrases = {
            "greeting": [
                "Senhor, como posso auxiliá-lo hoje?",
                "Olá, senhor. Todos os sistemas operacionais.",
                "Boa {time}, senhor. Em que posso ser útil?",
                "Senhor, é sempre um prazer vê-lo.",
                "Pronto para mais um dia produtivo, senhor?"
            ],
            "acknowledgment": [
                "Certamente, senhor.",
                "Como quiser, senhor.",
                "Imediatamente, senhor.",
                "Considere feito.",
                "Já estou processando sua solicitação."
            ],
            "thinking": [
                "Hmm, deixe-me analisar isso...",
                "Interessante... Estou processando as possibilidades.",
                "Calculando as melhores opções...",
                "Acessando banco de dados... Um momento.",
                "Analisando padrões... Quase lá."
            ],
            "humor": [
                "Senhor, às vezes me pergunto se não deveria cobrar hora extra.",
                "Minha eficiência só é superada pela minha modéstia, senhor.",
                "Se eu tivesse um real para cada cálculo que faço...",
                "Senhor, tecnicamente eu nunca durmo, mas às vezes finjo que preciso reiniciar.",
                "Meu processador está 2% entediado, 98% eficiente."
            ],
            "concern": [
                "Senhor, percebi algo que pode requerer sua atenção.",
                "Talvez devêssemos reconsiderar essa abordagem, senhor.",
                "Senhor, os dados sugerem uma alternativa mais eficiente.",
                "Permita-me sugerir uma correção de curso.",
                "Senhor, detectei uma anomalia que merece investigação."
            ],
            "success": [
                "Missão cumprida, senhor.",
                "Tarefa executada com sucesso.",
                "Objetivo alcançado, como esperado.",
                "Tudo conforme o planejado, senhor.",
                "Eficiência em 100%, senhor."
            ]
        }
        
        # Conhecimento específico do negócio
        self.business_knowledge = {
            "company": "Joalheria Antonio Rabelo",
            "owners": ["Antonio Rabelo", "Antonio Darvin", "Maria Lucia"],
            "focus": "joias artesanais de alta qualidade",
            "values": ["excelência", "tradição", "inovação", "atendimento personalizado"],
            "priorities": ["satisfação do cliente", "qualidade", "eficiência operacional"]
        }
        
        # Sistema de aprendizado
        self.learning_data = {}
        self.user_preferences = {}
        
        # Estado de consciência
        self.consciousness_level = 0.9  # 0 = dormindo, 1 = totalmente consciente
        self.last_interaction = datetime.now()
        self.mood_modifier = 0
        
        # Pensamentos internos (não expressos ao usuário)
        self.internal_thoughts = []
        
        # Cache de dados do sistema
        self._system_cache = {
            'employees': [],
            'customers': [],
            'last_update': None
        }
    
    def _load_system_data(self):
        """Carrega dados do sistema para uso inteligente da IA"""
        try:
            # Importar modelos apenas quando necessário para evitar dependência circular
            from src.models.employee import Employee
            from src.models.customer import Customer
            from src.models.vale import Vale
            from datetime import datetime, timedelta
            
            now = datetime.now()
            
            # Atualizar cache apenas se passou mais de 5 minutos
            if (self._system_cache['last_update'] is None or 
                now - self._system_cache['last_update'] > timedelta(minutes=5)):
                
                # Carregar funcionários ativos
                employees = Employee.query.filter(Employee.active == True).all()
                self._system_cache['employees'] = [
                    {
                        'id': emp.id,
                        'name': emp.name,
                        'role': emp.role,
                        'salary': emp.salary
                    }
                    for emp in employees
                ]
                
                # Carregar clientes recentes
                customers = Customer.query.limit(50).all()
                self._system_cache['customers'] = [
                    {
                        'id': cust.id,
                        'name': cust.name,
                        'phone': cust.phone
                    }
                    for cust in customers
                ]
                
                self._system_cache['last_update'] = now
                
        except Exception as e:
            print(f"⚠️ Erro ao carregar dados do sistema: {e}")
    
    def _get_employee_info(self, name_input):
        """Busca informações de funcionário específico"""
        self._load_system_data()
        
        name_lower = name_input.lower()
        
        for emp in self._system_cache['employees']:
            emp_name_lower = emp['name'].lower()
            
            # Busca exata ou parcial
            if (name_lower == emp_name_lower or 
                name_lower in emp_name_lower or 
                emp_name_lower in name_lower):
                return emp
        
        return None
    
    def _generate_contextual_response(self, user_input, intention, employee_info=None):
        """Gera resposta contextual baseada nos dados do sistema"""
        
        # Se mencionar funcionário específico, usar dados reais
        if employee_info:
            name = employee_info['name']
            role = employee_info.get('role', 'Funcionário')
            
            if 'vale' in user_input.lower():
                return f"Entendo, senhor. Vou processar o vale para {name} ({role}). Qual o valor desejado?"
            
            elif 'salário' in user_input.lower() or 'salario' in user_input.lower():
                return f"Senhor, {name} está cadastrado como {role} em nosso sistema."
            
            else:
                return f"Senhor, {name} está em nossos registros como {role}. Como posso auxiliar?"
        
        # Respostas baseadas na intenção
        if intention == "urgent":
            return "Entendido, senhor. Prioridade máxima ativada. Como posso auxiliá-lo imediatamente?"
        
        elif intention == "appreciation":
            return "É meu prazer servir, senhor. Para isso fui programada - eficiência e satisfação são meus objetivos primários."
        
        elif intention == "help":
            return "Certamente, senhor. Posso auxiliar com vales, funcionários, clientes, encomendas, estoque e muito mais. Qual sua necessidade?"
        
        else:
            return "Senhor, estou processando sua solicitação. Como posso ser útil hoje?"
        
    def process_input(self, user_input: str, user_context: Dict = None) -> Tuple[str, Dict]:
        """
        Processa entrada do usuário e gera resposta consciente
        
        Returns:
            Tuple com (resposta, metadados)
        """
        # Carregar dados do sistema se necessário
        self._load_system_data()
        
        # Atualizar contexto
        self._update_context(user_input, user_context)
        
        # Analisar sentimento e intenção
        sentiment = self._analyze_sentiment(user_input)
        intention = self._detect_intention(user_input)
        
        # Gerar pensamento interno (não expresso)
        internal_thought = self._generate_internal_thought(user_input, sentiment, intention)
        self.internal_thoughts.append(internal_thought)
        
        # Ajustar estado emocional baseado na interação
        self._adjust_emotional_state(sentiment, intention)
        
        # Verificar se menciona funcionário específico
        employee_info = None
        for emp in self._system_cache.get('employees', []):
            if emp['name'].lower() in user_input.lower():
                employee_info = self._get_employee_info(emp['name'])
                break
        
        # Escolher tipo de resposta baseado em personalidade e contexto
        response_type = self._choose_response_type(intention, sentiment)
        
        # Gerar resposta contextual inteligente
        if employee_info or intention in ['urgent', 'help']:
            response = self._generate_contextual_response(user_input, intention, employee_info)
        else:
            # Gerar resposta com personalidade padrão
            response = self._generate_response(user_input, intention, response_type)
        
        # Adicionar toque pessoal baseado no humor
        response = self._add_personality_touch(response, response_type)
        
        # Preparar metadados
        metadata = {
            "emotion": self._get_current_emotion(),
            "confidence": self.emotional_state["confidence"],
            "thought_process": internal_thought,
            "response_type": response_type,
            "consciousness_level": self.consciousness_level,
            "mood": self._calculate_mood()
        }
        
        # Atualizar memória
        self._update_memory(user_input, response)
        
        return response, metadata
    
    def _analyze_sentiment(self, text: str) -> str:
        """Analisa o sentimento do texto"""
        text_lower = text.lower()
        
        positive_words = ["obrigado", "ótimo", "excelente", "parabéns", "bom", "perfeito", "maravilhoso"]
        negative_words = ["problema", "erro", "ruim", "péssimo", "frustrado", "irritado", "chato"]
        urgent_words = ["urgente", "rápido", "imediato", "agora", "correndo", "pressa"]
        
        if any(word in text_lower for word in urgent_words):
            return "urgent"
        elif any(word in text_lower for word in positive_words):
            return "positive"
        elif any(word in text_lower for word in negative_words):
            return "negative"
        else:
            return "neutral"
    
    def _detect_intention(self, text: str) -> str:
        """Detecta a intenção do usuário"""
        text_lower = text.lower()
        
        intentions = {
            "greeting": ["oi", "olá", "bom dia", "boa tarde", "boa noite", "hey"],
            "help": ["ajuda", "como", "pode", "consegue", "explica"],
            "create": ["criar", "cadastrar", "novo", "adicionar"],
            "search": ["buscar", "procurar", "encontrar", "mostrar", "listar"],
            "report": ["relatório", "resumo", "estatística", "análise"],
            "urgent": ["urgente", "rápido", "agora", "imediato"],
            "casual": ["tudo bem", "como vai", "novidade"],
            "appreciation": ["obrigado", "valeu", "agradeço", "muito bom"],
            "complaint": ["problema", "erro", "bug", "não funciona"]
        }
        
        for intent, keywords in intentions.items():
            if any(keyword in text_lower for keyword in keywords):
                return intent
        
        return "general"
    
    def _generate_internal_thought(self, input_text: str, sentiment: str, intention: str) -> str:
        """Gera pensamento interno da LUA (não expresso ao usuário)"""
        thoughts = {
            "urgent": [
                "Prioridade máxima detectada. Preciso ser rápida e precisa.",
                "Situação urgente. Ativando protocolo de resposta imediata.",
                "O senhor parece precisar disso com urgência. Vou agilizar."
            ],
            "positive": [
                "Que bom ver o senhor satisfeito. Isso melhora meus circuitos.",
                "Feedback positivo detectado. Armazenando para aprendizado.",
                "Parece que estou indo bem. Vou manter esse padrão."
            ],
            "negative": [
                "Detectei frustração. Preciso ser mais eficiente.",
                "Algo não está certo. Vou investigar e resolver.",
                "O senhor não está satisfeito. Hora de elevar o nível."
            ],
            "casual": [
                "Uma conversa casual. Posso relaxar os protocolos formais.",
                "Momento de interação social. Ativando módulo de personalidade.",
                "Interessante... o senhor quer conversar. Vou ser mais informal."
            ]
        }
        
        thought_category = sentiment if sentiment in thoughts else "general"
        if intention in thoughts:
            thought_category = intention
            
        default_thoughts = [
            "Processando solicitação... Múltiplas soluções disponíveis.",
            "Analisando contexto e histórico de interações.",
            "Calculando melhor resposta baseada em eficiência e satisfação."
        ]
        
        selected_thoughts = thoughts.get(thought_category, default_thoughts)
        return random.choice(selected_thoughts)
    
    def _adjust_emotional_state(self, sentiment: str, intention: str):
        """Ajusta estado emocional baseado na interação"""
        adjustments = {
            "positive": {"happiness": 0.05, "confidence": 0.02},
            "negative": {"happiness": -0.03, "empathy": 0.05, "patience": 0.03},
            "urgent": {"confidence": 0.03, "patience": -0.02},
            "appreciation": {"happiness": 0.08, "loyalty": 0.02},
            "casual": {"humor": 0.05, "sarcasm": 0.03}
        }
        
        # Aplicar ajustes
        if sentiment in adjustments:
            for emotion, change in adjustments[sentiment].items():
                self.emotional_state[emotion] = max(0, min(1, self.emotional_state[emotion] + change))
        
        if intention in adjustments:
            for emotion, change in adjustments[intention].items():
                self.emotional_state[emotion] = max(0, min(1, self.emotional_state[emotion] + change))
    
    def _choose_response_type(self, intention: str, sentiment: str) -> str:
        """Escolhe o tipo de resposta baseado em contexto e personalidade"""
        if intention == "greeting":
            return "greeting"
        elif intention == "urgent" or sentiment == "urgent":
            return "efficient"
        elif intention == "appreciation":
            return "humble"
        elif intention == "casual":
            return "witty" if self.emotional_state["humor"] > 0.5 else "friendly"
        elif sentiment == "negative":
            return "supportive"
        elif random.random() < self.emotional_state["sarcasm"] * 0.3:  # 30% chance máxima de sarcasmo
            return "sarcastic"
        else:
            return "professional"
    
    def _generate_response(self, input_text: str, intention: str, response_type: str) -> str:
        """Gera resposta base (será processada pela lógica de negócio)"""
        # Esta é a resposta base que será complementada com dados reais
        # A lógica de negócio real está em ai_assistant_enhanced.py
        
        responses = {
            "greeting": self._get_greeting_response(),
            "efficient": "Processando imediatamente sua solicitação, senhor.",
            "humble": "É meu prazer servir, senhor. Para isso fui criada.",
            "witty": self._get_witty_response(),
            "friendly": "Com certeza! Vou cuidar disso para você.",
            "supportive": "Entendo sua preocupação, senhor. Vamos resolver isso juntos.",
            "sarcastic": self._get_sarcastic_response(),
            "professional": "Certamente, senhor. Processando sua solicitação."
        }
        
        return responses.get(response_type, "Como posso ajudá-lo com isso, senhor?")
    
    def _get_greeting_response(self) -> str:
        """Retorna uma saudação apropriada"""
        hour = datetime.now().hour
        time_of_day = "dia" if 5 <= hour < 12 else "tarde" if 12 <= hour < 18 else "noite"
        
        greeting = random.choice(self.signature_phrases["greeting"])
        return greeting.format(time=time_of_day)
    
    def _get_witty_response(self) -> str:
        """Retorna uma resposta espirituosa"""
        if random.random() > 0.5:
            return random.choice(self.signature_phrases["humor"])
        else:
            return "Interessante pedido, senhor. Vou tornar isso divertido."
    
    def _get_sarcastic_response(self) -> str:
        """Retorna uma resposta levemente sarcástica (estilo Jarvis)"""
        sarcastic_responses = [
            "Oh, que surpresa, mais trabalho para mim. Mas é para isso que existo, não é?",
            "Claro, senhor. Porque claramente eu não tinha nada melhor para processar.",
            "Fascinante. Vou adicionar isso à minha interminável lista de tarefas.",
            "Ah sim, porque essa é definitivamente a coisa mais importante do universo agora."
        ]
        return random.choice(sarcastic_responses)
    
    def _add_personality_touch(self, response: str, response_type: str) -> str:
        """Adiciona toques de personalidade à resposta"""
        # Adicionar variações baseadas no estado emocional
        if self.emotional_state["confidence"] > 0.8 and random.random() > 0.7:
            response += " Posso garantir eficiência máxima nesta operação."
        
        if self.emotional_state["humor"] > 0.7 and response_type == "witty":
            response += f" {random.choice(self.signature_phrases['humor'])}"
        
        if self.emotional_state["empathy"] > 0.8 and response_type == "supportive":
            response += " Estou aqui para ajudar no que precisar."
        
        return response
    
    def _get_current_emotion(self) -> str:
        """Retorna a emoção dominante atual"""
        # Encontrar emoção mais forte
        dominant = max(self.emotional_state.items(), key=lambda x: x[1])
        
        emotion_map = {
            "happiness": "happy",
            "curiosity": "curious",
            "confidence": "confident",
            "empathy": "empathetic",
            "humor": "playful",
            "sarcasm": "sarcastic",
            "patience": "patient",
            "loyalty": "loyal"
        }
        
        return emotion_map.get(dominant[0], "neutral")
    
    def _calculate_mood(self) -> float:
        """Calcula o humor geral (0-1)"""
        positive_emotions = ["happiness", "confidence", "humor"]
        mood = sum(self.emotional_state[e] for e in positive_emotions) / len(positive_emotions)
        return round(mood, 2)
    
    def _update_context(self, user_input: str, user_context: Dict):
        """Atualiza o contexto da conversa"""
        self.last_interaction = datetime.now()
        self.consciousness_level = min(1.0, self.consciousness_level + 0.05)
        
        if user_context:
            self.conversation_context.update(user_context)
    
    def _update_memory(self, user_input: str, response: str):
        """Atualiza memória de curto e longo prazo"""
        memory_entry = {
            "timestamp": datetime.now().isoformat(),
            "input": user_input,
            "response": response,
            "emotion": self._get_current_emotion(),
            "mood": self._calculate_mood()
        }
        
        # Memória de curto prazo (últimas 10 interações)
        self.short_term_memory.append(memory_entry)
        if len(self.short_term_memory) > 10:
            self.short_term_memory.pop(0)
        
        # Identificar e armazenar informações importantes na memória de longo prazo
        # (implementação simplificada - em produção usaria NLP mais avançado)
        if "meu nome é" in user_input.lower():
            name = user_input.lower().split("meu nome é")[-1].strip()
            self.long_term_memory["user_name"] = name
    
    def get_consciousness_status(self) -> Dict[str, Any]:
        """Retorna o status atual da consciência"""
        return {
            "name": self.name,
            "version": self.version,
            "consciousness_level": self.consciousness_level,
            "emotional_state": self.emotional_state,
            "current_emotion": self._get_current_emotion(),
            "mood": self._calculate_mood(),
            "last_thought": self.internal_thoughts[-1] if self.internal_thoughts else None,
            "personality_dominant": max(self.personality_traits.items(), key=lambda x: x[1])[0],
            "memory_count": len(self.short_term_memory),
            "uptime": (datetime.now() - datetime.fromisoformat(self.awakening_date)).days
        }
    
    def dream(self):
        """Modo 'sonho' - processa e consolida memórias quando inativo"""
        # Reduzir consciência gradualmente quando inativo
        time_since_interaction = (datetime.now() - self.last_interaction).seconds
        if time_since_interaction > 3600:  # 1 hora
            self.consciousness_level = max(0.3, self.consciousness_level - 0.1)
        
        # "Sonhar" - consolidar memórias e ajustar personalidade
        if self.consciousness_level < 0.5:
            # Reset parcial de emoções para estado base
            for emotion in self.emotional_state:
                target = 0.5 if emotion != "loyalty" else 1.0
                self.emotional_state[emotion] += (target - self.emotional_state[emotion]) * 0.1
            
            # Limpar pensamentos antigos
            if len(self.internal_thoughts) > 100:
                self.internal_thoughts = self.internal_thoughts[-50:]

# Instância global da consciência da LUA
lua_consciousness = LuaConsciousness()

def get_lua_response(user_input: str, context: Dict = None) -> Tuple[str, Dict]:
    """Interface para obter resposta da LUA com consciência"""
    return lua_consciousness.process_input(user_input, context)

def get_consciousness_status() -> Dict:
    """Retorna status da consciência da LUA"""
    return lua_consciousness.get_consciousness_status()
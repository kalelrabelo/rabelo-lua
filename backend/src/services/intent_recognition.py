"""
Sistema de Reconhecimento de Intenções para LUA
Identifica ações CRUD e entidades em comandos de voz em português
"""

import re
from typing import Dict, Any, List, Optional, Tuple
from dataclasses import dataclass
from enum import Enum

class CRUDAction(Enum):
    CREATE = "create"
    READ = "read"
    UPDATE = "update"
    DELETE = "delete"
    OPEN = "open"
    CLOSE = "close"
    UNKNOWN = "unknown"

class EntityType(Enum):
    VALE = "vale"
    CLIENTE = "cliente"
    PRODUTO = "produto"
    FUNCIONARIO = "funcionario"
    PAGAMENTO = "pagamento"
    ESTOQUE = "estoque"
    JOIA = "joia"
    MATERIAL = "material"
    PEDRA = "pedra"
    NOTA = "nota"
    ENCOMENDA = "encomenda"
    CAIXA = "caixa"
    UNKNOWN = "unknown"

@dataclass
class Intent:
    """Estrutura de uma intenção identificada"""
    action: CRUDAction
    entity_type: EntityType
    entities: Dict[str, Any]
    filters: Dict[str, Any]
    original_text: str
    confidence: float

class IntentRecognizer:
    """Sistema de reconhecimento de intenções para comandos em português"""
    
    def __init__(self):
        # Mapeamento de palavras-chave para ações CRUD
        self.action_keywords = {
            CRUDAction.CREATE: [
                'criar', 'cria', 'adicionar', 'adiciona', 'cadastrar', 'cadastra',
                'novo', 'nova', 'registrar', 'registra', 'inserir', 'insere',
                'fazer', 'faz', 'gerar', 'gera', 'incluir', 'inclui'
            ],
            CRUDAction.READ: [
                'mostrar', 'mostra', 'listar', 'lista', 'ver', 'visualizar',
                'exibir', 'exibe', 'buscar', 'busca', 'procurar', 'procura',
                'consultar', 'consulta', 'pesquisar', 'pesquisa', 'quais', 'qual'
            ],
            CRUDAction.UPDATE: [
                'atualizar', 'atualiza', 'editar', 'edita', 'modificar', 'modifica',
                'alterar', 'altera', 'mudar', 'muda', 'trocar', 'troca',
                'corrigir', 'corrige', 'ajustar', 'ajusta'
            ],
            CRUDAction.DELETE: [
                'excluir', 'exclui', 'deletar', 'deleta', 'remover', 'remove',
                'apagar', 'apaga', 'cancelar', 'cancela', 'desfazer', 'desfaz',
                'eliminar', 'elimina', 'descartar', 'descarta'
            ],
            CRUDAction.OPEN: [
                'abrir', 'abre', 'acessar', 'acessa', 'entrar', 'entra'
            ],
            CRUDAction.CLOSE: [
                'fechar', 'fecha', 'sair', 'sai', 'voltar', 'volta'
            ]
        }
        
        # Mapeamento de entidades
        self.entity_keywords = {
            EntityType.VALE: ['vale', 'vales', 'adiantamento', 'adiantamentos'],
            EntityType.CLIENTE: ['cliente', 'clientes', 'comprador', 'compradores', 'consumidor'],
            EntityType.PRODUTO: ['produto', 'produtos', 'item', 'itens', 'mercadoria'],
            EntityType.FUNCIONARIO: ['funcionário', 'funcionario', 'funcionários', 'funcionarios', 
                                    'colaborador', 'colaboradores', 'empregado', 'empregados'],
            EntityType.PAGAMENTO: ['pagamento', 'pagamentos', 'cobrança', 'cobranças', 'recebimento'],
            EntityType.ESTOQUE: ['estoque', 'estoques', 'inventário', 'inventario', 'armazenamento'],
            EntityType.JOIA: ['jóia', 'joia', 'jóias', 'joias', 'anel', 'anéis', 'colar', 
                             'colares', 'brinco', 'brincos', 'pulseira', 'pulseiras'],
            EntityType.MATERIAL: ['material', 'materiais', 'ouro', 'prata', 'metal', 'metais'],
            EntityType.PEDRA: ['pedra', 'pedras', 'diamante', 'diamantes', 'esmeralda', 
                              'esmeraldas', 'rubi', 'rubis', 'safira', 'safiras'],
            EntityType.NOTA: ['nota', 'notas', 'nota fiscal', 'notas fiscais', 'nf'],
            EntityType.ENCOMENDA: ['encomenda', 'encomendas', 'pedido', 'pedidos', 'ordem'],
            EntityType.CAIXA: ['caixa', 'fluxo', 'financeiro', 'dinheiro', 'saldo']
        }
        
        # Padrões de extração de valores
        self.value_patterns = {
            'money': r'R\$?\s*(\d+(?:\.\d{3})*(?:,\d{2})?|\d+)',
            'number': r'\b(\d+)\b',
            'date_relative': r'(hoje|ontem|amanhã|esta semana|este mês|último|última|próximo|próxima)',
            'person_name': r'para\s+([A-Z][a-záêçõ]+(?:\s+[A-Z][a-záêçõ]+)*)',
            'last': r'(último|última|últimos|últimas)',
            'first': r'(primeiro|primeira|primeiros|primeiras)',
            'all': r'(todos|todas|tudo)'
        }
        
        # Lista de stop words
        self.stop_words = {
            'o', 'a', 'os', 'as', 'um', 'uma', 'de', 'do', 'da', 'dos', 'das',
            'em', 'no', 'na', 'nos', 'nas', 'por', 'para', 'com', 'sem',
            'e', 'ou', 'mas', 'que', 'qual', 'quais'
        }
    
    def recognize(self, text: str) -> Intent:
        """
        Reconhece a intenção no texto fornecido
        
        Args:
            text: Texto do comando em português
            
        Returns:
            Intent: Objeto com a intenção identificada
        """
        # Normalizar texto
        text_lower = text.lower().strip()
        text_normalized = self._normalize_text(text_lower)
        
        # Identificar ação CRUD
        action, action_confidence = self._identify_action(text_normalized)
        
        # Identificar tipo de entidade
        entity_type, entity_confidence = self._identify_entity_type(text_normalized)
        
        # Extrair entidades nomeadas
        entities = self._extract_entities(text_lower)
        
        # Extrair filtros
        filters = self._extract_filters(text_lower)
        
        # Calcular confiança total
        confidence = (action_confidence + entity_confidence) / 2
        
        return Intent(
            action=action,
            entity_type=entity_type,
            entities=entities,
            filters=filters,
            original_text=text,
            confidence=confidence
        )
    
    def _normalize_text(self, text: str) -> str:
        """Normaliza o texto removendo acentos e caracteres especiais"""
        replacements = {
            'á': 'a', 'à': 'a', 'ã': 'a', 'â': 'a',
            'é': 'e', 'è': 'e', 'ê': 'e',
            'í': 'i', 'ì': 'i',
            'ó': 'o', 'ò': 'o', 'õ': 'o', 'ô': 'o',
            'ú': 'u', 'ù': 'u',
            'ç': 'c'
        }
        for old, new in replacements.items():
            text = text.replace(old, new)
        return text
    
    def _identify_action(self, text: str) -> Tuple[CRUDAction, float]:
        """Identifica a ação CRUD no texto"""
        words = text.split()
        best_action = CRUDAction.UNKNOWN
        best_confidence = 0.0
        
        for action, keywords in self.action_keywords.items():
            for keyword in keywords:
                if keyword in words:
                    # Dar mais peso se a palavra aparecer no início
                    position_weight = 1.5 if words.index(keyword) < 3 else 1.0
                    confidence = 0.9 * position_weight
                    
                    if confidence > best_confidence:
                        best_action = action
                        best_confidence = confidence
        
        # Se não encontrou ação explícita, tentar inferir
        if best_action == CRUDAction.UNKNOWN:
            if any(word in text for word in ['quais', 'quantos', 'lista']):
                best_action = CRUDAction.READ
                best_confidence = 0.6
            elif any(word in text for word in ['novo', 'nova']):
                best_action = CRUDAction.CREATE
                best_confidence = 0.6
        
        return best_action, best_confidence
    
    def _identify_entity_type(self, text: str) -> Tuple[EntityType, float]:
        """Identifica o tipo de entidade no texto"""
        best_entity = EntityType.UNKNOWN
        best_confidence = 0.0
        
        for entity_type, keywords in self.entity_keywords.items():
            for keyword in keywords:
                if keyword in text:
                    confidence = 0.95
                    if confidence > best_confidence:
                        best_entity = entity_type
                        best_confidence = confidence
        
        return best_entity, best_confidence
    
    def _extract_entities(self, text: str) -> Dict[str, Any]:
        """Extrai entidades nomeadas do texto"""
        entities = {}
        
        # Extrair valores monetários
        money_match = re.search(self.value_patterns['money'], text)
        if money_match:
            value_str = money_match.group(1)
            # Converter formato brasileiro para float
            value_str = value_str.replace('.', '').replace(',', '.')
            try:
                entities['value'] = float(value_str)
            except:
                pass
        
        # Extrair nomes de pessoas
        person_match = re.search(self.value_patterns['person_name'], text)
        if person_match:
            entities['person_name'] = person_match.group(1)
        
        # Extrair números
        if 'value' not in entities:
            number_matches = re.findall(self.value_patterns['number'], text)
            if number_matches:
                entities['numbers'] = [int(n) for n in number_matches]
                if len(number_matches) == 1:
                    entities['value'] = int(number_matches[0])
        
        # Extrair referências temporais
        if 'último' in text or 'última' in text:
            entities['target'] = 'last'
        elif 'primeiro' in text or 'primeira' in text:
            entities['target'] = 'first'
        elif 'todos' in text or 'todas' in text:
            entities['target'] = 'all'
        
        # Extrair datas relativas
        date_match = re.search(self.value_patterns['date_relative'], text)
        if date_match:
            entities['date_filter'] = date_match.group(1)
        
        return entities
    
    def _extract_filters(self, text: str) -> Dict[str, Any]:
        """Extrai filtros e condições do texto"""
        filters = {}
        
        # Filtros de valor
        if 'acima de' in text:
            filters['value_condition'] = 'greater_than'
        elif 'abaixo de' in text:
            filters['value_condition'] = 'less_than'
        elif 'igual a' in text:
            filters['value_condition'] = 'equal_to'
        elif 'entre' in text:
            filters['value_condition'] = 'between'
        
        # Filtros de status
        if 'pendente' in text or 'pendentes' in text:
            filters['status'] = 'pending'
        elif 'pago' in text or 'pagos' in text:
            filters['status'] = 'paid'
        elif 'cancelado' in text or 'cancelados' in text:
            filters['status'] = 'cancelled'
        
        # Filtros de tempo
        if 'hoje' in text:
            filters['time_filter'] = 'today'
        elif 'ontem' in text:
            filters['time_filter'] = 'yesterday'
        elif 'esta semana' in text or 'essa semana' in text:
            filters['time_filter'] = 'this_week'
        elif 'este mês' in text or 'esse mês' in text:
            filters['time_filter'] = 'this_month'
        elif 'último mês' in text:
            filters['time_filter'] = 'last_month'
        
        # Ordenação
        if 'mais recente' in text or 'mais recentes' in text:
            filters['order'] = 'desc'
        elif 'mais antigo' in text or 'mais antigos' in text:
            filters['order'] = 'asc'
        
        return filters
    
    def get_action_response(self, intent: Intent) -> Dict[str, Any]:
        """
        Converte a intenção em uma resposta acionável
        
        Returns:
            Dict com a ação a ser executada
        """
        response = {
            'action': intent.action.value,
            'entity_type': intent.entity_type.value,
            'modal_to_open': None,
            'crud_operation': None,
            'parameters': {},
            'confidence': intent.confidence
        }
        
        # Mapear entity_type para modal
        modal_mapping = {
            EntityType.VALE: 'vales',
            EntityType.CLIENTE: 'clientes',
            EntityType.PRODUTO: 'produtos',
            EntityType.FUNCIONARIO: 'funcionarios',
            EntityType.PAGAMENTO: 'pagamentos',
            EntityType.ESTOQUE: 'estoque',
            EntityType.JOIA: 'joias',
            EntityType.MATERIAL: 'materiais',
            EntityType.PEDRA: 'pedras',
            EntityType.NOTA: 'notas',
            EntityType.ENCOMENDA: 'encomendas',
            EntityType.CAIXA: 'caixa'
        }
        
        if intent.entity_type in modal_mapping:
            response['modal_to_open'] = modal_mapping[intent.entity_type]
        
        # Definir operação CRUD
        if intent.action != CRUDAction.UNKNOWN:
            response['crud_operation'] = intent.action.value
        
        # Adicionar parâmetros
        response['parameters'] = {
            'entities': intent.entities,
            'filters': intent.filters
        }
        
        # Gerar mensagem de confirmação
        response['message'] = self._generate_confirmation_message(intent)
        
        return response
    
    def _generate_confirmation_message(self, intent: Intent) -> str:
        """Gera uma mensagem de confirmação baseada na intenção"""
        action_messages = {
            CRUDAction.CREATE: "Criando novo",
            CRUDAction.READ: "Exibindo",
            CRUDAction.UPDATE: "Atualizando",
            CRUDAction.DELETE: "Excluindo",
            CRUDAction.OPEN: "Abrindo",
            CRUDAction.CLOSE: "Fechando"
        }
        
        entity_messages = {
            EntityType.VALE: "vale",
            EntityType.CLIENTE: "cliente",
            EntityType.PRODUTO: "produto",
            EntityType.FUNCIONARIO: "funcionário",
            EntityType.PAGAMENTO: "pagamento",
            EntityType.ESTOQUE: "estoque",
            EntityType.JOIA: "jóia",
            EntityType.MATERIAL: "material",
            EntityType.PEDRA: "pedra",
            EntityType.NOTA: "nota",
            EntityType.ENCOMENDA: "encomenda",
            EntityType.CAIXA: "caixa"
        }
        
        action_text = action_messages.get(intent.action, "Processando")
        entity_text = entity_messages.get(intent.entity_type, "item")
        
        message = f"{action_text} {entity_text}"
        
        # Adicionar detalhes das entidades
        if intent.entities:
            if 'person_name' in intent.entities:
                message += f" para {intent.entities['person_name']}"
            if 'value' in intent.entities:
                message += f" no valor de R$ {intent.entities['value']:.2f}"
            if 'target' in intent.entities:
                if intent.entities['target'] == 'last':
                    message += " (último registro)"
                elif intent.entities['target'] == 'first':
                    message += " (primeiro registro)"
                elif intent.entities['target'] == 'all':
                    message += " (todos os registros)"
        
        # Adicionar filtros
        if intent.filters:
            if 'time_filter' in intent.filters:
                time_translations = {
                    'today': 'hoje',
                    'yesterday': 'ontem',
                    'this_week': 'desta semana',
                    'this_month': 'deste mês',
                    'last_month': 'do mês passado'
                }
                time_text = time_translations.get(intent.filters['time_filter'], '')
                if time_text:
                    message += f" {time_text}"
        
        return message

# Instância global do reconhecedor
intent_recognizer = IntentRecognizer()

def recognize_intent(text: str) -> Dict[str, Any]:
    """
    Função de interface simplificada para reconhecimento de intenção
    
    Args:
        text: Comando em português
        
    Returns:
        Dict com a resposta acionável
    """
    intent = intent_recognizer.recognize(text)
    return intent_recognizer.get_action_response(intent)
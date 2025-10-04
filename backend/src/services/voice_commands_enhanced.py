"""
Sistema de comandos de voz inteligentes com contexto
Permite que a LUA execute ações completas, não apenas abrir menus
"""

import re
import json
from typing import Dict, List, Optional, Tuple, Any
from datetime import datetime, timedelta
from pathlib import Path
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class VoiceCommandProcessor:
    """
    Processador inteligente de comandos de voz com análise contextual
    """
    
    def __init__(self):
        self.context_history = []  # Histórico de contexto para comandos sequenciais
        self.last_entity = None     # Última entidade mencionada
        self.last_action = None     # Última ação executada
        self.command_patterns = self._build_command_patterns()
        
    def _build_command_patterns(self) -> Dict[str, List[Dict]]:
        """
        Constrói padrões de comandos de voz com suas ações correspondentes
        """
        return {
            'criar': [
                {
                    'pattern': r'(criar|adicionar|novo|nova)\s+(vale|adiantamento)\s+(?:de\s+)?(?:R\$\s*)?(\d+(?:\.\d{2})?)\s+(?:para|pro|pra)\s+(.+)',
                    'action': 'create_vale',
                    'entity': 'vale',
                    'extract': ['amount', 'employee']
                },
                {
                    'pattern': r'(criar|adicionar|cadastrar)\s+(cliente|novo cliente)\s+(.+)',
                    'action': 'create_customer',
                    'entity': 'customer',
                    'extract': ['name']
                },
                {
                    'pattern': r'(criar|fazer|gerar)\s+(pedido|encomenda)\s+(?:de\s+)?(.+)\s+(?:para|pro|pra)\s+(.+)',
                    'action': 'create_order',
                    'entity': 'order',
                    'extract': ['item', 'customer']
                },
                {
                    'pattern': r'(criar|adicionar)\s+(joia|jóia|peça)\s+(.+)',
                    'action': 'create_jewelry',
                    'entity': 'jewelry',
                    'extract': ['description']
                }
            ],
            'excluir': [
                {
                    'pattern': r'(excluir|deletar|remover|apagar)\s+(?:o\s+)?(?:último|ultima)\s+(vale|adiantamento)',
                    'action': 'delete_last_vale',
                    'entity': 'vale',
                    'target': 'last'
                },
                {
                    'pattern': r'(excluir|deletar|remover)\s+(vale|adiantamento)\s+(?:número|n°|#)?\s*(\d+)',
                    'action': 'delete_vale_by_id',
                    'entity': 'vale',
                    'extract': ['id']
                },
                {
                    'pattern': r'(excluir|deletar|remover)\s+(cliente|pedido|joia)\s+(.+)',
                    'action': 'delete_entity',
                    'entity': 'dynamic',
                    'extract': ['entity_type', 'identifier']
                },
                {
                    'pattern': r'(cancelar|desfazer)\s+(?:o\s+)?(?:último|ultima)\s+(.+)',
                    'action': 'undo_last',
                    'entity': 'dynamic',
                    'extract': ['entity_type']
                }
            ],
            'editar': [
                {
                    'pattern': r'(editar|alterar|modificar|mudar)\s+(vale|adiantamento)\s+(?:número|n°|#)?\s*(\d+)\s+para\s+(?:R\$\s*)?(\d+(?:\.\d{2})?)',
                    'action': 'edit_vale_amount',
                    'entity': 'vale',
                    'extract': ['id', 'new_amount']
                },
                {
                    'pattern': r'(editar|alterar)\s+(cliente|pedido)\s+(.+)\s+para\s+(.+)',
                    'action': 'edit_entity',
                    'entity': 'dynamic',
                    'extract': ['entity_type', 'identifier', 'new_value']
                },
                {
                    'pattern': r'(marcar|definir)\s+(pedido|encomenda)\s+(.+)\s+como\s+(pronto|concluído|entregue|cancelado)',
                    'action': 'update_order_status',
                    'entity': 'order',
                    'extract': ['identifier', 'status']
                }
            ],
            'consultar': [
                {
                    'pattern': r'(?:quais|quantos|listar|mostrar)\s+(?:são\s+)?(?:os\s+)?(vales|adiantamentos)\s+(?:de\s+)?(?:hoje|esta semana|este mês)',
                    'action': 'list_vales_period',
                    'entity': 'vale',
                    'extract': ['period']
                },
                {
                    'pattern': r'(?:qual|quanto)\s+(?:é\s+)?(?:o\s+)?total\s+(?:de\s+)?(vales|vendas|pedidos)\s*(?:de\s+)?(.+)?',
                    'action': 'get_total',
                    'entity': 'dynamic',
                    'extract': ['entity_type', 'filter']
                },
                {
                    'pattern': r'(?:mostrar|listar|quais)\s+(?:são\s+)?(?:os\s+)?(pedidos|encomendas)\s+(?:pendentes|em aberto|atrasados)',
                    'action': 'list_orders_by_status',
                    'entity': 'order',
                    'extract': ['status']
                },
                {
                    'pattern': r'(?:buscar|procurar|encontrar)\s+(cliente|funcionário|pedido|vale)\s+(.+)',
                    'action': 'search_entity',
                    'entity': 'dynamic',
                    'extract': ['entity_type', 'search_term']
                }
            ],
            'relatorio': [
                {
                    'pattern': r'(?:gerar|criar|fazer)\s+relatório\s+(?:de\s+)?(vendas|vales|pedidos|financeiro)\s*(?:de\s+)?(.+)?',
                    'action': 'generate_report',
                    'entity': 'report',
                    'extract': ['report_type', 'period']
                },
                {
                    'pattern': r'(?:resumo|balanço)\s+(?:do\s+)?(?:dia|semana|mês)',
                    'action': 'get_summary',
                    'entity': 'summary',
                    'extract': ['period']
                }
            ],
            'navegacao': [
                {
                    'pattern': r'(?:abrir|ir para|mostrar|acessar)\s+(?:o\s+)?(?:menu\s+)?(?:de\s+)?(vales|clientes|pedidos|estoque|financeiro|configurações)',
                    'action': 'navigate_to',
                    'entity': 'menu',
                    'extract': ['destination']
                },
                {
                    'pattern': r'voltar|retornar|menu anterior',
                    'action': 'go_back',
                    'entity': 'navigation'
                }
            ]
        }
    
    def process_command(self, text: str, current_context: Optional[Dict] = None) -> Dict[str, Any]:
        """
        Processa comando de voz e retorna ação estruturada
        
        Args:
            text: Texto do comando de voz
            current_context: Contexto atual da aplicação (menu atual, dados visíveis, etc.)
            
        Returns:
            Dicionário com ação a ser executada e parâmetros
        """
        text = text.lower().strip()
        
        # Adicionar ao histórico de contexto
        self.context_history.append({
            'text': text,
            'timestamp': datetime.now(),
            'context': current_context
        })
        
        # Limitar histórico a últimas 10 interações
        if len(self.context_history) > 10:
            self.context_history.pop(0)
        
        # Tentar extrair ação do comando
        action = self._extract_action(text)
        
        if not action:
            # Tentar inferir do contexto
            action = self._infer_from_context(text, current_context)
        
        # Adicionar contexto à ação
        if action:
            action['context'] = current_context
            action['timestamp'] = datetime.now().isoformat()
            self.last_action = action
            
            # Extrair e salvar entidade mencionada
            if 'entity' in action:
                self.last_entity = action['entity']
        
        return action or self._create_fallback_response(text)
    
    def _extract_action(self, text: str) -> Optional[Dict[str, Any]]:
        """
        Extrai ação específica do comando usando padrões
        """
        for category, patterns in self.command_patterns.items():
            for pattern_def in patterns:
                match = re.search(pattern_def['pattern'], text, re.IGNORECASE)
                if match:
                    action = {
                        'category': category,
                        'action': pattern_def['action'],
                        'entity': pattern_def['entity'],
                        'raw_text': text,
                        'confidence': 0.9  # Alta confiança para match direto
                    }
                    
                    # Extrair parâmetros do match
                    if 'extract' in pattern_def:
                        groups = match.groups()
                        # Pular o primeiro grupo (verbo da ação)
                        param_groups = groups[1:] if len(groups) > 1 else groups
                        
                        params = {}
                        for i, param_name in enumerate(pattern_def['extract']):
                            if i < len(param_groups):
                                params[param_name] = param_groups[i]
                        
                        action['parameters'] = params
                    
                    return action
        
        return None
    
    def _infer_from_context(self, text: str, current_context: Optional[Dict]) -> Optional[Dict[str, Any]]:
        """
        Infere ação baseada no contexto atual quando não há match direto
        """
        if not current_context:
            return None
        
        # Palavras-chave para ações genéricas
        action_keywords = {
            'criar': ['criar', 'novo', 'adicionar', 'cadastrar'],
            'excluir': ['excluir', 'deletar', 'remover', 'apagar'],
            'editar': ['editar', 'alterar', 'modificar', 'mudar'],
            'listar': ['listar', 'mostrar', 'exibir', 'ver']
        }
        
        # Determinar ação base
        detected_action = None
        for action, keywords in action_keywords.items():
            if any(keyword in text for keyword in keywords):
                detected_action = action
                break
        
        if not detected_action:
            return None
        
        # Usar contexto para determinar entidade
        current_menu = current_context.get('current_menu', '')
        
        entity_map = {
            'vales': 'vale',
            'clientes': 'customer',
            'pedidos': 'order',
            'estoque': 'inventory',
            'joias': 'jewelry'
        }
        
        entity = entity_map.get(current_menu.lower(), self.last_entity)
        
        if entity:
            return {
                'category': detected_action,
                'action': f'{detected_action}_{entity}',
                'entity': entity,
                'raw_text': text,
                'confidence': 0.6,  # Confiança média para inferência
                'inferred': True,
                'based_on_context': current_menu
            }
        
        return None
    
    def _create_fallback_response(self, text: str) -> Dict[str, Any]:
        """
        Cria resposta fallback quando não consegue processar comando
        """
        # Tentar sugerir comando similar
        suggestions = self._get_command_suggestions(text)
        
        return {
            'category': 'unknown',
            'action': 'fallback',
            'raw_text': text,
            'confidence': 0.0,
            'message': 'Não entendi o comando. Pode reformular?',
            'suggestions': suggestions,
            'help_text': 'Exemplos: "criar vale de 100 para João", "excluir último pedido", "mostrar clientes"'
        }
    
    def _get_command_suggestions(self, text: str) -> List[str]:
        """
        Sugere comandos válidos baseados no texto parcial
        """
        suggestions = []
        
        # Exemplos de comandos comuns
        common_commands = [
            "criar vale de [valor] para [funcionário]",
            "excluir último vale",
            "listar pedidos pendentes",
            "mostrar clientes",
            "gerar relatório de vendas",
            "editar cliente [nome]",
            "marcar pedido como concluído",
            "buscar funcionário [nome]"
        ]
        
        # Filtrar comandos que compartilham palavras com o texto
        text_words = set(text.lower().split())
        for cmd in common_commands:
            cmd_words = set(cmd.lower().split())
            if text_words & cmd_words:  # Interseção não vazia
                suggestions.append(cmd)
                if len(suggestions) >= 3:
                    break
        
        return suggestions
    
    def get_context_summary(self) -> Dict[str, Any]:
        """
        Retorna resumo do contexto atual para debug
        """
        return {
            'history_size': len(self.context_history),
            'last_entity': self.last_entity,
            'last_action': self.last_action,
            'recent_commands': [h['text'] for h in self.context_history[-3:]]
        }
    
    def clear_context(self):
        """
        Limpa contexto (útil ao trocar de usuário ou resetar sessão)
        """
        self.context_history = []
        self.last_entity = None
        self.last_action = None


class SmartVoiceActions:
    """
    Executor de ações inteligentes baseadas em comandos de voz
    """
    
    def __init__(self, db_session, api_client):
        self.db = db_session
        self.api = api_client
        self.processor = VoiceCommandProcessor()
        
    async def execute_voice_command(self, text: str, context: Dict = None) -> Dict[str, Any]:
        """
        Executa comando de voz e retorna resultado
        """
        # Processar comando
        action = self.processor.process_command(text, context)
        
        if action['confidence'] < 0.5:
            return {
                'success': False,
                'action': action,
                'message': 'Comando não reconhecido com confiança suficiente'
            }
        
        # Executar ação baseada no tipo
        handler = getattr(self, f"_handle_{action['action']}", None)
        
        if handler:
            try:
                result = await handler(action)
                return {
                    'success': True,
                    'action': action,
                    'result': result
                }
            except Exception as e:
                logger.error(f"Erro ao executar ação {action['action']}: {e}")
                return {
                    'success': False,
                    'action': action,
                    'error': str(e)
                }
        else:
            # Ação genérica
            return await self._handle_generic(action)
    
    async def _handle_create_vale(self, action: Dict) -> Dict:
        """
        Cria um novo vale
        """
        params = action.get('parameters', {})
        amount = float(params.get('amount', 0))
        employee_name = params.get('employee', '')
        
        # Buscar funcionário
        employee = await self.api.find_employee(employee_name)
        
        if not employee:
            return {
                'error': f'Funcionário "{employee_name}" não encontrado',
                'suggestion': 'Verificar nome ou cadastrar funcionário primeiro'
            }
        
        # Criar vale
        vale = await self.api.create_vale({
            'employee_id': employee['id'],
            'amount': amount,
            'date': datetime.now().isoformat(),
            'description': f'Vale criado por comando de voz'
        })
        
        return {
            'message': f'Vale de R$ {amount:.2f} criado para {employee_name}',
            'vale_id': vale['id'],
            'navigate_to': 'vales'
        }
    
    async def _handle_delete_last_vale(self, action: Dict) -> Dict:
        """
        Exclui o último vale criado
        """
        # Buscar último vale
        vales = await self.api.get_vales(limit=1, order='desc')
        
        if not vales:
            return {
                'error': 'Nenhum vale encontrado para excluir'
            }
        
        last_vale = vales[0]
        
        # Confirmar antes de excluir
        await self.api.delete_vale(last_vale['id'])
        
        return {
            'message': f'Vale #{last_vale["id"]} de R$ {last_vale["amount"]:.2f} foi excluído',
            'deleted_vale': last_vale
        }
    
    async def _handle_list_orders_by_status(self, action: Dict) -> Dict:
        """
        Lista pedidos por status
        """
        params = action.get('parameters', {})
        status = params.get('status', 'pendente')
        
        # Mapear status do português para o sistema
        status_map = {
            'pendentes': 'pending',
            'em aberto': 'open',
            'atrasados': 'overdue',
            'concluídos': 'completed',
            'cancelados': 'cancelled'
        }
        
        system_status = status_map.get(status.lower(), 'pending')
        
        orders = await self.api.get_orders(status=system_status)
        
        return {
            'message': f'Encontrados {len(orders)} pedidos {status}',
            'orders': orders,
            'navigate_to': 'orders',
            'filter': {'status': system_status}
        }
    
    async def _handle_generate_report(self, action: Dict) -> Dict:
        """
        Gera relatório
        """
        params = action.get('parameters', {})
        report_type = params.get('report_type', 'geral')
        period = params.get('period', 'hoje')
        
        # Calcular período
        date_range = self._parse_period(period)
        
        # Gerar relatório
        report = await self.api.generate_report(
            type=report_type,
            start_date=date_range['start'],
            end_date=date_range['end']
        )
        
        return {
            'message': f'Relatório de {report_type} gerado para {period}',
            'report': report,
            'navigate_to': 'reports',
            'open_report': True
        }
    
    async def _handle_navigate_to(self, action: Dict) -> Dict:
        """
        Navega para menu específico
        """
        params = action.get('parameters', {})
        destination = params.get('destination', 'home')
        
        # Mapear destinos
        menu_map = {
            'vales': '/vales',
            'clientes': '/clientes',
            'pedidos': '/pedidos',
            'estoque': '/estoque',
            'financeiro': '/financeiro',
            'configurações': '/settings'
        }
        
        route = menu_map.get(destination.lower(), '/')
        
        return {
            'message': f'Navegando para {destination}',
            'navigate_to': route,
            'immediate': True
        }
    
    async def _handle_generic(self, action: Dict) -> Dict:
        """
        Handler genérico para ações não específicas
        """
        return {
            'message': f'Executando {action["action"]}',
            'action': action,
            'generic': True
        }
    
    def _parse_period(self, period: str) -> Dict[str, str]:
        """
        Parse de período em texto para datas
        """
        today = datetime.now()
        
        periods = {
            'hoje': {
                'start': today.replace(hour=0, minute=0, second=0).isoformat(),
                'end': today.replace(hour=23, minute=59, second=59).isoformat()
            },
            'esta semana': {
                'start': (today - timedelta(days=today.weekday())).replace(hour=0, minute=0, second=0).isoformat(),
                'end': today.replace(hour=23, minute=59, second=59).isoformat()
            },
            'este mês': {
                'start': today.replace(day=1, hour=0, minute=0, second=0).isoformat(),
                'end': today.replace(hour=23, minute=59, second=59).isoformat()
            }
        }
        
        return periods.get(period.lower(), periods['hoje'])


# Exportar classes
__all__ = ['VoiceCommandProcessor', 'SmartVoiceActions']
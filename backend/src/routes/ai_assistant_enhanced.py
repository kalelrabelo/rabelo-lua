from flask import Blueprint, request, jsonify
from src.models.user import db
from src.models.employee import Employee
from src.models.vale import Vale
from src.models.customer import Customer
from src.models.jewelry import Jewelry
from src.models.order import Order
from src.models.payment import Payment
from src.models.caixa import CaixaTransaction, CaixaCategory
from src.models.inventory import Inventory
from src.models.cost import Cost, Profit
from src.models.payroll import Payroll
from src.models.nota import Nota
from src.models.imposto import Imposto
from datetime import datetime, timedelta
from sqlalchemy import func, and_, or_
import re

# Importar sistema de consciência e voz
try:
    from src.services.lua_consciousness import lua_consciousness, get_lua_response
    from src.services.voice_engine import generate_lua_voice
    LUA_CONSCIOUSNESS_AVAILABLE = True
except ImportError:
    print("⚠️ Sistema de consciência da LUA não disponível")
    LUA_CONSCIOUSNESS_AVAILABLE = False

# Importar sistema de reconhecimento de intenções
try:
    from src.services.intent_recognition import recognize_intent
    INTENT_RECOGNITION_AVAILABLE = True
except ImportError:
    print("⚠️ Sistema de reconhecimento de intenções não disponível")
    INTENT_RECOGNITION_AVAILABLE = False

ai_enhanced_bp = Blueprint('ai_enhanced', __name__)

class AIAssistant:
    """Classe principal do assistente IA LUA"""
    
    @staticmethod
    def extract_amount(text):
        """Extrai valor monetário do texto"""
        pattern = r'(?:R\$)?\s*(\d+(?:[.,]\d{1,2})?)'
        match = re.search(pattern, text, re.IGNORECASE)
        if match:
            value = match.group(1).replace(',', '.')
            return float(value)
        return None
    
    @staticmethod
    def extract_name(text, prefix_words=['para', 'de', 'do', 'da']):
        """Extrai nome de pessoa do texto"""
        # Tentar padrões mais flexíveis
        patterns = [
            # "para Darvin", "de Josemir"
            r'(?:para|de|do|da)\s+([A-Za-zÀ-ÿ]+(?:\s+[A-Za-zÀ-ÿ]+)?)',
            # "Darvin receber", "dar para Darvin"
            r'([A-Za-zÀ-ÿ]+(?:\s+[A-Za-zÀ-ÿ]+)?)\s+(?:receber|ganhar)',
            # No final da frase
            r'(?:para|de|do|da)\s+([A-Za-zÀ-ÿ]+(?:\s+[A-Za-zÀ-ÿ]+)?)$',
            # Sem preposição, pegar primeiro nome próprio
            r'\b([A-Z][a-zÀ-ÿ]+(?:\s+[A-Z][a-zÀ-ÿ]+)?)\b'
        ]
        
        for pattern in patterns:
            match = re.search(pattern, text, re.IGNORECASE)
            if match:
                name = match.group(1).strip()
                # Filtrar palavras comuns que não são nomes
                exclude_words = ['vale', 'reais', 'real', 'dinheiro', 'criar', 'fazer', 'dar', 'pagar']
                if name.lower() not in exclude_words and len(name) > 2:
                    return name
        
        return None
    
    @staticmethod
    def find_employee_by_name(name_input):
        """
        Encontra funcionário usando busca inteligente com correção de nomes
        """
        if not name_input:
            return None
        
        name_normalized = name_input.lower().strip()
        
        # Dicionário de correções de nomes conhecidos
        name_corrections = {
            'darwin': 'darvin',
            'darvim': 'darvin', 
            'darwim': 'darvin',
            'antônio': 'antonio',
            'antônio darvin': 'antonio darvin',
            'maria lúcia': 'maria lucia',
            'maria lucia': 'maria lucia',
            'lúcia': 'lucia',
            'rabelo': 'antonio rabelo'
        }
        
        # Aplicar correções conhecidas
        corrected_name = name_corrections.get(name_normalized, name_normalized)
        
        # Buscar por nome exato primeiro
        employee = Employee.query.filter(
            func.lower(Employee.name) == corrected_name
        ).first()
        
        if employee:
            return employee
        
        # Buscar por nome parcial (contém)
        employee = Employee.query.filter(
            func.lower(Employee.name).like(f'%{corrected_name}%')
        ).first()
        
        if employee:
            return employee
        
        # Buscar por partes do nome
        name_parts = corrected_name.split()
        for part in name_parts:
            if len(part) > 2:  # Evitar partes muito pequenas
                employee = Employee.query.filter(
                    func.lower(Employee.name).like(f'%{part}%')
                ).first()
                if employee:
                    return employee
        
        # Se ainda não encontrou, buscar por similaridade
        all_employees = Employee.query.filter(Employee.active == True).all()
        best_match = None
        best_score = 0
        
        for emp in all_employees:
            emp_name_lower = emp.name.lower()
            
            # Cálculo simples de similaridade
            score = AIAssistant.calculate_name_similarity(corrected_name, emp_name_lower)
            
            if score > best_score and score > 0.6:  # Threshold de 60% de similaridade
                best_score = score
                best_match = emp
        
        return best_match
    
    @staticmethod
    def calculate_name_similarity(name1, name2):
        """
        Calcula similaridade entre dois nomes (versão simplificada do Levenshtein)
        """
        if name1 == name2:
            return 1.0
        
        # Verificar se um nome contém o outro
        if name1 in name2 or name2 in name1:
            return 0.8
        
        # Verificar partes dos nomes
        parts1 = set(name1.split())
        parts2 = set(name2.split())
        
        if parts1 & parts2:  # Se há intersecção
            return len(parts1 & parts2) / max(len(parts1), len(parts2))
        
        # Similaridade básica por caracteres
        common_chars = len(set(name1) & set(name2))
        max_chars = max(len(set(name1)), len(set(name2)))
        
        return common_chars / max_chars if max_chars > 0 else 0
    
    @staticmethod
    def extract_date(text):
        """Extrai ou interpreta data do texto"""
        text_lower = text.lower()
        
        if 'hoje' in text_lower:
            return datetime.now().date()
        elif 'ontem' in text_lower:
            return (datetime.now() - timedelta(days=1)).date()
        elif 'amanhã' in text_lower or 'amanha' in text_lower:
            return (datetime.now() + timedelta(days=1)).date()
        elif 'semana passada' in text_lower:
            return (datetime.now() - timedelta(weeks=1)).date()
        elif 'próxima semana' in text_lower or 'proxima semana' in text_lower:
            return (datetime.now() + timedelta(weeks=1)).date()
        elif 'mês passado' in text_lower or 'mes passado' in text_lower:
            return (datetime.now() - timedelta(days=30)).date()
        
        # Tentar extrair data no formato DD/MM/AAAA
        pattern = r'(\d{1,2})[/\-](\d{1,2})[/\-](\d{2,4})'
        match = re.search(pattern, text)
        if match:
            day, month, year = match.groups()
            if len(year) == 2:
                year = '20' + year
            try:
                return datetime(int(year), int(month), int(day)).date()
            except:
                pass
        
        return None

@ai_enhanced_bp.route('/lua', methods=['POST'])
def process_lua_command():
    """Processa comandos da IA LUA com funcionalidades completas e consciência"""
    try:
        data = request.get_json()
        command = data.get('message', '').strip()
        context = data.get('context', {})
        generate_voice = data.get('voice', True)  # Por padrão, gera voz
        
        if not command:
            return jsonify({
                'success': False,
                'message': 'Comando vazio. Por favor, diga algo.'
            }), 400
        
        command_lower = command.lower()
        ai = AIAssistant()
        
        # Se consciência está disponível, processar com personalidade
        if LUA_CONSCIOUSNESS_AVAILABLE:
            # Obter resposta com consciência
            consciousness_response, consciousness_metadata = get_lua_response(command, context)
            
            # Processar comando de negócio
            business_response = process_command_type(command, command_lower, ai)
            
            # Combinar resposta de consciência com dados de negócio
            if business_response.get('success'):
                # Adicionar personalidade à resposta de negócio
                final_message = f"{consciousness_response}\n\n{business_response.get('message', '')}"
                
                # Se deve gerar voz
                audio_data = None
                if generate_voice:
                    try:
                        emotion = consciousness_metadata.get('emotion', 'confident')
                        audio_path = generate_lua_voice(final_message, emotion)
                        if audio_path:
                            # Converter para base64 para enviar ao frontend
                            import base64
                            with open(audio_path, 'rb') as audio_file:
                                audio_data = base64.b64encode(audio_file.read()).decode('utf-8')
                    except Exception as e:
                        print(f"Erro ao gerar voz: {str(e)}")
                
                response = {
                    **business_response,
                    'message': final_message,
                    'consciousness': consciousness_metadata,
                    'audio': audio_data,
                    'has_voice': audio_data is not None
                }
            else:
                response = business_response
                response['consciousness'] = consciousness_metadata
        else:
            # Processar sem consciência (modo tradicional)
            response = process_command_type(command, command_lower, ai)
        
        return jsonify(response)
        
    except Exception as e:
        print(f"Erro no processamento da IA: {str(e)}")
        import traceback
        traceback.print_exc()
        return jsonify({
            'success': False,
            'message': 'Ocorreu um erro ao processar seu comando. Por favor, tente novamente.',
            'error': str(e)
        }), 500

def process_command_type(command, command_lower, ai):
    """Determina o tipo de comando e processa adequadamente"""
    
    # Comandos de CRIAÇÃO
    if any(word in command_lower for word in ['criar', 'cadastrar', 'novo', 'nova', 'adicionar']):
        return process_create_command(command, command_lower, ai)
    
    # Comandos de BUSCA/LISTAGEM
    elif any(word in command_lower for word in ['buscar', 'procurar', 'listar', 'mostrar', 'ver', 'consultar']):
        return process_search_command(command, command_lower, ai)
    
    # Comandos de RELATÓRIO
    elif any(word in command_lower for word in ['relatório', 'relatorio', 'resumo', 'estatística', 'analise']):
        return process_report_command(command, command_lower, ai)
    
    # Comandos de AÇÃO (aprovar, pagar, cancelar, etc)
    elif any(word in command_lower for word in ['aprovar', 'pagar', 'cancelar', 'confirmar', 'finalizar']):
        return process_action_command(command, command_lower, ai)
    
    # Comandos de CAIXA/FINANCEIRO
    elif any(word in command_lower for word in ['caixa', 'saldo', 'receita', 'despesa', 'lucro']):
        return process_financial_command(command, command_lower, ai)
    
    # Comandos de ESTOQUE
    elif any(word in command_lower for word in ['estoque', 'quantidade', 'disponível', 'falta']):
        return process_inventory_command(command, command_lower, ai)
    
    # Comando não reconhecido - tentar interpretar contexto
    else:
        return process_general_command(command, command_lower, ai)

def process_create_command(command, command_lower, ai):
    """Processa comandos de criação"""
    
    # Criar VALE
    if 'vale' in command_lower:
        employee_name = ai.extract_name(command)
        amount = ai.extract_amount(command)
        
        if not employee_name:
            return {
                'success': False,
                'message': 'Para criar um vale, preciso saber o nome do funcionário. Por exemplo: "Criar vale de 200 para Josemir"',
                'action': 'request_info',
                'required_fields': ['employee_name', 'amount']
            }
        
        if not amount:
            return {
                'success': False,
                'message': f'Qual o valor do vale para {employee_name}?',
                'action': 'request_info',
                'required_fields': ['amount']
            }
        
        # Buscar funcionário usando busca inteligente
        employee = ai.find_employee_by_name(employee_name)
        
        if not employee:
            # Buscar funcionários similares para sugestões
            all_employees = Employee.query.filter(Employee.active == True).all()
            suggestions = []
            
            for emp in all_employees:
                similarity = ai.calculate_name_similarity(employee_name.lower(), emp.name.lower())
                if similarity > 0.3:  # 30% de similaridade para sugestões
                    suggestions.append(emp.name)
            
            return {
                'success': False,
                'message': f'Funcionário "{employee_name}" não encontrado. Você quis dizer um destes?',
                'suggestions': suggestions[:5] if suggestions else [emp.name for emp in all_employees[:5]],
                'correction_needed': True
            }
        
        # Determinar motivo do vale
        reason = 'Vale solicitado via IA'
        if 'almoço' in command_lower or 'almoco' in command_lower:
            reason = 'Vale almoço'
        elif 'transporte' in command_lower:
            reason = 'Vale transporte'
        elif 'emergência' in command_lower or 'emergencia' in command_lower:
            reason = 'Vale emergencial'
        elif 'adiantamento' in command_lower:
            reason = 'Adiantamento salarial'
        
        # Criar o vale
        try:
            vale = Vale(
                employee_id=employee.id,
                amount=amount,
                reason=reason,
                status='pending',
                created_at=datetime.now()
            )
            db.session.add(vale)
            db.session.commit()
            
            return {
                'success': True,
                'message': f'Vale criado com sucesso! {employee.name} receberá R$ {amount:.2f}. Motivo: {reason}',
                'action': 'created',
                'module': 'vales',
                'data': {
                    'vale_id': vale.id,
                    'employee': employee.name,
                    'amount': amount,
                    'reason': reason,
                    'status': 'pending'
                }
            }
        except Exception as e:
            db.session.rollback()
            return {
                'success': False,
                'message': f'Erro ao criar vale: {str(e)}'
            }
    
    # Criar CLIENTE
    elif 'cliente' in command_lower:
        # Extrair informações do comando se disponíveis
        name = ai.extract_name(command, ['cliente', 'chamado', 'chamada', 'nome'])
        
        if name:
            # Verificar se já existe
            existing = Customer.query.filter(
                Customer.name.ilike(f'%{name}%')
            ).first()
            
            if existing:
                return {
                    'success': False,
                    'message': f'Cliente "{existing.name}" já cadastrado.',
                    'action': 'exists',
                    'module': 'clientes',
                    'data': {'customer_id': existing.id}
                }
            
            return {
                'success': True,
                'message': f'Vou abrir o formulário de cadastro para o cliente "{name}".',
                'action': 'open_form',
                'module': 'clientes',
                'data': {'pre_fill': {'name': name}}
            }
        else:
            return {
                'success': True,
                'message': 'Abrindo formulário de cadastro de cliente.',
                'action': 'open_form',
                'module': 'clientes',
                'data': {'action': 'create'}
            }
    
    # Criar ENCOMENDA
    elif 'encomenda' in command_lower or 'pedido' in command_lower:
        customer_name = ai.extract_name(command, ['para', 'cliente', 'do', 'da'])
        
        if customer_name:
            customer = Customer.query.filter(
                Customer.name.ilike(f'%{customer_name}%')
            ).first()
            
            if customer:
                return {
                    'success': True,
                    'message': f'Criando nova encomenda para {customer.name}.',
                    'action': 'open_form',
                    'module': 'encomendas',
                    'data': {'customer_id': customer.id, 'customer_name': customer.name}
                }
            else:
                return {
                    'success': False,
                    'message': f'Cliente "{customer_name}" não encontrado. Deseja cadastrá-lo primeiro?',
                    'action': 'suggest',
                    'module': 'clientes',
                    'data': {'suggested_name': customer_name}
                }
        else:
            return {
                'success': True,
                'message': 'Abrindo formulário de nova encomenda.',
                'action': 'open_form',
                'module': 'encomendas',
                'data': {'action': 'create'}
            }
    
    # Criar FUNCIONÁRIO
    elif 'funcionário' in command_lower or 'funcionario' in command_lower:
        name = ai.extract_name(command, ['funcionário', 'funcionario', 'chamado', 'nome'])
        
        return {
            'success': True,
            'message': f'Abrindo formulário de cadastro de funcionário{f" para {name}" if name else ""}.',
            'action': 'open_form',
            'module': 'funcionarios',
            'data': {'action': 'create', 'pre_fill': {'name': name} if name else {}}
        }
    
    # Criar NOTA
    elif 'nota' in command_lower or 'anotação' in command_lower:
        # Extrair conteúdo da nota
        content = command.replace('criar nota', '').replace('criar anotação', '').strip()
        
        if content:
            try:
                nota = Nota(
                    title='Nota via IA',
                    content=content,
                    created_at=datetime.now()
                )
                db.session.add(nota)
                db.session.commit()
                
                return {
                    'success': True,
                    'message': 'Nota criada com sucesso!',
                    'action': 'created',
                    'module': 'notas',
                    'data': {'nota_id': nota.id, 'content': content}
                }
            except Exception as e:
                db.session.rollback()
                return {
                    'success': False,
                    'message': f'Erro ao criar nota: {str(e)}'
                }
        else:
            return {
                'success': True,
                'message': 'Abrindo sistema de notas para criar nova anotação.',
                'action': 'open_form',
                'module': 'notas',
                'data': {'action': 'create'}
            }
    
    return {
        'success': False,
        'message': 'Não entendi o que deseja criar. Posso criar: vales, clientes, funcionários, encomendas ou notas.'
    }

def process_search_command(command, command_lower, ai):
    """Processa comandos de busca e listagem"""
    
    # Buscar VALES
    if 'vale' in command_lower:
        employee_name = ai.extract_name(command)
        
        query = Vale.query.join(Employee)
        
        if employee_name:
            query = query.filter(Employee.name.ilike(f'%{employee_name}%'))
        
        # Filtros de status
        if 'pendente' in command_lower:
            query = query.filter(Vale.status == 'pending')
        elif 'aprovado' in command_lower:
            query = query.filter(Vale.status == 'approved')
        elif 'pago' in command_lower:
            query = query.filter(Vale.status == 'paid')
        
        vales = query.all()
        
        if vales:
            total = sum(v.amount for v in vales)
            message = f'Encontrei {len(vales)} vale(s)'
            
            if employee_name:
                message += f' para {employee_name}'
            
            message += f', totalizando R$ {total:.2f}.\n\n'
            
            # Listar alguns vales
            for vale in vales[:5]:
                employee = Employee.query.get(vale.employee_id)
                message += f'• {employee.name if employee else "Desconhecido"}: R$ {vale.amount:.2f} - {vale.reason} ({vale.status})\n'
            
            if len(vales) > 5:
                message += f'\n... e mais {len(vales) - 5} vales.'
            
            return {
                'success': True,
                'message': message,
                'action': 'list',
                'module': 'vales',
                'data': {
                    'count': len(vales),
                    'total': total,
                    'filters': {'employee': employee_name} if employee_name else {}
                }
            }
        else:
            return {
                'success': True,
                'message': f'Não encontrei vales{f" para {employee_name}" if employee_name else ""}.',
                'data': {'count': 0}
            }
    
    # Buscar CLIENTES
    elif 'cliente' in command_lower:
        name = ai.extract_name(command, ['cliente', 'chamado', 'chamada'])
        
        query = Customer.query
        
        if name:
            query = query.filter(Customer.name.ilike(f'%{name}%'))
        
        customers = query.all()
        
        if customers:
            message = f'Encontrei {len(customers)} cliente(s)'
            
            if name:
                message += f' com nome similar a "{name}"'
            
            message += ':\n\n'
            
            for customer in customers[:10]:
                message += f'• {customer.name} - {customer.phone or "Sem telefone"}\n'
            
            if len(customers) > 10:
                message += f'\n... e mais {len(customers) - 10} clientes.'
            
            return {
                'success': True,
                'message': message,
                'action': 'list',
                'module': 'clientes',
                'data': {
                    'count': len(customers),
                    'search': name if name else None
                }
            }
        else:
            return {
                'success': True,
                'message': f'Não encontrei clientes{f" com nome {name}" if name else ""}.',
                'data': {'count': 0}
            }
    
    # Buscar ENCOMENDAS
    elif 'encomenda' in command_lower or 'pedido' in command_lower:
        date = ai.extract_date(command)
        customer_name = ai.extract_name(command, ['para', 'do', 'da', 'cliente'])
        
        query = Order.query
        
        if customer_name:
            query = query.join(Customer).filter(Customer.name.ilike(f'%{customer_name}%'))
        
        if date:
            query = query.filter(func.date(Order.created_at) == date)
        elif 'hoje' in command_lower:
            query = query.filter(func.date(Order.created_at) == datetime.now().date())
        elif 'semana' in command_lower:
            week_ago = datetime.now() - timedelta(days=7)
            query = query.filter(Order.created_at >= week_ago)
        elif 'mês' in command_lower or 'mes' in command_lower:
            month_ago = datetime.now() - timedelta(days=30)
            query = query.filter(Order.created_at >= month_ago)
        
        # Filtros de status
        if 'pendente' in command_lower:
            query = query.filter(Order.status == 'pending')
        elif 'confirmad' in command_lower:
            query = query.filter(Order.status == 'confirmed')
        elif 'entregu' in command_lower:
            query = query.filter(Order.status == 'delivered')
        
        orders = query.all()
        
        if orders:
            total = sum(o.total_price for o in orders if o.total_price)
            message = f'Encontrei {len(orders)} encomenda(s)'
            
            if customer_name:
                message += f' de {customer_name}'
            if date:
                message += f' em {date.strftime("%d/%m/%Y")}'
            
            message += f', totalizando R$ {total:.2f}.\n\n'
            
            for order in orders[:5]:
                customer = Customer.query.get(order.customer_id) if order.customer_id else None
                message += f'• Pedido #{order.id}: {customer.name if customer else "Cliente não identificado"} - R$ {order.total_price:.2f} ({order.status})\n'
            
            if len(orders) > 5:
                message += f'\n... e mais {len(orders) - 5} encomendas.'
            
            return {
                'success': True,
                'message': message,
                'action': 'list',
                'module': 'encomendas',
                'data': {
                    'count': len(orders),
                    'total': total,
                    'filters': {}
                }
            }
        else:
            return {
                'success': True,
                'message': 'Não encontrei encomendas com os critérios especificados.',
                'data': {'count': 0}
            }
    
    # Buscar FUNCIONÁRIOS
    elif 'funcionário' in command_lower or 'funcionario' in command_lower:
        employees = Employee.query.all()
        
        if employees:
            total_salary = sum(e.salary for e in employees if e.salary)
            message = f'Temos {len(employees)} funcionário(s) cadastrado(s):\n\n'
            
            for emp in employees:
                message += f'• {emp.name} - {emp.role} (Salário: R$ {emp.salary:.2f})\n'
            
            message += f'\n📊 Total em salários: R$ {total_salary:.2f}'
            
            return {
                'success': True,
                'message': message,
                'action': 'list',
                'module': 'funcionarios',
                'data': {
                    'count': len(employees),
                    'total_salary': total_salary
                }
            }
        else:
            return {
                'success': True,
                'message': 'Não há funcionários cadastrados.',
                'data': {'count': 0}
            }
    
    # Buscar JOIAS
    elif 'joia' in command_lower or 'joias' in command_lower:
        query = Jewelry.query
        
        # Filtros de categoria
        if 'anel' in command_lower or 'anéis' in command_lower:
            query = query.filter(Jewelry.category == 'Anéis')
        elif 'colar' in command_lower:
            query = query.filter(Jewelry.category == 'Colares')
        elif 'brinco' in command_lower:
            query = query.filter(Jewelry.category == 'Brincos')
        elif 'pulseira' in command_lower:
            query = query.filter(Jewelry.category == 'Pulseiras')
        
        jewelry = query.all()
        
        if jewelry:
            message = f'Encontrei {len(jewelry)} joia(s) no catálogo:\n\n'
            
            for item in jewelry[:10]:
                message += f'• {item.name} - {item.category} (R$ {item.price:.2f if item.price else "Sob consulta"})\n'
            
            if len(jewelry) > 10:
                message += f'\n... e mais {len(jewelry) - 10} joias.'
            
            return {
                'success': True,
                'message': message,
                'action': 'list',
                'module': 'joias',
                'data': {'count': len(jewelry)}
            }
        else:
            return {
                'success': True,
                'message': 'Não encontrei joias com os critérios especificados.',
                'data': {'count': 0}
            }
    
    return {
        'success': False,
        'message': 'Não entendi o que deseja buscar. Posso buscar: vales, clientes, encomendas, funcionários ou joias.'
    }

def process_report_command(command, command_lower, ai):
    """Processa comandos de relatório"""
    
    # Relatório de VENDAS
    if 'venda' in command_lower:
        date = ai.extract_date(command)
        
        query = Order.query.filter(Order.status.in_(['confirmed', 'delivered']))
        
        if date:
            query = query.filter(func.date(Order.created_at) == date)
        elif 'hoje' in command_lower:
            query = query.filter(func.date(Order.created_at) == datetime.now().date())
        elif 'ontem' in command_lower:
            yesterday = datetime.now() - timedelta(days=1)
            query = query.filter(func.date(Order.created_at) == yesterday.date())
        elif 'semana' in command_lower:
            week_ago = datetime.now() - timedelta(days=7)
            query = query.filter(Order.created_at >= week_ago)
        elif 'mês' in command_lower or 'mes' in command_lower:
            month_ago = datetime.now() - timedelta(days=30)
            query = query.filter(Order.created_at >= month_ago)
        else:
            # Por padrão, relatório do dia
            query = query.filter(func.date(Order.created_at) == datetime.now().date())
        
        orders = query.all()
        
        if orders:
            total = sum(o.total_price for o in orders if o.total_price)
            avg = total / len(orders) if orders else 0
            
            # Produtos mais vendidos
            product_count = {}
            for order in orders:
                # Aqui você precisaria acessar os itens do pedido
                # Assumindo que há uma relação order.items
                pass
            
            message = f'📊 RELATÓRIO DE VENDAS\n'
            message += f'{"=" * 40}\n'
            message += f'📅 Período: {date.strftime("%d/%m/%Y") if date else "Hoje"}\n'
            message += f'📦 Total de vendas: {len(orders)}\n'
            message += f'💰 Valor total: R$ {total:.2f}\n'
            message += f'📈 Ticket médio: R$ {avg:.2f}\n'
            
            return {
                'success': True,
                'message': message,
                'action': 'report',
                'module': 'dashboard',
                'data': {
                    'type': 'sales',
                    'count': len(orders),
                    'total': total,
                    'average': avg
                }
            }
        else:
            return {
                'success': True,
                'message': 'Não há vendas no período especificado.',
                'data': {'count': 0, 'total': 0}
            }
    
    # Relatório FINANCEIRO
    elif 'financeiro' in command_lower or 'caixa' in command_lower:
        date = ai.extract_date(command) or datetime.now().date()
        
        # Buscar transações do caixa
        transactions = CaixaTransaction.query.filter(
            func.date(CaixaTransaction.created_at) == date
        ).all()
        
        entradas = sum(t.amount for t in transactions if t.type == 'entrada')
        saidas = sum(t.amount for t in transactions if t.type == 'saida')
        saldo = entradas - saidas
        
        message = f'💰 RELATÓRIO FINANCEIRO\n'
        message += f'{"=" * 40}\n'
        message += f'📅 Data: {date.strftime("%d/%m/%Y")}\n'
        message += f'✅ Entradas: R$ {entradas:.2f}\n'
        message += f'❌ Saídas: R$ {saidas:.2f}\n'
        message += f'💵 Saldo: R$ {saldo:.2f}\n'
        message += f'📊 Total de transações: {len(transactions)}\n'
        
        return {
            'success': True,
            'message': message,
            'action': 'report',
            'module': 'caixa',
            'data': {
                'date': date.isoformat(),
                'entradas': entradas,
                'saidas': saidas,
                'saldo': saldo,
                'transactions': len(transactions)
            }
        }
    
    # Relatório de ESTOQUE
    elif 'estoque' in command_lower:
        inventory = Inventory.query.all()
        
        low_stock = [i for i in inventory if i.quantity <= i.min_quantity]
        out_of_stock = [i for i in inventory if i.quantity == 0]
        
        message = f'📦 RELATÓRIO DE ESTOQUE\n'
        message += f'{"=" * 40}\n'
        message += f'📊 Total de itens: {len(inventory)}\n'
        message += f'⚠️ Estoque baixo: {len(low_stock)} itens\n'
        message += f'❌ Sem estoque: {len(out_of_stock)} itens\n\n'
        
        if low_stock:
            message += 'ITENS COM ESTOQUE BAIXO:\n'
            for item in low_stock[:5]:
                message += f'• {item.name}: {item.quantity} unidades (mínimo: {item.min_quantity})\n'
        
        return {
            'success': True,
            'message': message,
            'action': 'report',
            'module': 'estoque',
            'data': {
                'total_items': len(inventory),
                'low_stock': len(low_stock),
                'out_of_stock': len(out_of_stock)
            }
        }
    
    # Relatório de FUNCIONÁRIOS/FOLHA
    elif 'funcionário' in command_lower or 'folha' in command_lower:
        employees = Employee.query.all()
        vales = Vale.query.filter(Vale.status != 'paid').all()
        
        total_salaries = sum(e.salary for e in employees if e.salary)
        total_vales = sum(v.amount for v in vales)
        total_folha = total_salaries - total_vales
        
        message = f'👥 RELATÓRIO DE FOLHA DE PAGAMENTO\n'
        message += f'{"=" * 40}\n'
        message += f'👷 Total de funcionários: {len(employees)}\n'
        message += f'💵 Total em salários: R$ {total_salaries:.2f}\n'
        message += f'📝 Total em vales: R$ {total_vales:.2f}\n'
        message += f'💰 Total líquido: R$ {total_folha:.2f}\n'
        
        return {
            'success': True,
            'message': message,
            'action': 'report',
            'module': 'folha-pagamento',
            'data': {
                'employees': len(employees),
                'total_salaries': total_salaries,
                'total_vales': total_vales,
                'total_net': total_folha
            }
        }
    
    return {
        'success': False,
        'message': 'Posso gerar relatórios de: vendas, financeiro, estoque ou folha de pagamento.'
    }

def process_action_command(command, command_lower, ai):
    """Processa comandos de ação (aprovar, pagar, cancelar, etc)"""
    
    # APROVAR vale
    if 'aprovar' in command_lower and 'vale' in command_lower:
        employee_name = ai.extract_name(command)
        
        query = Vale.query.filter(Vale.status == 'pending')
        
        if employee_name:
            employee = Employee.query.filter(
                Employee.name.ilike(f'%{employee_name}%')
            ).first()
            
            if employee:
                query = query.filter(Vale.employee_id == employee.id)
        
        vales = query.all()
        
        if vales:
            for vale in vales:
                vale.status = 'approved'
            
            db.session.commit()
            
            total = sum(v.amount for v in vales)
            message = f'✅ {len(vales)} vale(s) aprovado(s) com sucesso!'
            
            if employee_name:
                message += f' para {employee_name}'
            
            message += f'\nTotal aprovado: R$ {total:.2f}'
            
            return {
                'success': True,
                'message': message,
                'action': 'approved',
                'module': 'vales',
                'data': {
                    'count': len(vales),
                    'total': total
                }
            }
        else:
            return {
                'success': False,
                'message': 'Não encontrei vales pendentes para aprovar.'
            }
    
    # PAGAR vale
    elif 'pagar' in command_lower and 'vale' in command_lower:
        employee_name = ai.extract_name(command)
        
        query = Vale.query.filter(Vale.status == 'approved')
        
        if employee_name:
            employee = Employee.query.filter(
                Employee.name.ilike(f'%{employee_name}%')
            ).first()
            
            if employee:
                query = query.filter(Vale.employee_id == employee.id)
        
        vales = query.all()
        
        if vales:
            for vale in vales:
                vale.status = 'paid'
                vale.paid_at = datetime.now()
                
                # Registrar no caixa
                transaction = CaixaTransaction(
                    type='saida',
                    amount=vale.amount,
                    description=f'Pagamento de vale - {Employee.query.get(vale.employee_id).name}',
                    category_id=1,  # Assumindo categoria de vale
                    created_at=datetime.now()
                )
                db.session.add(transaction)
            
            db.session.commit()
            
            total = sum(v.amount for v in vales)
            message = f'💰 {len(vales)} vale(s) pago(s) com sucesso!'
            
            if employee_name:
                message += f' para {employee_name}'
            
            message += f'\nTotal pago: R$ {total:.2f}'
            
            return {
                'success': True,
                'message': message,
                'action': 'paid',
                'module': 'vales',
                'data': {
                    'count': len(vales),
                    'total': total
                }
            }
        else:
            return {
                'success': False,
                'message': 'Não encontrei vales aprovados para pagar.'
            }
    
    # CANCELAR
    elif 'cancelar' in command_lower:
        if 'vale' in command_lower:
            # Implementar cancelamento de vale
            pass
        elif 'encomenda' in command_lower or 'pedido' in command_lower:
            # Implementar cancelamento de encomenda
            pass
    
    # CONFIRMAR encomenda
    elif 'confirmar' in command_lower and ('encomenda' in command_lower or 'pedido' in command_lower):
        orders = Order.query.filter(Order.status == 'pending').all()
        
        if orders:
            for order in orders:
                order.status = 'confirmed'
            
            db.session.commit()
            
            return {
                'success': True,
                'message': f'✅ {len(orders)} encomenda(s) confirmada(s) com sucesso!',
                'action': 'confirmed',
                'module': 'encomendas',
                'data': {'count': len(orders)}
            }
        else:
            return {
                'success': False,
                'message': 'Não há encomendas pendentes para confirmar.'
            }
    
    return {
        'success': False,
        'message': 'Ação não reconhecida. Posso: aprovar vales, pagar vales, confirmar encomendas ou cancelar operações.'
    }

def process_financial_command(command, command_lower, ai):
    """Processa comandos financeiros e de caixa"""
    
    # Consultar SALDO
    if 'saldo' in command_lower:
        date = ai.extract_date(command) or datetime.now().date()
        
        # Calcular saldo
        transactions = CaixaTransaction.query.filter(
            func.date(CaixaTransaction.created_at) <= date
        ).all()
        
        entradas = sum(t.amount for t in transactions if t.type == 'entrada')
        saidas = sum(t.amount for t in transactions if t.type == 'saida')
        saldo = entradas - saidas
        
        # Transações do dia
        today_transactions = [t for t in transactions if t.created_at.date() == date]
        today_entradas = sum(t.amount for t in today_transactions if t.type == 'entrada')
        today_saidas = sum(t.amount for t in today_transactions if t.type == 'saida')
        
        message = f'💰 SALDO DO CAIXA\n'
        message += f'{"=" * 40}\n'
        message += f'📅 Data: {date.strftime("%d/%m/%Y")}\n'
        message += f'💵 Saldo total: R$ {saldo:.2f}\n\n'
        message += f'MOVIMENTO DO DIA:\n'
        message += f'✅ Entradas: R$ {today_entradas:.2f}\n'
        message += f'❌ Saídas: R$ {today_saidas:.2f}\n'
        message += f'📊 Saldo do dia: R$ {today_entradas - today_saidas:.2f}'
        
        return {
            'success': True,
            'message': message,
            'action': 'balance',
            'module': 'caixa',
            'data': {
                'date': date.isoformat(),
                'total_balance': saldo,
                'today_in': today_entradas,
                'today_out': today_saidas,
                'today_balance': today_entradas - today_saidas
            }
        }
    
    # Registrar ENTRADA
    elif 'entrada' in command_lower or 'receita' in command_lower:
        amount = ai.extract_amount(command)
        
        if amount:
            description = 'Entrada registrada via IA'
            if 'venda' in command_lower:
                description = 'Venda de produtos'
            elif 'serviço' in command_lower or 'servico' in command_lower:
                description = 'Prestação de serviço'
            
            try:
                transaction = CaixaTransaction(
                    type='entrada',
                    amount=amount,
                    description=description,
                    category_id=1,  # Categoria padrão
                    created_at=datetime.now()
                )
                db.session.add(transaction)
                db.session.commit()
                
                return {
                    'success': True,
                    'message': f'✅ Entrada de R$ {amount:.2f} registrada com sucesso!\nDescrição: {description}',
                    'action': 'registered',
                    'module': 'caixa',
                    'data': {
                        'type': 'entrada',
                        'amount': amount,
                        'description': description
                    }
                }
            except Exception as e:
                db.session.rollback()
                return {
                    'success': False,
                    'message': f'Erro ao registrar entrada: {str(e)}'
                }
        else:
            return {
                'success': False,
                'message': 'Qual o valor da entrada que deseja registrar?',
                'action': 'request_info',
                'required_fields': ['amount']
            }
    
    # Registrar SAÍDA/DESPESA
    elif 'saída' in command_lower or 'saida' in command_lower or 'despesa' in command_lower:
        amount = ai.extract_amount(command)
        
        if amount:
            description = 'Despesa registrada via IA'
            if 'fornecedor' in command_lower:
                description = 'Pagamento a fornecedor'
            elif 'conta' in command_lower:
                description = 'Pagamento de conta'
            elif 'material' in command_lower or 'materiais' in command_lower:
                description = 'Compra de materiais'
            
            try:
                transaction = CaixaTransaction(
                    type='saida',
                    amount=amount,
                    description=description,
                    category_id=2,  # Categoria padrão para saídas
                    created_at=datetime.now()
                )
                db.session.add(transaction)
                db.session.commit()
                
                return {
                    'success': True,
                    'message': f'❌ Saída de R$ {amount:.2f} registrada com sucesso!\nDescrição: {description}',
                    'action': 'registered',
                    'module': 'caixa',
                    'data': {
                        'type': 'saida',
                        'amount': amount,
                        'description': description
                    }
                }
            except Exception as e:
                db.session.rollback()
                return {
                    'success': False,
                    'message': f'Erro ao registrar saída: {str(e)}'
                }
        else:
            return {
                'success': False,
                'message': 'Qual o valor da saída/despesa que deseja registrar?',
                'action': 'request_info',
                'required_fields': ['amount']
            }
    
    # Calcular LUCRO
    elif 'lucro' in command_lower:
        date = ai.extract_date(command)
        
        if date:
            start_date = date
            end_date = date
        elif 'hoje' in command_lower:
            start_date = end_date = datetime.now().date()
        elif 'semana' in command_lower:
            end_date = datetime.now().date()
            start_date = end_date - timedelta(days=7)
        elif 'mês' in command_lower or 'mes' in command_lower:
            end_date = datetime.now().date()
            start_date = end_date - timedelta(days=30)
        else:
            start_date = end_date = datetime.now().date()
        
        # Buscar custos e receitas
        costs = Cost.query.filter(
            and_(
                func.date(Cost.created_at) >= start_date,
                func.date(Cost.created_at) <= end_date
            )
        ).all()
        
        profits = Profit.query.filter(
            and_(
                func.date(Profit.created_at) >= start_date,
                func.date(Profit.created_at) <= end_date
            )
        ).all()
        
        total_costs = sum(c.amount for c in costs if c.amount)
        total_revenue = sum(p.amount for p in profits if p.amount)
        lucro = total_revenue - total_costs
        margin = (lucro / total_revenue * 100) if total_revenue > 0 else 0
        
        message = f'📊 ANÁLISE DE LUCRO\n'
        message += f'{"=" * 40}\n'
        message += f'📅 Período: {start_date.strftime("%d/%m")} a {end_date.strftime("%d/%m/%Y")}\n'
        message += f'✅ Receita: R$ {total_revenue:.2f}\n'
        message += f'❌ Custos: R$ {total_costs:.2f}\n'
        message += f'💰 Lucro: R$ {lucro:.2f}\n'
        message += f'📈 Margem: {margin:.1f}%'
        
        return {
            'success': True,
            'message': message,
            'action': 'profit_analysis',
            'module': 'custos',
            'data': {
                'period': {'start': start_date.isoformat(), 'end': end_date.isoformat()},
                'revenue': total_revenue,
                'costs': total_costs,
                'profit': lucro,
                'margin': margin
            }
        }
    
    return {
        'success': False,
        'message': 'Posso ajudar com: consultar saldo, registrar entradas/saídas ou calcular lucros.'
    }

def process_inventory_command(command, command_lower, ai):
    """Processa comandos relacionados ao estoque"""
    
    # Verificar estoque
    if any(word in command_lower for word in ['quanto', 'quantos', 'quantidade']):
        # Extrair nome do item
        item_name = None
        for word in command.split():
            if len(word) > 3 and word.lower() not in ['quanto', 'quantos', 'quantidade', 'temos', 'tenho', 'estoque']:
                item_name = word
                break
        
        if item_name:
            items = Inventory.query.filter(
                Inventory.name.ilike(f'%{item_name}%')
            ).all()
            
            if items:
                message = f'📦 ESTOQUE - {item_name.upper()}\n'
                message += f'{"=" * 40}\n'
                
                for item in items:
                    status = '✅ Normal' if item.quantity > item.min_quantity else '⚠️ Baixo' if item.quantity > 0 else '❌ Esgotado'
                    message += f'{item.name}:\n'
                    message += f'  Quantidade: {item.quantity} unidades\n'
                    message += f'  Mínimo: {item.min_quantity} unidades\n'
                    message += f'  Status: {status}\n\n'
                
                return {
                    'success': True,
                    'message': message,
                    'action': 'stock_check',
                    'module': 'estoque',
                    'data': {
                        'search': item_name,
                        'items': [{'name': i.name, 'quantity': i.quantity, 'min': i.min_quantity} for i in items]
                    }
                }
            else:
                return {
                    'success': False,
                    'message': f'Não encontrei "{item_name}" no estoque.'
                }
    
    # Listar itens em falta
    elif 'falta' in command_lower or 'acabou' in command_lower or 'esgotado' in command_lower:
        out_of_stock = Inventory.query.filter(Inventory.quantity == 0).all()
        
        if out_of_stock:
            message = f'❌ ITENS EM FALTA\n'
            message += f'{"=" * 40}\n'
            
            for item in out_of_stock:
                message += f'• {item.name} (Mínimo: {item.min_quantity})\n'
            
            message += f'\n📊 Total: {len(out_of_stock)} itens em falta'
            
            return {
                'success': True,
                'message': message,
                'action': 'out_of_stock',
                'module': 'estoque',
                'data': {
                    'count': len(out_of_stock),
                    'items': [i.name for i in out_of_stock]
                }
            }
        else:
            return {
                'success': True,
                'message': '✅ Ótima notícia! Não há itens em falta no estoque.',
                'data': {'count': 0}
            }
    
    # Listar estoque baixo
    elif 'baixo' in command_lower or 'pouco' in command_lower or 'repor' in command_lower:
        low_stock = Inventory.query.filter(
            and_(
                Inventory.quantity > 0,
                Inventory.quantity <= Inventory.min_quantity
            )
        ).all()
        
        if low_stock:
            message = f'⚠️ ESTOQUE BAIXO\n'
            message += f'{"=" * 40}\n'
            
            for item in low_stock:
                percent = (item.quantity / item.min_quantity * 100) if item.min_quantity > 0 else 0
                message += f'• {item.name}: {item.quantity}/{item.min_quantity} ({percent:.0f}%)\n'
            
            message += f'\n📊 Total: {len(low_stock)} itens com estoque baixo'
            
            return {
                'success': True,
                'message': message,
                'action': 'low_stock',
                'module': 'estoque',
                'data': {
                    'count': len(low_stock),
                    'items': [{'name': i.name, 'quantity': i.quantity, 'min': i.min_quantity} for i in low_stock]
                }
            }
        else:
            return {
                'success': True,
                'message': '✅ Todos os itens estão com estoque adequado.',
                'data': {'count': 0}
            }
    
    # Adicionar ao estoque
    elif 'adicionar' in command_lower or 'repor' in command_lower:
        amount = ai.extract_amount(command)
        
        # Extrair nome do item
        item_name = ai.extract_name(command, ['adicionar', 'repor', 'no', 'ao'])
        
        if item_name and amount:
            item = Inventory.query.filter(
                Inventory.name.ilike(f'%{item_name}%')
            ).first()
            
            if item:
                old_quantity = item.quantity
                item.quantity += int(amount)
                db.session.commit()
                
                return {
                    'success': True,
                    'message': f'✅ Estoque atualizado!\n{item.name}: {old_quantity} → {item.quantity} unidades',
                    'action': 'stock_added',
                    'module': 'estoque',
                    'data': {
                        'item': item.name,
                        'added': int(amount),
                        'old_quantity': old_quantity,
                        'new_quantity': item.quantity
                    }
                }
            else:
                return {
                    'success': False,
                    'message': f'Item "{item_name}" não encontrado no estoque.'
                }
        else:
            return {
                'success': False,
                'message': 'Para adicionar ao estoque, preciso saber o item e a quantidade.',
                'action': 'request_info',
                'required_fields': ['item_name', 'quantity']
            }
    
    return {
        'success': False,
        'message': 'Posso verificar quantidade, listar itens em falta, estoque baixo ou adicionar itens.'
    }

def process_general_command(command, command_lower, ai):
    """Processa comandos gerais ou não específicos"""
    
    # Saudações e comandos básicos
    if any(word in command_lower for word in ['olá', 'ola', 'oi', 'bom dia', 'boa tarde', 'boa noite']):
        hour = datetime.now().hour
        greeting = 'Bom dia' if hour < 12 else 'Boa tarde' if hour < 18 else 'Boa noite'
        
        return {
            'success': True,
            'message': f'{greeting}, senhor! Como posso ajudá-lo com o sistema hoje?',
            'action': 'greeting'
        }
    
    # Ajuda
    elif 'ajuda' in command_lower or 'help' in command_lower or 'comandos' in command_lower:
        message = '📚 COMANDOS DISPONÍVEIS\n'
        message += '=' * 40 + '\n\n'
        message += '🔧 CRIAR/CADASTRAR:\n'
        message += '• "Criar vale de 200 para Josemir"\n'
        message += '• "Cadastrar novo cliente"\n'
        message += '• "Nova encomenda para Maria"\n\n'
        message += '🔍 BUSCAR/LISTAR:\n'
        message += '• "Mostrar vales de Josemir"\n'
        message += '• "Listar clientes"\n'
        message += '• "Buscar encomendas de hoje"\n\n'
        message += '📊 RELATÓRIOS:\n'
        message += '• "Relatório de vendas hoje"\n'
        message += '• "Relatório financeiro"\n'
        message += '• "Relatório de estoque"\n\n'
        message += '✅ AÇÕES:\n'
        message += '• "Aprovar vales pendentes"\n'
        message += '• "Pagar vale de Josemir"\n'
        message += '• "Confirmar encomendas"\n\n'
        message += '💰 FINANCEIRO:\n'
        message += '• "Qual o saldo do caixa?"\n'
        message += '• "Registrar entrada de 500"\n'
        message += '• "Calcular lucro do mês"\n\n'
        message += '📦 ESTOQUE:\n'
        message += '• "Quanto temos de ouro?"\n'
        message += '• "Listar itens em falta"\n'
        message += '• "Adicionar 10 unidades de prata"'
        
        return {
            'success': True,
            'message': message,
            'action': 'help'
        }
    
    # Status do sistema
    elif 'status' in command_lower or 'sistema' in command_lower:
        # Coletar informações do sistema
        employees = Employee.query.count()
        customers = Customer.query.count()
        orders_today = Order.query.filter(
            func.date(Order.created_at) == datetime.now().date()
        ).count()
        pending_vales = Vale.query.filter(Vale.status == 'pending').count()
        
        message = '📊 STATUS DO SISTEMA\n'
        message += '=' * 40 + '\n'
        message += f'👥 Funcionários: {employees}\n'
        message += f'👤 Clientes: {customers}\n'
        message += f'📦 Pedidos hoje: {orders_today}\n'
        message += f'📝 Vales pendentes: {pending_vales}\n'
        message += f'🕐 Horário: {datetime.now().strftime("%H:%M")}\n'
        message += f'📅 Data: {datetime.now().strftime("%d/%m/%Y")}'
        
        return {
            'success': True,
            'message': message,
            'action': 'status'
        }
    
    # Comando não reconhecido
    else:
        # Tentar inferir intenção
        suggestions = []
        
        if 'josemir' in command_lower:
            suggestions.append('Mostrar vales de Josemir')
            suggestions.append('Criar vale para Josemir')
        
        if 'cliente' in command_lower:
            suggestions.append('Listar clientes')
            suggestions.append('Cadastrar novo cliente')
        
        if 'venda' in command_lower or 'pedido' in command_lower:
            suggestions.append('Relatório de vendas hoje')
            suggestions.append('Criar nova encomenda')
        
        message = 'Desculpe, não compreendi completamente seu comando.'
        
        if suggestions:
            message += '\n\nTalvez você queira:'
            for suggestion in suggestions:
                message += f'\n• "{suggestion}"'
        else:
            message += '\n\nTente ser mais específico ou diga "ajuda" para ver os comandos disponíveis.'
        
        return {
            'success': False,
            'message': message,
            'suggestions': suggestions
        }

# Rotas adicionais para funcionalidades específicas

@ai_enhanced_bp.route('/vales/create-via-ai', methods=['POST'])
def create_vale_via_ai():
    """Cria um vale através da IA"""
    try:
        data = request.get_json()
        employee_name = data.get('employee_name')
        amount = data.get('amount')
        reason = data.get('reason', 'Vale solicitado via IA')
        
        # Buscar funcionário
        employee = Employee.query.filter(
            Employee.name.ilike(f'%{employee_name}%')
        ).first()
        
        if not employee:
            return jsonify({
                'success': False,
                'message': f'Funcionário {employee_name} não encontrado'
            }), 404
        
        # Criar vale
        vale = Vale(
            employee_id=employee.id,
            amount=amount,
            reason=reason,
            status='pending',
            created_at=datetime.now()
        )
        
        db.session.add(vale)
        db.session.commit()
        
        return jsonify({
            'success': True,
            'vale_id': vale.id,
            'message': f'Vale criado para {employee.name}'
        })
        
    except Exception as e:
        db.session.rollback()
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@ai_enhanced_bp.route('/vales/search', methods=['GET'])
def search_vales_ai():
    """Busca vales com filtros da IA"""
    try:
        employee = request.args.get('employee')
        status = request.args.get('status')
        
        query = Vale.query
        
        if employee:
            emp = Employee.query.filter(
                Employee.name.ilike(f'%{employee}%')
            ).first()
            if emp:
                query = query.filter(Vale.employee_id == emp.id)
        
        if status:
            query = query.filter(Vale.status == status)
        
        vales = query.all()
        
        return jsonify({
            'success': True,
            'vales': [v.to_dict() for v in vales],
            'count': len(vales)
        })
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@ai_enhanced_bp.route('/process_intent', methods=['POST'])
def process_intent():
    """Processa comando com reconhecimento de intenção"""
    try:
        data = request.get_json()
        command = data.get('command', '')
        
        if not command:
            return jsonify({
                'success': False,
                'error': 'Comando não fornecido'
            }), 400
        
        # Usar reconhecimento de intenção se disponível
        if INTENT_RECOGNITION_AVAILABLE:
            intent_response = recognize_intent(command)
            
            # Executar ação baseada na intenção
            if intent_response['crud_operation'] and intent_response['entity_type'] != 'unknown':
                # Processar CRUD baseado na intenção
                result = execute_crud_operation(
                    intent_response['crud_operation'],
                    intent_response['entity_type'],
                    intent_response['parameters']
                )
                
                return jsonify({
                    'success': True,
                    'intent': intent_response,
                    'result': result,
                    'message': intent_response.get('message', 'Comando executado')
                })
            else:
                # Fallback para processamento tradicional
                return process_traditional_command(command)
        else:
            # Se reconhecimento de intenção não estiver disponível
            return process_traditional_command(command)
            
    except Exception as e:
        print(f"Erro ao processar intenção: {e}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

def execute_crud_operation(operation, entity_type, parameters):
    """Executa operação CRUD baseada na intenção identificada"""
    result = {
        'operation': operation,
        'entity_type': entity_type,
        'status': 'pending'
    }
    
    try:
        if entity_type == 'vale':
            if operation == 'create':
                # Criar vale
                entities = parameters.get('entities', {})
                employee_name = entities.get('person_name')
                value = entities.get('value', 0)
                
                if employee_name:
                    employee = AIAssistant.find_employee_by_name(employee_name)
                    if employee:
                        vale = Vale(
                            employee_id=employee.id,
                            amount=value,
                            date=datetime.now(),
                            description=f"Vale criado por comando de voz",
                            status='pending'
                        )
                        db.session.add(vale)
                        db.session.commit()
                        
                        result['status'] = 'success'
                        result['data'] = {
                            'vale_id': vale.id,
                            'employee': employee.name,
                            'amount': value
                        }
                        result['message'] = f"Vale de R$ {value:.2f} criado para {employee.name}"
                    else:
                        result['status'] = 'error'
                        result['message'] = f"Funcionário {employee_name} não encontrado"
                else:
                    result['status'] = 'error'
                    result['message'] = "Nome do funcionário não identificado"
                    
            elif operation == 'read':
                # Listar vales
                filters = parameters.get('filters', {})
                query = Vale.query
                
                if filters.get('time_filter') == 'today':
                    today = datetime.now().date()
                    query = query.filter(func.date(Vale.date) == today)
                elif filters.get('time_filter') == 'this_week':
                    week_start = datetime.now() - timedelta(days=datetime.now().weekday())
                    query = query.filter(Vale.date >= week_start)
                
                vales = query.order_by(Vale.date.desc()).limit(10).all()
                
                result['status'] = 'success'
                result['data'] = [{
                    'id': v.id,
                    'employee': v.employee.name if v.employee else 'N/A',
                    'amount': v.amount,
                    'date': v.date.strftime('%d/%m/%Y'),
                    'status': v.status
                } for v in vales]
                result['message'] = f"Encontrados {len(vales)} vales"
                
            elif operation == 'delete':
                # Excluir vale
                entities = parameters.get('entities', {})
                target = entities.get('target')
                
                if target == 'last':
                    # Excluir último vale
                    last_vale = Vale.query.order_by(Vale.id.desc()).first()
                    if last_vale:
                        vale_info = f"Vale #{last_vale.id} de R$ {last_vale.amount:.2f}"
                        db.session.delete(last_vale)
                        db.session.commit()
                        
                        result['status'] = 'success'
                        result['message'] = f"{vale_info} excluído com sucesso"
                    else:
                        result['status'] = 'error'
                        result['message'] = "Nenhum vale encontrado"
                else:
                    result['status'] = 'error'
                    result['message'] = "Especifique qual vale excluir"
                    
            elif operation == 'update':
                # Atualizar vale
                result['status'] = 'pending'
                result['message'] = "Atualização de vale não implementada ainda"
                
        elif entity_type == 'cliente':
            # Implementar operações para cliente
            result['status'] = 'pending'
            result['message'] = f"Operação {operation} para cliente em desenvolvimento"
            
        elif entity_type == 'produto':
            # Implementar operações para produto
            result['status'] = 'pending'
            result['message'] = f"Operação {operation} para produto em desenvolvimento"
            
        else:
            result['status'] = 'error'
            result['message'] = f"Tipo de entidade {entity_type} não suportado"
            
    except Exception as e:
        result['status'] = 'error'
        result['message'] = str(e)
    
    return result

def process_traditional_command(command):
    """Processa comando usando método tradicional (fallback)"""
    # Implementação do processamento tradicional existente
    return jsonify({
        'success': False,
        'message': 'Processamento tradicional não implementado',
        'command': command
    })

@ai_enhanced_bp.route('/reports/<report_type>', methods=['GET'])
def generate_report_ai(report_type):
    """Gera relatórios solicitados pela IA"""
    try:
        period = request.args.get('period', 'today')
        
        # Determinar período
        end_date = datetime.now()
        if period == 'today':
            start_date = end_date.replace(hour=0, minute=0, second=0)
        elif period == 'week':
            start_date = end_date - timedelta(days=7)
        elif period == 'month':
            start_date = end_date - timedelta(days=30)
        else:
            start_date = end_date.replace(hour=0, minute=0, second=0)
        
        if report_type == 'sales':
            # Relatório de vendas
            orders = Order.query.filter(
                and_(
                    Order.created_at >= start_date,
                    Order.created_at <= end_date,
                    Order.status.in_(['confirmed', 'delivered'])
                )
            ).all()
            
            total = sum(o.total_price for o in orders if o.total_price)
            
            return jsonify({
                'success': True,
                'summary': f'{len(orders)} vendas totalizando R$ {total:.2f}',
                'data': {
                    'count': len(orders),
                    'total': total,
                    'period': period
                }
            })
        
        elif report_type == 'inventory':
            # Relatório de estoque
            inventory = Inventory.query.all()
            low_stock = [i for i in inventory if i.quantity <= i.min_quantity]
            out_of_stock = [i for i in inventory if i.quantity == 0]
            
            return jsonify({
                'success': True,
                'summary': f'{len(inventory)} itens, {len(low_stock)} com estoque baixo, {len(out_of_stock)} esgotados',
                'data': {
                    'total': len(inventory),
                    'low_stock': len(low_stock),
                    'out_of_stock': len(out_of_stock)
                }
            })
        
        elif report_type == 'financial':
            # Relatório financeiro
            transactions = CaixaTransaction.query.filter(
                and_(
                    CaixaTransaction.created_at >= start_date,
                    CaixaTransaction.created_at <= end_date
                )
            ).all()
            
            entradas = sum(t.amount for t in transactions if t.type == 'entrada')
            saidas = sum(t.amount for t in transactions if t.type == 'saida')
            
            return jsonify({
                'success': True,
                'summary': f'Entradas: R$ {entradas:.2f}, Saídas: R$ {saidas:.2f}, Saldo: R$ {entradas - saidas:.2f}',
                'data': {
                    'entradas': entradas,
                    'saidas': saidas,
                    'saldo': entradas - saidas,
                    'period': period
                }
            })
        
        elif report_type == 'employees':
            # Relatório de funcionários
            employees = Employee.query.all()
            total_salaries = sum(e.salary for e in employees if e.salary)
            
            vales = Vale.query.filter(
                and_(
                    Vale.created_at >= start_date,
                    Vale.created_at <= end_date,
                    Vale.status != 'paid'
                )
            ).all()
            
            total_vales = sum(v.amount for v in vales)
            
            return jsonify({
                'success': True,
                'summary': f'{len(employees)} funcionários, R$ {total_salaries:.2f} em salários, R$ {total_vales:.2f} em vales',
                'data': {
                    'employees': len(employees),
                    'total_salaries': total_salaries,
                    'total_vales': total_vales,
                    'period': period
                }
            })
        
        else:
            return jsonify({
                'success': False,
                'message': 'Tipo de relatório não reconhecido'
            }), 400
            
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500
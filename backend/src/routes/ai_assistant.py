from flask import Blueprint, request, jsonify
from src.models.user import db
from src.models.employee import Employee
from src.models.vale import Vale
from src.models.customer import Customer
from src.models.jewelry import Jewelry
from src.models.order import Order
from src.models.payment import Payment
from datetime import datetime, timedelta
from sqlalchemy import func

ai_bp = Blueprint('ai', __name__)

def process_ai_command(command):
    """
    Processa comandos da IA Lua e retorna dados do banco
    """
    command_lower = command.lower()
    
    try:
        # Comandos sobre vales
        if 'vale' in command_lower:
            if 'josemir' in command_lower:
                # Buscar funcionário Josemir
                employee = Employee.query.filter(
                    Employee.name.ilike('%josemir%')
                ).first()
                
                if employee:
                    # Buscar vales do Josemir
                    vales = Vale.query.filter_by(employee_id=employee.id).all()
                    
                    if vales:
                        total = sum(v.amount for v in vales)
                        response = f"Encontrei {len(vales)} vales para {employee.name}:\\n\\n"
                        
                        for vale in vales:
                            response += f"• Vale de R$ {vale.amount:.2f} - {vale.reason} (Status: {vale.status})\\n"
                        
                        response += f"\\nTotal em vales: R$ {total:.2f}"
                        
                        return {
                            'success': True,
                            'message': response,
                            'data': {
                                'employee': employee.name,
                                'vales_count': len(vales),
                                'total_amount': total,
                                'vales': [v.to_dict() for v in vales]
                            }
                        }
                    else:
                        return {
                            'success': True,
                            'message': f"Não encontrei vales registrados para {employee.name}.",
                            'data': {'employee': employee.name, 'vales_count': 0}
                        }
                else:
                    return {
                        'success': False,
                        'message': "Não encontrei nenhum funcionário chamado Josemir no sistema."
                    }
            
            elif 'todos' in command_lower or 'listar' in command_lower:
                # Listar todos os vales
                vales = Vale.query.all()
                
                if vales:
                    total = sum(v.amount for v in vales)
                    response = f"Total de {len(vales)} vales no sistema:\\n\\n"
                    
                    for vale in vales:
                        employee = Employee.query.get(vale.employee_id)
                        emp_name = employee.name if employee else "Desconhecido"
                        response += f"• {emp_name}: R$ {vale.amount:.2f} - {vale.reason}\\n"
                    
                    response += f"\\nTotal geral: R$ {total:.2f}"
                    
                    return {
                        'success': True,
                        'message': response,
                        'data': {
                            'vales_count': len(vales),
                            'total_amount': total,
                            'vales': [v.to_dict() for v in vales]
                        }
                    }
                else:
                    return {
                        'success': True,
                        'message': "Não há vales registrados no sistema.",
                        'data': {'vales_count': 0}
                    }
        
        # Comandos sobre vendas
        elif 'venda' in command_lower:
            if 'hoje' in command_lower or 'dia' in command_lower:
                # Vendas de hoje
                today = datetime.now().date()
                orders = Order.query.filter(
                    func.date(Order.created_at) == today
                ).all()
                
                if orders:
                    total = sum(o.total_price for o in orders if o.total_price)
                    response = f"Vendas de hoje ({today.strftime('%d/%m/%Y')}):\\n\\n"
                    response += f"• Total de vendas: {len(orders)}\\n"
                    response += f"• Valor total: R$ {total:.2f}\\n"
                    
                    for order in orders[:5]:  # Mostrar apenas 5 primeiras
                        customer = Customer.query.get(order.customer_id)
                        cust_name = customer.name if customer else "Cliente não identificado"
                        response += f"\\n• Venda #{order.id}: {cust_name} - R$ {order.total_price:.2f}"
                    
                    if len(orders) > 5:
                        response += f"\\n... e mais {len(orders) - 5} vendas"
                    
                    return {
                        'success': True,
                        'message': response,
                        'data': {
                            'date': today.isoformat(),
                            'sales_count': len(orders),
                            'total_amount': total,
                            'orders': [o.to_dict() for o in orders]
                        }
                    }
                else:
                    return {
                        'success': True,
                        'message': f"Não há vendas registradas para hoje ({today.strftime('%d/%m/%Y')}).",
                        'data': {'date': today.isoformat(), 'sales_count': 0}
                    }
            
            elif 'semana' in command_lower:
                # Vendas da semana
                week_ago = datetime.now() - timedelta(days=7)
                orders = Order.query.filter(
                    Order.created_at >= week_ago
                ).all()
                
                if orders:
                    total = sum(o.total_price for o in orders if o.total_price)
                    response = f"Vendas dos últimos 7 dias:\\n\\n"
                    response += f"• Total de vendas: {len(orders)}\\n"
                    response += f"• Valor total: R$ {total:.2f}\\n"
                    response += f"• Média diária: R$ {total/7:.2f}"
                    
                    return {
                        'success': True,
                        'message': response,
                        'data': {
                            'period': 'last_week',
                            'sales_count': len(orders),
                            'total_amount': total,
                            'daily_average': total/7
                        }
                    }
                else:
                    return {
                        'success': True,
                        'message': "Não há vendas registradas nos últimos 7 dias.",
                        'data': {'period': 'last_week', 'sales_count': 0}
                    }
        
        # Comandos sobre funcionários
        elif 'funcionário' in command_lower or 'funcionario' in command_lower:
            if 'cadastrar' in command_lower or 'novo' in command_lower:
                return {
                    'success': True,
                    'message': "Para cadastrar um novo funcionário, preciso das seguintes informações:\\n• Nome completo\\n• CPF\\n• Cargo\\n• Telefone\\n• Email\\n• Salário\\n\\nPor favor, forneça esses dados.",
                    'action': 'request_employee_data'
                }
            
            elif 'listar' in command_lower or 'todos' in command_lower:
                employees = Employee.query.all()
                
                if employees:
                    response = f"Temos {len(employees)} funcionários cadastrados:\\n\\n"
                    
                    for emp in employees:
                        response += f"• {emp.name} - {emp.role} (Salário: R$ {emp.salary:.2f})\\n"
                    
                    return {
                        'success': True,
                        'message': response,
                        'data': {
                            'employees_count': len(employees),
                            'employees': [e.to_dict() for e in employees]
                        }
                    }
                else:
                    return {
                        'success': True,
                        'message': "Não há funcionários cadastrados no sistema.",
                        'data': {'employees_count': 0}
                    }
        
        # Comandos sobre clientes
        elif 'cliente' in command_lower:
            if 'listar' in command_lower or 'todos' in command_lower:
                customers = Customer.query.all()
                
                if customers:
                    response = f"Temos {len(customers)} clientes cadastrados:\\n\\n"
                    
                    for cust in customers[:10]:  # Mostrar apenas 10 primeiros
                        response += f"• {cust.name} - Tel: {cust.phone}\\n"
                    
                    if len(customers) > 10:
                        response += f"\\n... e mais {len(customers) - 10} clientes"
                    
                    return {
                        'success': True,
                        'message': response,
                        'data': {
                            'customers_count': len(customers),
                            'customers': [c.to_dict() for c in customers]
                        }
                    }
                else:
                    return {
                        'success': True,
                        'message': "Não há clientes cadastrados no sistema.",
                        'data': {'customers_count': 0}
                    }
        
        # Comandos sobre estoque/inventário
        elif 'estoque' in command_lower or 'inventário' in command_lower or 'inventario' in command_lower:
            from src.models.inventory import Inventory
            
            items = Inventory.query.all()
            
            if items:
                low_stock = [i for i in items if i.quantity <= i.min_quantity]
                
                response = f"Status do Estoque:\\n\\n"
                response += f"• Total de itens: {len(items)}\\n"
                
                if low_stock:
                    response += f"\\n⚠️ {len(low_stock)} itens com estoque baixo:\\n"
                    for item in low_stock[:5]:
                        response += f"  • {item.name}: {item.quantity} unidades (mínimo: {item.min_quantity})\\n"
                else:
                    response += "✅ Todos os itens estão com estoque adequado\\n"
                
                return {
                    'success': True,
                    'message': response,
                    'data': {
                        'total_items': len(items),
                        'low_stock_count': len(low_stock),
                        'low_stock_items': [i.to_dict() for i in low_stock]
                    }
                }
            else:
                return {
                    'success': True,
                    'message': "Não há itens cadastrados no estoque.",
                    'data': {'total_items': 0}
                }
        
        # Comando de ajuda
        elif 'ajuda' in command_lower or 'help' in command_lower:
            response = """Olá! Sou a Lua, sua assistente virtual. Posso ajudar com:

📊 **Vendas:**
• "Mostre as vendas de hoje"
• "Vendas da semana"

💰 **Vales:**
• "Mostre os vales do Josemir"
• "Liste todos os vales"

👥 **Funcionários:**
• "Liste os funcionários"
• "Cadastre um novo funcionário"

🛍️ **Clientes:**
• "Liste os clientes"

📦 **Estoque:**
• "Status do estoque"
• "Verifique o inventário"

Como posso ajudar?"""
            
            return {
                'success': True,
                'message': response,
                'action': 'show_help'
            }
        
        # Comando não reconhecido
        else:
            return {
                'success': False,
                'message': "Desculpe, não entendi seu comando. Digite 'ajuda' para ver o que posso fazer.",
                'action': 'unknown_command'
            }
    
    except Exception as e:
        print(f"Erro ao processar comando da IA: {str(e)}")
        return {
            'success': False,
            'message': f"Ocorreu um erro ao processar seu comando: {str(e)}"
        }

@ai_bp.route('/ai/chat', methods=['POST'])
def ai_chat():
    """
    Endpoint para processar comandos de chat/voz da IA Lua
    """
    try:
        data = request.get_json()
        command = data.get('command', '')
        
        if not command:
            return jsonify({
                'success': False,
                'message': 'Por favor, envie um comando.'
            }), 400
        
        print(f"Comando recebido da IA: {command}")
        
        # Processar comando
        result = process_ai_command(command)
        
        return jsonify(result)
    
    except Exception as e:
        print(f"Erro no endpoint da IA: {str(e)}")
        return jsonify({
            'success': False,
            'message': f'Erro ao processar comando: {str(e)}'
        }), 500

@ai_bp.route('/ai/create-employee', methods=['POST'])
def create_employee_via_ai():
    """
    Cria um novo funcionário via comando da IA
    """
    try:
        data = request.get_json()
        
        # Validar dados obrigatórios
        required_fields = ['name', 'cpf', 'role', 'phone', 'email', 'salary']
        for field in required_fields:
            if field not in data:
                return jsonify({
                    'success': False,
                    'message': f'Campo {field} é obrigatório'
                }), 400
        
        # Verificar se CPF já existe
        existing = Employee.query.filter_by(cpf=data['cpf']).first()
        if existing:
            return jsonify({
                'success': False,
                'message': f'Já existe um funcionário com o CPF {data["cpf"]}'
            }), 400
        
        # Criar novo funcionário
        new_employee = Employee(
            name=data['name'],
            cpf=data['cpf'],
            role=data['role'],
            phone=data['phone'],
            email=data['email'],
            salary=float(data['salary'])
        )
        
        db.session.add(new_employee)
        db.session.commit()
        
        return jsonify({
            'success': True,
            'message': f'Funcionário {data["name"]} cadastrado com sucesso!',
            'data': new_employee.to_dict()
        }), 201
    
    except Exception as e:
        db.session.rollback()
        print(f"Erro ao criar funcionário: {str(e)}")
        return jsonify({
            'success': False,
            'message': f'Erro ao cadastrar funcionário: {str(e)}'
        }), 500

@ai_bp.route('/ai/create-vale', methods=['POST'])
def create_vale_via_ai():
    """
    Cria um novo vale via comando da IA
    """
    try:
        data = request.get_json()
        
        # Validar dados obrigatórios
        required_fields = ['employee_name', 'amount', 'reason']
        for field in required_fields:
            if field not in data:
                return jsonify({
                    'success': False,
                    'message': f'Campo {field} é obrigatório'
                }), 400
        
        # Buscar funcionário
        employee = Employee.query.filter(
            Employee.name.ilike(f'%{data["employee_name"]}%')
        ).first()
        
        if not employee:
            return jsonify({
                'success': False,
                'message': f'Funcionário {data["employee_name"]} não encontrado'
            }), 404
        
        # Criar novo vale
        new_vale = Vale(
            employee_id=employee.id,
            amount=float(data['amount']),
            reason=data['reason'],
            status='pending'
        )
        
        db.session.add(new_vale)
        db.session.commit()
        
        return jsonify({
            'success': True,
            'message': f'Vale de R$ {data["amount"]:.2f} criado para {employee.name}!',
            'data': new_vale.to_dict()
        }), 201
    
    except Exception as e:
        db.session.rollback()
        print(f"Erro ao criar vale: {str(e)}")
        return jsonify({
            'success': False,
            'message': f'Erro ao criar vale: {str(e)}'
        }), 500
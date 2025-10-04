from flask import Blueprint, request, jsonify
from src.models.user import db
from src.models.employee import Employee
from datetime import datetime

# Importar os novos modelos (serão adicionados ao sistema)
from src.models.caixa import CaixaCategory, CaixaTransaction

caixa_bp = Blueprint("caixa", __name__)

@caixa_bp.route("/caixa/categories", methods=["GET"])
def get_categories():
    """Obter todas as categorias de saída"""
    categories = CaixaCategory.query.all()
    return jsonify([category.to_dict() for category in categories]), 200

@caixa_bp.route("/caixa/categories", methods=["POST"])
def create_category():
    """Criar nova categoria de saída"""
    data = request.get_json()
    
    # Verificar se a categoria já existe
    existing_category = CaixaCategory.query.filter_by(name=data["name"]).first()
    if existing_category:
        return jsonify({"error": "Categoria já existe"}), 400
    
    new_category = CaixaCategory(
        name=data["name"],
        description=data.get("description", "")
    )
    db.session.add(new_category)
    db.session.commit()
    return jsonify(new_category.to_dict()), 201

# Função removida - duplicada mais abaixo

@caixa_bp.route("/caixa/transactions", methods=["GET"])
def get_transactions():
    """Obter todas as transações do caixa com filtros"""
    # Parâmetros de filtro
    start_date = request.args.get('start_date')
    end_date = request.args.get('end_date')
    transaction_type = request.args.get('type')  # 'entrada' ou 'saida'
    category_id = request.args.get('category_id')
    employee_id = request.args.get('employee_id')
    
    query = CaixaTransaction.query
    
    # Aplicar filtros
    if start_date:
        query = query.filter(CaixaTransaction.date >= start_date)
    if end_date:
        query = query.filter(CaixaTransaction.date <= end_date)
    if transaction_type:
        query = query.filter(CaixaTransaction.type == transaction_type)
    if category_id:
        query = query.filter(CaixaTransaction.category_id == category_id)
    if employee_id:
        query = query.filter(CaixaTransaction.employee_id == employee_id)
    
    transactions = query.order_by(CaixaTransaction.created_at.desc()).all()
    return jsonify([transaction.to_dict() for transaction in transactions]), 200

@caixa_bp.route("/caixa/transactions", methods=["POST"])
def create_transaction():
    """Criar nova transação do caixa"""
    data = request.get_json()
    
    new_transaction = CaixaTransaction(
        type=data["type"],
        amount=data["amount"],
        date=data["date"],
        description=data.get("description", ""),
        category_id=data.get("category_id"),
        employee_id=data.get("employee_id")
    )
    
    db.session.add(new_transaction)
    db.session.commit()
    return jsonify(new_transaction.to_dict()), 201

@caixa_bp.route("/caixa/transactions/<int:id>", methods=["PUT"])
def update_transaction(id):
    """Atualizar transação do caixa"""
    transaction = CaixaTransaction.query.get_or_404(id)
    data = request.get_json()
    
    transaction.type = data.get("type", transaction.type)
    transaction.amount = data.get("amount", transaction.amount)
    transaction.date = data.get("date", transaction.date)
    transaction.description = data.get("description", transaction.description)
    transaction.category_id = data.get("category_id", transaction.category_id)
    transaction.employee_id = data.get("employee_id", transaction.employee_id)
    
    db.session.commit()
    return jsonify(transaction.to_dict()), 200

@caixa_bp.route("/caixa/transactions/<int:id>", methods=["DELETE"])
def delete_transaction(id):
    """Deletar transação do caixa"""
    transaction = CaixaTransaction.query.get_or_404(id)
    db.session.delete(transaction)
    db.session.commit()
    return jsonify({"message": "Transação deletada"}), 200

@caixa_bp.route("/caixa/summary", methods=["GET"])
def get_summary():
    """Obter resumo do caixa (total de entradas, saídas, saldo)"""
    start_date = request.args.get('start_date')
    end_date = request.args.get('end_date')
    
    query = CaixaTransaction.query
    
    if start_date:
        query = query.filter(CaixaTransaction.date >= start_date)
    if end_date:
        query = query.filter(CaixaTransaction.date <= end_date)
    
    transactions = query.all()
    
    total_entradas = sum(t.amount for t in transactions if t.type == 'entrada')
    total_saidas = sum(t.amount for t in transactions if t.type == 'saida')
    saldo = total_entradas - total_saidas
    
    return jsonify({
        "total_entradas": total_entradas,
        "total_saidas": total_saidas,
        "saldo": saldo,
        "total_transacoes": len(transactions)
    }), 200

@caixa_bp.route("/caixa/employees", methods=["GET"])
def get_employees_for_caixa():
    """Obter lista de funcionários para seleção em retiradas"""
    employees = Employee.query.all()
    return jsonify([employee.to_dict() for employee in employees]), 200

@caixa_bp.route("/caixa", methods=["GET"])
def get_caixa_data():
    """Obter dados do caixa no formato esperado pelo frontend"""
    try:
        # Buscar todas as transações
        transactions = CaixaTransaction.query.order_by(CaixaTransaction.created_at.desc()).all()
        
        # Converter para o formato esperado pelo frontend
        caixa_data = []
        for transaction in transactions:
            caixa_data.append({
                "ID": transaction.id,
                "data": transaction.date.isoformat() if transaction.date else None,
                "valor1": transaction.amount if transaction.type == 'entrada' else -transaction.amount,
                "descricao": transaction.description or "",
                "grupo1": transaction.category.name if transaction.category else "Sem Categoria",
                "grupo2": transaction.category.description if transaction.category else "",
                "nome": transaction.employee.name if transaction.employee else "Sistema",
                "tipo": transaction.type
            })
        
        return jsonify(caixa_data), 200
    except Exception as e:
        # Se não houver dados ou houver erro, retorna lista vazia
        return jsonify([]), 200


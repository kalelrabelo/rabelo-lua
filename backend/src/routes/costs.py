from flask import Blueprint, request, jsonify
from src.models.user import db
from src.models.cost import Cost, Profit
from src.models.order import Order
from datetime import datetime

costs_bp = Blueprint("costs", __name__)

# ===== ROTAS PARA CUSTOS =====

@costs_bp.route("/costs", methods=["GET"])
def get_costs():
    try:
        order_id = request.args.get('order_id', type=int)
        category = request.args.get('category')
        start_date = request.args.get('start_date')
        end_date = request.args.get('end_date')
        
        query = Cost.query
        
        if order_id:
            query = query.filter(Cost.order_id == order_id)
        if category:
            query = query.filter(Cost.category == category)
        if start_date:
            start_date = datetime.fromisoformat(start_date)
            query = query.filter(Cost.date >= start_date)
        if end_date:
            end_date = datetime.fromisoformat(end_date)
            query = query.filter(Cost.date <= end_date)
        
        costs = query.order_by(Cost.date.desc()).all()
        return jsonify([cost.to_dict() for cost in costs]), 200
        
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@costs_bp.route("/costs/<int:id>", methods=["GET"])
def get_cost(id):
    try:
        cost = Cost.query.get_or_404(id)
        return jsonify(cost.to_dict()), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@costs_bp.route("/costs", methods=["POST"])
def create_cost():
    try:
        data = request.get_json()
        
        # Verificar se a encomenda existe (se fornecida)
        if data.get("order_id"):
            order = Order.query.get(data["order_id"])
            if not order:
                return jsonify({"error": "Encomenda não encontrada"}), 404
        
        # Converter data se fornecida
        cost_date = data.get("date")
        if cost_date and isinstance(cost_date, str):
            try:
                cost_date = datetime.fromisoformat(cost_date.replace('Z', '+00:00'))
            except:
                cost_date = datetime.strptime(cost_date, '%Y-%m-%d')
        elif not cost_date:
            cost_date = datetime.now()
        
        new_cost = Cost(
            order_id=data.get("order_id"),
            category=data["category"],
            description=data["description"],
            amount=data["amount"],
            date=cost_date,
            material_id=data.get("material_id"),
            employee_id=data.get("employee_id"),
            notes=data.get("notes")
        )
        
        db.session.add(new_cost)
        db.session.commit()
        
        return jsonify({
            "cost": new_cost.to_dict(),
            "message": "Custo registrado com sucesso"
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 500

@costs_bp.route("/costs/<int:id>", methods=["PUT"])
def update_cost(id):
    try:
        cost = Cost.query.get_or_404(id)
        data = request.get_json()
        
        cost.category = data.get("category", cost.category)
        cost.description = data.get("description", cost.description)
        cost.amount = data.get("amount", cost.amount)
        cost.material_id = data.get("material_id", cost.material_id)
        cost.employee_id = data.get("employee_id", cost.employee_id)
        cost.notes = data.get("notes", cost.notes)
        
        # Atualizar data se fornecida
        if "date" in data:
            cost_date = data["date"]
            if cost_date and isinstance(cost_date, str):
                try:
                    cost_date = datetime.fromisoformat(cost_date.replace('Z', '+00:00'))
                except:
                    cost_date = datetime.strptime(cost_date, '%Y-%m-%d')
            cost.date = cost_date
        
        db.session.commit()
        
        return jsonify({
            "cost": cost.to_dict(),
            "message": "Custo atualizado com sucesso"
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 500

@costs_bp.route("/costs/<int:id>", methods=["DELETE"])
def delete_cost(id):
    try:
        cost = Cost.query.get_or_404(id)
        db.session.delete(cost)
        db.session.commit()
        
        return jsonify({"message": "Custo excluído com sucesso"}), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 500

@costs_bp.route("/costs/categories", methods=["GET"])
def get_cost_categories():
    """Retorna as categorias de custos disponíveis"""
    categories = [
        {"value": "materials", "label": "Materiais"},
        {"value": "labor", "label": "Mão de obra"},
        {"value": "energy", "label": "Energia"},
        {"value": "overhead", "label": "Custos gerais"},
        {"value": "equipment", "label": "Equipamentos"},
        {"value": "transport", "label": "Transporte"},
        {"value": "other", "label": "Outros"}
    ]
    return jsonify(categories), 200

@costs_bp.route("/costs/order/<int:order_id>/total", methods=["GET"])
def get_order_total_costs(order_id):
    """Calcula o total de custos de uma encomenda"""
    try:
        order = Order.query.get_or_404(order_id)
        total_costs = Profit.calculate_order_costs(order_id)
        
        # Buscar custos por categoria
        costs_by_category = db.session.query(
            Cost.category,
            db.func.sum(Cost.amount).label('total')
        ).filter_by(order_id=order_id).group_by(Cost.category).all()
        
        return jsonify({
            "order_id": order_id,
            "order_customer": order.customer_name,
            "total_costs": total_costs,
            "costs_by_category": [
                {"category": category, "total": float(total)}
                for category, total in costs_by_category
            ]
        }), 200
        
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# ===== ROTAS PARA LUCROS =====

@costs_bp.route("/profits", methods=["GET"])
def get_profits():
    try:
        order_id = request.args.get('order_id', type=int)
        start_date = request.args.get('start_date')
        end_date = request.args.get('end_date')
        
        query = Profit.query
        
        if order_id:
            query = query.filter(Profit.order_id == order_id)
        if start_date:
            start_date = datetime.fromisoformat(start_date)
            query = query.filter(Profit.date_calculated >= start_date)
        if end_date:
            end_date = datetime.fromisoformat(end_date)
            query = query.filter(Profit.date_calculated <= end_date)
        
        profits = query.order_by(Profit.date_calculated.desc()).all()
        return jsonify([profit.to_dict() for profit in profits]), 200
        
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@costs_bp.route("/profits/<int:id>", methods=["GET"])
def get_profit(id):
    try:
        profit = Profit.query.get_or_404(id)
        return jsonify(profit.to_dict()), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@costs_bp.route("/profits/order/<int:order_id>", methods=["POST"])
def calculate_order_profit(order_id):
    """Calcula o lucro de uma encomenda específica"""
    try:
        order = Order.query.get_or_404(order_id)
        
        if order.status != 'completed':
            return jsonify({"error": "Encomenda deve estar finalizada para calcular lucro"}), 400
        
        # Verificar se já existe registro de lucro
        existing_profit = Profit.query.filter_by(order_id=order_id).first()
        if existing_profit:
            return jsonify({
                "profit": existing_profit.to_dict(),
                "message": "Lucro já calculado para esta encomenda"
            }), 200
        
        # Criar novo registro de lucro
        profit = Profit.create_from_order(order)
        
        if isinstance(profit, dict) and "error" in profit:
            return jsonify(profit), 400
        
        db.session.add(profit)
        db.session.commit()
        
        return jsonify({
            "profit": profit.to_dict(),
            "message": "Lucro calculado com sucesso"
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 500

@costs_bp.route("/profits/<int:id>/recalculate", methods=["POST"])
def recalculate_profit(id):
    """Recalcula o lucro baseado nos custos atuais"""
    try:
        profit = Profit.query.get_or_404(id)
        
        # Recalcular custos totais
        profit.total_costs = Profit.calculate_order_costs(profit.order_id)
        
        # Recalcular lucro e margem
        profit.calculate_profit()
        
        db.session.commit()
        
        return jsonify({
            "profit": profit.to_dict(),
            "message": "Lucro recalculado com sucesso"
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 500

@costs_bp.route("/profits/stats", methods=["GET"])
def get_profit_stats():
    """Estatísticas de lucros"""
    try:
        # Lucro total
        total_profit = db.session.query(db.func.sum(Profit.gross_profit)).scalar() or 0
        
        # Receita total
        total_revenue = db.session.query(db.func.sum(Profit.revenue)).scalar() or 0
        
        # Custos totais
        total_costs = db.session.query(db.func.sum(Profit.total_costs)).scalar() or 0
        
        # Margem média
        avg_margin = db.session.query(db.func.avg(Profit.profit_margin)).scalar() or 0
        
        # Número de encomendas com lucro calculado
        orders_with_profit = Profit.query.count()
        
        # Top 5 encomendas mais lucrativas
        top_profits = Profit.query.order_by(Profit.gross_profit.desc()).limit(5).all()
        
        return jsonify({
            "total_profit": total_profit,
            "total_revenue": total_revenue,
            "total_costs": total_costs,
            "average_margin": avg_margin,
            "orders_with_profit": orders_with_profit,
            "top_profitable_orders": [profit.to_dict() for profit in top_profits]
        }), 200
        
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@costs_bp.route("/profits/<int:id>", methods=["DELETE"])
def delete_profit(id):
    try:
        profit = Profit.query.get_or_404(id)
        db.session.delete(profit)
        db.session.commit()
        
        return jsonify({"message": "Registro de lucro excluído com sucesso"}), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 500


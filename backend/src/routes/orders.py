from flask import Blueprint, request, jsonify
from src.models.user import db
from src.models.order import Order
from src.models.jewelry import Jewelry
from src.models.inventory import Inventory
from datetime import datetime

orders_bp = Blueprint("orders", __name__)

@orders_bp.route("/orders", methods=["POST"])
def create_order():
    try:
        data = request.get_json()
        
        # Verificar se a joia existe
        jewelry = Jewelry.query.get(data["jewelry_id"])
        if not jewelry:
            return jsonify({"error": "Joia não encontrada"}), 404
        
        # Converter datas se fornecidas
        order_date = data.get("order_date")
        if order_date and isinstance(order_date, str):
            try:
                order_date = datetime.fromisoformat(order_date.replace('Z', '+00:00'))
            except:
                order_date = datetime.strptime(order_date, '%Y-%m-%d')
        elif not order_date:
            order_date = datetime.now()
        
        delivery_date = data.get("delivery_date")
        if delivery_date and isinstance(delivery_date, str):
            try:
                delivery_date = datetime.fromisoformat(delivery_date.replace('Z', '+00:00'))
            except:
                delivery_date = datetime.strptime(delivery_date, '%Y-%m-%d')
        
        # Criar nova encomenda
        new_order = Order(
            customer_name=data["customer_name"],
            customer_contact=data.get("customer_contact"),
            jewelry_id=data["jewelry_id"],
            quantity=data.get("quantity", 1),
            unit_price=data["unit_price"],
            order_date=order_date,
            delivery_date=delivery_date,
            notes=data.get("notes"),
            status='pending'
        )
        
        # Calcular preço total
        new_order.calculate_total_price()
        
        db.session.add(new_order)
        db.session.flush()  # Para obter o ID da encomenda
        
        # Opcionalmente reservar materiais automaticamente
        auto_reserve = data.get("auto_reserve_materials", False)
        reservation_result = None
        
        if auto_reserve:
            reservation_result = new_order.reserve_materials()
        
        db.session.commit()
        
        response_data = {
            "order": new_order.to_dict(),
            "message": "Encomenda criada com sucesso"
        }
        
        if reservation_result:
            response_data["reservation_result"] = reservation_result
        
        return jsonify(response_data), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 500

@orders_bp.route("/orders", methods=["GET"])
def get_orders():
    try:
        status = request.args.get('status')
        customer_name = request.args.get('customer_name')
        jewelry_id = request.args.get('jewelry_id', type=int)
        
        query = Order.query
        
        if status:
            query = query.filter(Order.status == status)
        if customer_name:
            query = query.filter(Order.customer_name.ilike(f'%{customer_name}%'))
        if jewelry_id:
            query = query.filter(Order.jewelry_id == jewelry_id)
        
        orders = query.order_by(Order.order_date.desc()).all()
        return jsonify([order.to_dict() for order in orders]), 200
        
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@orders_bp.route("/orders/<int:id>", methods=["GET"])
def get_order(id):
    try:
        order = Order.query.get_or_404(id)
        return jsonify(order.to_dict()), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@orders_bp.route("/orders/<int:id>", methods=["PUT"])
def update_order(id):
    try:
        order = Order.query.get_or_404(id)
        data = request.get_json()
        
        # Atualizar campos básicos
        order.customer_name = data.get("customer_name", order.customer_name)
        order.customer_contact = data.get("customer_contact", order.customer_contact)
        order.quantity = data.get("quantity", order.quantity)
        order.unit_price = data.get("unit_price", order.unit_price)
        order.notes = data.get("notes", order.notes)
        
        # Atualizar datas se fornecidas
        if "delivery_date" in data:
            delivery_date = data["delivery_date"]
            if delivery_date and isinstance(delivery_date, str):
                try:
                    delivery_date = datetime.fromisoformat(delivery_date.replace('Z', '+00:00'))
                except:
                    delivery_date = datetime.strptime(delivery_date, '%Y-%m-%d')
            order.delivery_date = delivery_date
        
        # Recalcular preço total
        order.calculate_total_price()
        
        db.session.commit()
        
        return jsonify({
            "order": order.to_dict(),
            "message": "Encomenda atualizada com sucesso"
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 500

@orders_bp.route("/orders/<int:id>/reserve-materials", methods=["POST"])
def reserve_materials(id):
    try:
        order = Order.query.get_or_404(id)
        
        if order.status == 'cancelled':
            return jsonify({"error": "Não é possível reservar materiais para encomenda cancelada"}), 400
        
        result = order.reserve_materials()
        
        if "error" in result:
            return jsonify(result), 400
        
        db.session.commit()
        
        return jsonify({
            "order": order.to_dict(),
            "result": result,
            "message": "Materiais reservados com sucesso"
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 500

@orders_bp.route("/orders/<int:id>/complete", methods=["POST"])
def complete_order(id):
    try:
        order = Order.query.get_or_404(id)
        
        result = order.complete_order()
        
        if "error" in result:
            return jsonify(result), 400
        
        # Aqui seria implementada a integração com custos e lucros
        # Por exemplo, registrar custos de produção, energia, etc.
        
        db.session.commit()
        
        return jsonify({
            "order": order.to_dict(),
            "result": result,
            "message": "Encomenda finalizada com sucesso"
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 500

@orders_bp.route("/orders/<int:id>/cancel", methods=["POST"])
def cancel_order(id):
    try:
        order = Order.query.get_or_404(id)
        
        result = order.cancel_order()
        
        if "error" in result:
            return jsonify(result), 400
        
        db.session.commit()
        
        return jsonify({
            "order": order.to_dict(),
            "result": result,
            "message": "Encomenda cancelada com sucesso"
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 500

@orders_bp.route("/orders/<int:id>", methods=["DELETE"])
def delete_order(id):
    try:
        order = Order.query.get_or_404(id)
        
        # Liberar materiais reservados antes de excluir
        if order.materials_reserved and order.status != 'completed':
            order.cancel_order()
        
        db.session.delete(order)
        db.session.commit()
        
        return jsonify({"message": "Encomenda excluída com sucesso"}), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 500

@orders_bp.route("/orders/stats", methods=["GET"])
def get_order_stats():
    """Estatísticas das encomendas"""
    try:
        total_orders = Order.query.count()
        pending_orders = Order.query.filter_by(status='pending').count()
        in_progress_orders = Order.query.filter_by(status='in_progress').count()
        completed_orders = Order.query.filter_by(status='completed').count()
        cancelled_orders = Order.query.filter_by(status='cancelled').count()
        
        # Valor total das encomendas por status
        total_value = db.session.query(db.func.sum(Order.total_price)).scalar() or 0
        pending_value = db.session.query(db.func.sum(Order.total_price)).filter_by(status='pending').scalar() or 0
        completed_value = db.session.query(db.func.sum(Order.total_price)).filter_by(status='completed').scalar() or 0
        
        return jsonify({
            "total_orders": total_orders,
            "orders_by_status": {
                "pending": pending_orders,
                "in_progress": in_progress_orders,
                "completed": completed_orders,
                "cancelled": cancelled_orders
            },
            "values": {
                "total_value": total_value,
                "pending_value": pending_value,
                "completed_value": completed_value
            }
        }), 200
        
    except Exception as e:
        return jsonify({"error": str(e)}), 500


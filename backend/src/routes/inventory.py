from flask import Blueprint, request, jsonify
from src.models.user import db
from src.models.inventory import Inventory
from src.models.material import Material

inventory_bp = Blueprint("inventory", __name__)

@inventory_bp.route("/inventory", methods=["GET"])
def get_inventory():
    try:
        material_id = request.args.get('material_id', type=int)
        low_stock_only = request.args.get('low_stock', type=bool, default=False)
        
        query = Inventory.query
        
        if material_id:
            query = query.filter(Inventory.material_id == material_id)
        
        inventory_items = query.all()
        
        if low_stock_only:
            inventory_items = [item for item in inventory_items if item.is_low_stock()]
        
        return jsonify([item.to_dict() for item in inventory_items]), 200
        
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@inventory_bp.route("/inventory/<int:id>", methods=["GET"])
def get_inventory_item(id):
    try:
        item = Inventory.query.get_or_404(id)
        return jsonify(item.to_dict()), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@inventory_bp.route("/inventory", methods=["POST"])
def create_inventory_item():
    try:
        data = request.get_json()
        
        # Verificar se o material existe
        material = Material.query.get(data["material_id"])
        if not material:
            return jsonify({"error": "Material não encontrado"}), 404
        
        # Verificar se já existe item de estoque para este material
        existing_item = Inventory.query.filter_by(material_id=data["material_id"]).first()
        if existing_item:
            return jsonify({"error": "Item de estoque já existe para este material"}), 400
        
        new_item = Inventory(
            material_id=data["material_id"],
            quantity_available=data.get("quantity_available", 0.0),
            unit=data.get("unit", "unidade"),
            minimum_stock=data.get("minimum_stock", 0.0),
            cost_per_unit=data.get("cost_per_unit", 0.0),
            notes=data.get("notes")
        )
        
        db.session.add(new_item)
        db.session.commit()
        
        return jsonify({
            "inventory": new_item.to_dict(),
            "message": "Item de estoque criado com sucesso"
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 500

@inventory_bp.route("/inventory/<int:id>", methods=["PUT"])
def update_inventory_item(id):
    try:
        item = Inventory.query.get_or_404(id)
        data = request.get_json()
        
        # Atualizar campos básicos
        item.unit = data.get("unit", item.unit)
        item.minimum_stock = data.get("minimum_stock", item.minimum_stock)
        item.cost_per_unit = data.get("cost_per_unit", item.cost_per_unit)
        item.notes = data.get("notes", item.notes)
        
        # Não permitir atualização direta das quantidades via PUT
        # Use rotas específicas para adicionar/remover estoque
        
        db.session.commit()
        
        return jsonify({
            "inventory": item.to_dict(),
            "message": "Item de estoque atualizado com sucesso"
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 500

@inventory_bp.route("/inventory/<int:id>/add-stock", methods=["POST"])
def add_stock(id):
    try:
        item = Inventory.query.get_or_404(id)
        data = request.get_json()
        
        quantity = data.get("quantity", 0)
        cost_per_unit = data.get("cost_per_unit")
        
        if quantity <= 0:
            return jsonify({"error": "Quantidade deve ser maior que zero"}), 400
        
        result = item.add_stock(quantity, cost_per_unit)
        
        if "error" in result:
            return jsonify(result), 400
        
        db.session.commit()
        
        return jsonify({
            "inventory": item.to_dict(),
            "result": result,
            "message": "Estoque adicionado com sucesso"
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 500

@inventory_bp.route("/inventory/<int:id>/remove-stock", methods=["POST"])
def remove_stock(id):
    try:
        item = Inventory.query.get_or_404(id)
        data = request.get_json()
        
        quantity = data.get("quantity", 0)
        reason = data.get("reason", "Remoção manual")
        
        if quantity <= 0:
            return jsonify({"error": "Quantidade deve ser maior que zero"}), 400
        
        result = item.remove_stock(quantity)
        
        if "error" in result:
            return jsonify(result), 400
        
        # Aqui você poderia registrar o motivo da remoção em um log
        
        db.session.commit()
        
        return jsonify({
            "inventory": item.to_dict(),
            "result": result,
            "reason": reason,
            "message": "Estoque removido com sucesso"
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 500

@inventory_bp.route("/inventory/<int:id>/reserve", methods=["POST"])
def reserve_stock(id):
    try:
        item = Inventory.query.get_or_404(id)
        data = request.get_json()
        
        quantity = data.get("quantity", 0)
        order_id = data.get("order_id")  # Para rastreamento
        
        if quantity <= 0:
            return jsonify({"error": "Quantidade deve ser maior que zero"}), 400
        
        result = item.reserve_quantity(quantity)
        
        if "error" in result:
            return jsonify(result), 400
        
        db.session.commit()
        
        return jsonify({
            "inventory": item.to_dict(),
            "result": result,
            "order_id": order_id,
            "message": "Estoque reservado com sucesso"
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 500

@inventory_bp.route("/inventory/<int:id>/release-reservation", methods=["POST"])
def release_reservation(id):
    try:
        item = Inventory.query.get_or_404(id)
        data = request.get_json()
        
        quantity = data.get("quantity", 0)
        order_id = data.get("order_id")  # Para rastreamento
        
        if quantity <= 0:
            return jsonify({"error": "Quantidade deve ser maior que zero"}), 400
        
        result = item.release_reservation(quantity)
        
        if "error" in result:
            return jsonify(result), 400
        
        db.session.commit()
        
        return jsonify({
            "inventory": item.to_dict(),
            "result": result,
            "order_id": order_id,
            "message": "Reserva liberada com sucesso"
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 500

@inventory_bp.route("/inventory/<int:id>/consume-reserved", methods=["POST"])
def consume_reserved(id):
    try:
        item = Inventory.query.get_or_404(id)
        data = request.get_json()
        
        quantity = data.get("quantity", 0)
        order_id = data.get("order_id")  # Para rastreamento
        
        if quantity <= 0:
            return jsonify({"error": "Quantidade deve ser maior que zero"}), 400
        
        result = item.consume_reserved(quantity)
        
        if "error" in result:
            return jsonify(result), 400
        
        db.session.commit()
        
        return jsonify({
            "inventory": item.to_dict(),
            "result": result,
            "order_id": order_id,
            "message": "Estoque consumido com sucesso"
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 500

@inventory_bp.route("/inventory/<int:id>", methods=["DELETE"])
def delete_inventory_item(id):
    try:
        item = Inventory.query.get_or_404(id)
        
        # Verificar se há estoque ou reservas
        if item.quantity_available > 0 or item.quantity_reserved > 0:
            return jsonify({
                "error": "Não é possível excluir item com estoque ou reservas. Remova todo o estoque primeiro."
            }), 400
        
        db.session.delete(item)
        db.session.commit()
        
        return jsonify({"message": "Item de estoque excluído com sucesso"}), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 500

@inventory_bp.route("/inventory/stats", methods=["GET"])
def get_inventory_stats():
    """Estatísticas do estoque"""
    try:
        total_items = Inventory.query.count()
        low_stock_items = len([item for item in Inventory.query.all() if item.is_low_stock()])
        
        # Valor total do estoque
        total_value = sum(item.calculate_total_value() for item in Inventory.query.all())
        
        # Itens com maior valor
        high_value_items = Inventory.query.all()
        high_value_items.sort(key=lambda x: x.calculate_total_value(), reverse=True)
        top_5_value = [item.to_dict() for item in high_value_items[:5]]
        
        return jsonify({
            "total_items": total_items,
            "low_stock_items": low_stock_items,
            "total_inventory_value": total_value,
            "top_value_items": top_5_value
        }), 200
        
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@inventory_bp.route("/inventory/low-stock", methods=["GET"])
def get_low_stock_items():
    """Itens com estoque baixo"""
    try:
        all_items = Inventory.query.all()
        low_stock_items = [item for item in all_items if item.is_low_stock()]
        
        return jsonify([item.to_dict() for item in low_stock_items]), 200
        
    except Exception as e:
        return jsonify({"error": str(e)}), 500


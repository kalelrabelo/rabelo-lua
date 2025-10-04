from flask import Blueprint, request, jsonify
from src.models.user import db
from sqlalchemy import text

discounts_bp = Blueprint("discounts", __name__)

@discounts_bp.route("/discounts", methods=["GET"])
def get_discounts():
    try:
        # Buscar todos os descontos da tabela discount_table
        result = db.session.execute(text("SELECT * FROM discount_table ORDER BY soma ASC"))
        discounts = []
        
        for row in result:
            discounts.append({
                'id': row.id,
                'soma': float(row.soma) if row.soma else 0,
                'desconto': float(row.desconto) if row.desconto else 0
            })
        
        return jsonify(discounts), 200
        
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@discounts_bp.route("/discounts/<int:id>", methods=["GET"])
def get_discount(id):
    try:
        result = db.session.execute(text("SELECT * FROM discount_table WHERE id = :id"), {"id": id})
        row = result.fetchone()
        
        if not row:
            return jsonify({"error": "Desconto não encontrado"}), 404
        
        discount = {
            'id': row.id,
            'soma': float(row.soma) if row.soma else 0,
            'desconto': float(row.desconto) if row.desconto else 0
        }
        
        return jsonify(discount), 200
        
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@discounts_bp.route("/discounts", methods=["POST"])
def create_discount():
    try:
        data = request.get_json()
        
        # Inserir novo desconto
        db.session.execute(text("""
            INSERT INTO discount_table (soma, desconto) 
            VALUES (:soma, :desconto)
        """), {
            "soma": float(data["soma"]),
            "desconto": float(data["desconto"])
        })
        
        db.session.commit()
        
        return jsonify({"message": "Desconto criado com sucesso"}), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 500

@discounts_bp.route("/discounts/<int:id>", methods=["PUT"])
def update_discount(id):
    try:
        data = request.get_json()
        
        # Atualizar desconto
        result = db.session.execute(text("""
            UPDATE discount_table 
            SET soma = :soma, desconto = :desconto 
            WHERE id = :id
        """), {
            "id": id,
            "soma": float(data["soma"]),
            "desconto": float(data["desconto"])
        })
        
        if result.rowcount == 0:
            return jsonify({"error": "Desconto não encontrado"}), 404
        
        db.session.commit()
        
        return jsonify({"message": "Desconto atualizado com sucesso"}), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 500

@discounts_bp.route("/discounts/<int:id>", methods=["DELETE"])
def delete_discount(id):
    try:
        # Excluir desconto
        result = db.session.execute(text("DELETE FROM discount_table WHERE id = :id"), {"id": id})
        
        if result.rowcount == 0:
            return jsonify({"error": "Desconto não encontrado"}), 404
        
        db.session.commit()
        
        return jsonify({"message": "Desconto excluído com sucesso"}), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 500

@discounts_bp.route("/discounts/calculate/<float:amount>", methods=["GET"])
def calculate_discount(amount):
    """Calcula o desconto aplicável para um valor específico"""
    try:
        # Buscar o maior desconto aplicável para o valor
        result = db.session.execute(text("""
            SELECT * FROM discount_table 
            WHERE soma <= :amount 
            ORDER BY soma DESC 
            LIMIT 1
        """), {"amount": amount})
        
        row = result.fetchone()
        
        if not row:
            return jsonify({
                "amount": amount,
                "discount_percentage": 0,
                "discount_amount": 0,
                "final_amount": amount
            }), 200
        
        discount_percentage = float(row.desconto)
        discount_amount = amount * (discount_percentage / 100)
        final_amount = amount - discount_amount
        
        return jsonify({
            "amount": amount,
            "discount_percentage": discount_percentage,
            "discount_amount": discount_amount,
            "final_amount": final_amount,
            "discount_rule": {
                "id": row.id,
                "minimum_amount": float(row.soma),
                "percentage": discount_percentage
            }
        }), 200
        
    except Exception as e:
        return jsonify({"error": str(e)}), 500

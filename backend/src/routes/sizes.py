from flask import Blueprint, request, jsonify
from src.models.user import db
from src.models.size import Size

sizes_bp = Blueprint("sizes", __name__)

@sizes_bp.route("/sizes", methods=["GET"])
def get_sizes():
    """Listar todos os tamanhos"""
    try:
        sizes = Size.query.all()
        return jsonify([size.to_dict() for size in sizes])
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@sizes_bp.route("/sizes", methods=["POST"])
def create_size():
    """Criar um novo tamanho"""
    try:
        data = request.get_json()
        new_size = Size(
            name=data.get("name"),
            description=data.get("description")
        )
        db.session.add(new_size)
        db.session.commit()
        return jsonify(new_size.to_dict()), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 500

@sizes_bp.route("/sizes/<int:size_id>", methods=["PUT"])
def update_size(size_id):
    """Atualizar um tamanho existente"""
    try:
        size = Size.query.get_or_404(size_id)
        data = request.get_json()
        size.name = data.get("name", size.name)
        size.description = data.get("description", size.description)
        db.session.commit()
        return jsonify(size.to_dict())
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 500

@sizes_bp.route("/sizes/<int:size_id>", methods=["DELETE"])
def delete_size(size_id):
    """Deletar um tamanho"""
    try:
        size = Size.query.get_or_404(size_id)
        db.session.delete(size)
        db.session.commit()
        return jsonify({"message": "Tamanho deletado com sucesso"}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 500

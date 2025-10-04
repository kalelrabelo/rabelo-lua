from flask import Blueprint, request, jsonify
from src.models.user import db
from src.models.payment import Payment

payments_bp = Blueprint("payments", __name__)

@payments_bp.route("/payments", methods=["POST"])
def create_payment():
    data = request.get_json()
    new_payment = Payment(employee_id=data["employee_id"], amount=data["amount"], date=data["date"], description=data.get("description"))
    db.session.add(new_payment)
    db.session.commit()
    return jsonify(new_payment.to_dict()), 201

@payments_bp.route("/payments", methods=["GET"])
def get_payments():
    payments = Payment.query.all()
    return jsonify([payment.to_dict() for payment in payments]), 200

@payments_bp.route("/payments/<int:id>", methods=["DELETE"])
def delete_payment(id):
    payment = Payment.query.get_or_404(id)
    db.session.delete(payment)
    db.session.commit()
    return jsonify({"message": "Payment deleted"}), 200




@payments_bp.route("/payments/<int:payment_id>", methods=["PUT"])
def update_payment(payment_id):
    """Update a payment"""
    try:
        payment = Payment.query.get(payment_id)

        if not payment:
            return jsonify({'error': 'Pagamento não encontrado'}), 404

        data = request.get_json()

        # Update fields if provided
        if 'amount' in data:
            payment.amount = data['amount']
        if 'method' in data:
            payment.method = data['method']
        if 'status' in data:
            payment.status = data['status']
        if 'notes' in data:
            payment.notes = data['notes']

        db.session.commit()

        return jsonify({
            'message': 'Pagamento atualizado com sucesso',
            'payment': {
                'id': payment.id,
                'amount': float(payment.amount),
                'method': payment.method,
                'status': payment.status,
                'notes': payment.notes,
                'created_at': payment.created_at.isoformat()
            }
        }), 200

    except Exception as e:
        print(f"Erro ao atualizar pagamento: {str(e)}")
        return jsonify({'error': 'Erro interno do servidor'}), 500

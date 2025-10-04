from flask import Blueprint, request, jsonify
from src.models.user import db
from src.models.payroll import Payroll
from src.models.employee import Employee
from src.models.payment import Payment
from src.models.vale import Vale
from datetime import datetime

payroll_bp = Blueprint("payroll", __name__)

@payroll_bp.route("/payroll", methods=["GET"])
def get_payrolls():
    """Buscar todas as folhas de pagamento"""
    try:
        month = request.args.get('month', type=int)
        year = request.args.get('year', type=int)
        employee_id = request.args.get('employee_id', type=int)
        
        query = Payroll.query
        
        if month:
            query = query.filter(Payroll.month == month)
        if year:
            query = query.filter(Payroll.year == year)
        if employee_id:
            query = query.filter(Payroll.employee_id == employee_id)
            
        payrolls = query.all()
        return jsonify([payroll.to_dict() for payroll in payrolls]), 200
        
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@payroll_bp.route("/payroll/<int:id>", methods=["GET"])
def get_payroll(id):
    """Buscar folha de pagamento específica"""
    try:
        payroll = Payroll.query.get_or_404(id)
        return jsonify(payroll.to_dict()), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@payroll_bp.route("/payroll", methods=["POST"])
def create_payroll():
    """Criar nova folha de pagamento"""
    try:
        data = request.get_json()
        
        # Verificar se o funcionário existe
        employee = Employee.query.get(data["employee_id"])
        if not employee:
            return jsonify({"error": "Funcionário não encontrado"}), 404
        
        # Verificar se já existe folha para este mês/ano
        existing_payroll = Payroll.query.filter_by(
            employee_id=data["employee_id"],
            month=data["month"],
            year=data["year"]
        ).first()
        
        if existing_payroll:
            return jsonify({"error": "Folha de pagamento já existe para este período"}), 400
        
        new_payroll = Payroll(
            employee_id=data["employee_id"],
            month=data["month"],
            year=data["year"],
            base_salary=data.get("base_salary", employee.salary or 0.0),
            total_vales=0.0,
            net_salary=data.get("base_salary", employee.salary or 0.0)
        )
        
        # Atualizar total de vales automaticamente
        new_payroll.update_vales_total()
        
        db.session.add(new_payroll)
        db.session.commit()
        
        return jsonify(new_payroll.to_dict()), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 500

@payroll_bp.route("/payroll/<int:id>", methods=["PUT"])
def update_payroll(id):
    """Atualizar folha de pagamento"""
    try:
        payroll = Payroll.query.get_or_404(id)
        data = request.get_json()
        
        payroll.base_salary = data.get("base_salary", payroll.base_salary)
        
        # Recalcular vales e salário líquido
        payroll.update_vales_total()
        
        db.session.commit()
        
        return jsonify(payroll.to_dict()), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 500

@payroll_bp.route("/payroll/<int:id>/recalculate", methods=["POST"])
def recalculate_payroll(id):
    """Recalcular folha de pagamento (vales e salário líquido)"""
    try:
        payroll = Payroll.query.get_or_404(id)
        
        # Recalcular vales e salário líquido
        payroll.update_vales_total()
        
        db.session.commit()
        
        return jsonify({
            "message": "Folha de pagamento recalculada",
            "payroll": payroll.to_dict()
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 500

@payroll_bp.route("/payroll/<int:id>", methods=["DELETE"])
def delete_payroll(id):
    """Excluir folha de pagamento"""
    try:
        payroll = Payroll.query.get_or_404(id)
        db.session.delete(payroll)
        db.session.commit()
        
        return jsonify({"message": "Folha de pagamento excluída"}), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 500

@payroll_bp.route("/payroll/employee/<int:employee_id>/current", methods=["GET"])
def get_current_payroll(employee_id):
    """Buscar folha de pagamento do mês atual para um funcionário"""
    try:
        current_date = datetime.now()
        current_month = current_date.month
        current_year = current_date.year
        
        payroll = Payroll.query.filter_by(
            employee_id=employee_id,
            month=current_month,
            year=current_year
        ).first()
        
        if not payroll:
            # Criar folha de pagamento automaticamente se não existir
            employee = Employee.query.get(employee_id)
            if not employee:
                return jsonify({"error": "Funcionário não encontrado"}), 404
                
            payroll = Payroll(
                employee_id=employee_id,
                month=current_month,
                year=current_year,
                base_salary=employee.salary or 0.0,
                total_vales=0.0,
                net_salary=employee.salary or 0.0
            )
            
            payroll.update_vales_total()
            db.session.add(payroll)
            db.session.commit()
        
        return jsonify(payroll.to_dict()), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 500

@payroll_bp.route("/payroll/<int:employee_id>/note", methods=["GET"])
def get_payroll_note(employee_id):
    """Gerar nota de folha de pagamento para um funcionário (compatibilidade)"""
    try:
        employee = Employee.query.get_or_404(employee_id)
        
        # Buscar pagamentos do funcionário
        payments = Payment.query.filter_by(employee_id=employee_id).all()
        
        # Buscar vales do funcionário
        vales = Vale.query.filter_by(employee_id=employee_id).all()
        
        # Calcular totais
        total_payments = sum(payment.amount for payment in payments)
        total_vales = sum(vale.amount for vale in vales)
        
        payroll_note = {
            "employee": employee.to_dict(),
            "payments": [payment.to_dict() for payment in payments],
            "vales": [vale.to_dict() for vale in vales],
            "total_payments": total_payments,
            "total_vales": total_vales,
            "net_amount": total_payments - total_vales
        }
        
        return jsonify(payroll_note), 200
        
    except Exception as e:
        return jsonify({"error": str(e)}), 500


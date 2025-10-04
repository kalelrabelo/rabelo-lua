from flask import Blueprint, request, jsonify
from src.models.user import db
from src.models.employee import Employee
from src.models.payroll import Payroll
from datetime import datetime

employees_bp = Blueprint("employees", __name__)

@employees_bp.route("/employees", methods=["POST"])
def create_employee():
    try:
        data = request.get_json()
        new_employee = Employee(
            name=data["name"], 
            cpf=data["cpf"], 
            role=data.get("role"), 
            salary=data.get("salary", 0.0)
        )
        db.session.add(new_employee)
        db.session.flush()  # Para obter o ID do funcionário
        
        # Criar folha de pagamento automaticamente para o mês atual
        current_date = datetime.now()
        current_month = current_date.month
        current_year = current_date.year
        
        # Verificar se já existe folha de pagamento para este mês
        existing_payroll = Payroll.query.filter_by(
            employee_id=new_employee.id,
            month=current_month,
            year=current_year
        ).first()
        
        if not existing_payroll:
            new_payroll = Payroll(
                employee_id=new_employee.id,
                month=current_month,
                year=current_year,
                base_salary=new_employee.salary or 0.0,
                total_vales=0.0,
                net_salary=new_employee.salary or 0.0
            )
            db.session.add(new_payroll)
        
        db.session.commit()
        
        return jsonify({
            "employee": new_employee.to_dict(),
            "message": "Funcionário criado e folha de pagamento gerada automaticamente"
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 500

@employees_bp.route("/employees", methods=["GET"])
def get_employees():
    employees = Employee.query.all()
    return jsonify([employee.to_dict() for employee in employees]), 200

@employees_bp.route("/employees/<int:id>", methods=["DELETE"])
def delete_employee(id):
    try:
        employee = Employee.query.get_or_404(id)
        
        # Importar os modelos necessários
        from src.models.payment import Payment
        from src.models.vale import Vale
        
        # Excluir todos os pagamentos relacionados ao funcionário
        Payment.query.filter_by(employee_id=id).delete()
        
        # Excluir todos os vales relacionados ao funcionário
        Vale.query.filter_by(employee_id=id).delete()
        
        # Agora excluir o funcionário
        db.session.delete(employee)
        db.session.commit()
        
        return jsonify({"message": "Employee deleted"}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 500




@employees_bp.route("/employees/<int:id>", methods=["PUT"])
def update_employee(id):
    employee = Employee.query.get_or_404(id)
    data = request.get_json()
    employee.name = data.get("name", employee.name)
    employee.cpf = data.get("cpf", employee.cpf)
    employee.role = data.get("role", employee.role)
    employee.salary = data.get("salary", employee.salary)
    db.session.commit()
    return jsonify(employee.to_dict()), 200



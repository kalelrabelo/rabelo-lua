from flask import Blueprint, request, jsonify
from src.models.user import db
from src.models.vale import Vale
from src.models.employee import Employee
from datetime import datetime

vales_bp = Blueprint("vales", __name__)

@vales_bp.route("/vales", methods=["POST"])
def create_vale():
    try:
        data = request.get_json()
        
        # Verificar se o funcionário existe
        employee = Employee.query.get(data["employee_id"])
        if not employee:
            return jsonify({"error": "Funcionário não encontrado"}), 404
        
        # Converter data string para datetime se necessário
        vale_date = data.get("date")
        if isinstance(vale_date, str):
            try:
                vale_date = datetime.fromisoformat(vale_date.replace('Z', '+00:00'))
            except:
                vale_date = datetime.strptime(vale_date, '%Y-%m-%d')
        elif not vale_date:
            vale_date = datetime.now()
        
        new_vale = Vale(
            employee_id=data["employee_id"], 
            amount=data["amount"], 
            date=vale_date, 
            description=data.get("description")
        )
        
        db.session.add(new_vale)
        db.session.flush()  # Para obter o ID do vale
        
        # Atualizar folha de pagamento automaticamente
        payroll = new_vale.update_payroll()
        
        db.session.commit()
        
        return jsonify({
            "vale": new_vale.to_dict(),
            "message": "Vale criado e folha de pagamento atualizada automaticamente",
            "payroll_updated": payroll.to_dict() if payroll else None
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 500

@vales_bp.route("/vales", methods=["GET"])
def get_vales():
    try:
        employee_id = request.args.get('employee_id', type=int)
        month = request.args.get('month', type=int)
        year = request.args.get('year', type=int)
        
        query = Vale.query
        
        if employee_id:
            query = query.filter(Vale.employee_id == employee_id)
        if month and year:
            query = query.filter(
                db.extract('month', Vale.date) == month,
                db.extract('year', Vale.date) == year
            )
        elif year:
            query = query.filter(db.extract('year', Vale.date) == year)
            
        vales = query.all()
        return jsonify([vale.to_dict() for vale in vales]), 200
        
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@vales_bp.route("/vales/<int:id>", methods=["GET"])
def get_vale(id):
    try:
        vale = Vale.query.get_or_404(id)
        return jsonify(vale.to_dict()), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@vales_bp.route("/vales/<int:id>", methods=["PUT"])
def update_vale(id):
    try:
        vale = Vale.query.get_or_404(id)
        data = request.get_json()
        
        # Armazenar dados antigos para recalcular folha de pagamento
        old_employee_id = vale.employee_id
        old_date = vale.date
        
        # Atualizar dados do vale
        vale.employee_id = data.get("employee_id", vale.employee_id)
        vale.amount = data.get("amount", vale.amount)
        vale.description = data.get("description", vale.description)
        
        # Atualizar data se fornecida
        if "date" in data:
            vale_date = data["date"]
            if isinstance(vale_date, str):
                try:
                    vale_date = datetime.fromisoformat(vale_date.replace('Z', '+00:00'))
                except:
                    vale_date = datetime.strptime(vale_date, '%Y-%m-%d')
            vale.date = vale_date
        
        # Atualizar folha de pagamento do funcionário antigo (se mudou)
        if old_employee_id != vale.employee_id:
            # Recalcular folha do funcionário antigo
            from src.models.payroll import Payroll
            old_payroll = Payroll.query.filter_by(
                employee_id=old_employee_id,
                month=old_date.month,
                year=old_date.year
            ).first()
            if old_payroll:
                old_payroll.update_vales_total()
        
        # Atualizar folha de pagamento do funcionário atual
        payroll = vale.update_payroll()
        
        db.session.commit()
        
        return jsonify({
            "vale": vale.to_dict(),
            "message": "Vale atualizado e folha de pagamento recalculada",
            "payroll_updated": payroll.to_dict() if payroll else None
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 500

@vales_bp.route("/vales/<int:id>", methods=["DELETE"])
def delete_vale(id):
    try:
        vale = Vale.query.get_or_404(id)
        
        # Armazenar dados para recalcular folha de pagamento
        employee_id = vale.employee_id
        vale_date = vale.date
        
        db.session.delete(vale)
        db.session.flush()
        
        # Recalcular folha de pagamento após exclusão
        from src.models.payroll import Payroll
        payroll = Payroll.query.filter_by(
            employee_id=employee_id,
            month=vale_date.month,
            year=vale_date.year
        ).first()
        
        if payroll:
            payroll.update_vales_total()
        
        db.session.commit()
        
        return jsonify({
            "message": "Vale excluído e folha de pagamento recalculada",
            "payroll_updated": payroll.to_dict() if payroll else None
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 500

@vales_bp.route("/vales/employee/<int:employee_id>", methods=["GET"])
def get_vales_by_employee(employee_id):
    """Buscar todos os vales de um funcionário específico"""
    try:
        employee = Employee.query.get_or_404(employee_id)
        vales = Vale.query.filter_by(employee_id=employee_id).all()
        
        return jsonify({
            "employee": employee.to_dict(),
            "vales": [vale.to_dict() for vale in vales],
            "total_vales": sum(vale.amount for vale in vales)
        }), 200
        
    except Exception as e:
        return jsonify({"error": str(e)}), 500



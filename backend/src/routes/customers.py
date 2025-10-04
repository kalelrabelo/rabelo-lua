from flask import Blueprint, request, jsonify
from src.models.customer import Customer
from src.models.user import db

customers_bp = Blueprint('customers', __name__)

@customers_bp.route("/customers", methods=["POST"])
def create_customer():
    """Create a new customer"""
    try:
        data = request.get_json()

        # Validação de campos obrigatórios
        required_fields = ['name', 'email']
        for field in required_fields:
            if field not in data or not data[field]:
                return jsonify({'error': f'Campo {field} é obrigatório'}), 400

        # Verificar se email já existe
        existing_customer = Customer.query.filter_by(email=data['email']).first()
        if existing_customer:
            return jsonify({'error': 'Email já cadastrado'}), 409

        # Criar novo customer
        customer = Customer(
            name=data['name'],
            email=data['email'],
            phone=data.get('phone', ''),
            address=data.get('address', ''),
            city=data.get('city', ''),
            state=data.get('state', ''),
            zip_code=data.get('zip_code', ''),
            cpf=data.get('cpf', ''),
            birth_date=data.get('birth_date'),
            notes=data.get('notes', '')
        )

        db.session.add(customer)
        db.session.commit()

        return jsonify({
            'message': 'Cliente criado com sucesso',
            'customer': {
                'id': customer.id,
                'name': customer.name,
                'email': customer.email,
                'phone': customer.phone,
                'address': customer.address,
                'city': customer.city,
                'state': customer.state,
                'zip_code': customer.zip_code,
                'cpf': customer.cpf,
                'birth_date': customer.birth_date.isoformat() if customer.birth_date else None,
                'notes': customer.notes,
                'created_at': customer.created_at.isoformat()
            }
        }), 201

    except Exception as e:
        print(f"Erro ao criar customer: {str(e)}")
        return jsonify({'error': 'Erro interno do servidor'}), 500

@customers_bp.route("/customers", methods=["GET"])
def get_customers():
    """Get all customers"""
    try:
        # Simple query without pagination for now
        customers = Customer.query.all()
        
        customers_list = []
        for customer in customers:
            customers_list.append({
                'id': customer.id,
                'name': customer.name,
                'email': customer.email,
                'phone': customer.phone if hasattr(customer, 'phone') else '',
                'address': customer.address if hasattr(customer, 'address') else '',
                'city': customer.city if hasattr(customer, 'city') else '',
                'state': customer.state if hasattr(customer, 'state') else '',
                'zip_code': customer.zip_code if hasattr(customer, 'zip_code') else '',
                'cpf': customer.cpf if hasattr(customer, 'cpf') else '',
                'birth_date': customer.birth_date.isoformat() if hasattr(customer, 'birth_date') and customer.birth_date else None,
                'notes': customer.notes if hasattr(customer, 'notes') else '',
                'created_at': customer.created_at.isoformat() if hasattr(customer, 'created_at') else ''
            })

        return jsonify(customers_list), 200

    except Exception as e:
        print(f"Erro ao buscar customers: {str(e)}")
        return jsonify({'error': 'Erro interno do servidor'}), 500

@customers_bp.route("/customers/<int:customer_id>", methods=["GET"])
def get_customer(customer_id):
    """Get a specific customer by ID"""
    try:
        customer = Customer.query.get(customer_id)

        if not customer:
            return jsonify({'error': 'Cliente não encontrado'}), 404

        return jsonify({
            'customer': {
                'id': customer.id,
                'name': customer.name,
                'email': customer.email,
                'phone': customer.phone,
                'address': customer.address,
                'city': customer.city,
                'state': customer.state,
                'zip_code': customer.zip_code,
                'cpf': customer.cpf,
                'birth_date': customer.birth_date.isoformat() if customer.birth_date else None,
                'notes': customer.notes,
                'created_at': customer.created_at.isoformat()
            }
        }), 200

    except Exception as e:
        print(f"Erro ao buscar customer: {str(e)}")
        return jsonify({'error': 'Erro interno do servidor'}), 500

@customers_bp.route("/customers/<int:customer_id>", methods=["PUT"])
def update_customer(customer_id):
    """Update a customer"""
    try:
        customer = Customer.query.get(customer_id)

        if not customer:
            return jsonify({'error': 'Cliente não encontrado'}), 404

        data = request.get_json()

        # Verificar se email já existe em outro customer
        if 'email' in data and data['email'] != customer.email:
            existing_customer = Customer.query.filter_by(email=data['email']).first()
            if existing_customer:
                return jsonify({'error': 'Email já cadastrado'}), 409

        # Atualizar campos
        if 'name' in data:
            customer.name = data['name']
        if 'email' in data:
            customer.email = data['email']
        if 'phone' in data:
            customer.phone = data['phone']
        if 'address' in data:
            customer.address = data['address']
        if 'city' in data:
            customer.city = data['city']
        if 'state' in data:
            customer.state = data['state']
        if 'zip_code' in data:
            customer.zip_code = data['zip_code']
        if 'cpf' in data:
            customer.cpf = data['cpf']
        if 'birth_date' in data:
            customer.birth_date = data['birth_date']
        if 'notes' in data:
            customer.notes = data['notes']

        db.session.commit()

        return jsonify({
            'message': 'Cliente atualizado com sucesso',
            'customer': {
                'id': customer.id,
                'name': customer.name,
                'email': customer.email,
                'phone': customer.phone,
                'address': customer.address,
                'city': customer.city,
                'state': customer.state,
                'zip_code': customer.zip_code,
                'cpf': customer.cpf,
                'birth_date': customer.birth_date.isoformat() if customer.birth_date else None,
                'notes': customer.notes,
                'created_at': customer.created_at.isoformat()
            }
        }), 200

    except Exception as e:
        print(f"Erro ao atualizar customer: {str(e)}")
        return jsonify({'error': 'Erro interno do servidor'}), 500

@customers_bp.route("/customers/<int:customer_id>", methods=["DELETE"])
def delete_customer(customer_id):
    """Delete a customer"""
    try:
        customer = Customer.query.get(customer_id)

        if not customer:
            return jsonify({'error': 'Cliente não encontrado'}), 404

        # Check if customer has orders before deleting
        from src.models.order import Order
        has_orders = Order.query.filter_by(customer_id=customer_id).first()

        if has_orders:
            return jsonify({
                'error': 'Não é possível excluir cliente com pedidos associados'
            }), 409

        db.session.delete(customer)
        db.session.commit()

        return jsonify({'message': 'Cliente excluído com sucesso'}), 200

    except Exception as e:
        print(f"Erro ao deletar customer: {str(e)}")
        return jsonify({'error': 'Erro interno do servidor'}), 500

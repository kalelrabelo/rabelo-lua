from flask import Blueprint, request, jsonify
from src.models.user import db
from src.models.financial import FinancialTransaction, ProductionReport, AdvancedOrder, DiscountTable, CostCalculation
from datetime import datetime

financial_bp = Blueprint('financial', __name__)

# Rotas para Transações Financeiras
@financial_bp.route('/financial/transactions', methods=['GET'])
def get_financial_transactions():
    try:
        page = request.args.get('page', 1, type=int)
        per_page = request.args.get('per_page', 50, type=int)
        
        transactions = FinancialTransaction.query.paginate(
            page=page, per_page=per_page, error_out=False
        )
        
        return jsonify({
            'transactions': [t.to_dict() for t in transactions.items],
            'total': transactions.total,
            'pages': transactions.pages,
            'current_page': page
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@financial_bp.route('/financial/transactions', methods=['POST'])
def create_financial_transaction():
    try:
        data = request.get_json()
        
        transaction = FinancialTransaction(
            data=datetime.fromisoformat(data.get('data', datetime.now().isoformat())),
            mes=data.get('mes'),
            ano=data.get('ano'),
            valor1=data.get('valor1'),
            valor2=data.get('valor2'),
            valor=data.get('valor', 'R$'),
            imposto=data.get('imposto'),
            imposto2=data.get('imposto2'),
            imposto3=data.get('imposto3'),
            descricao=data.get('descricao'),
            grupo1=data.get('grupo1'),
            grupo2=data.get('grupo2'),
            idc=data.get('idc'),
            nome=data.get('nome'),
            noticia=data.get('noticia'),
            caixa=data.get('caixa', 0.0)
        )
        
        db.session.add(transaction)
        db.session.commit()
        
        return jsonify(transaction.to_dict()), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@financial_bp.route('/financial/transactions/<int:transaction_id>', methods=['PUT'])
def update_financial_transaction(transaction_id):
    try:
        transaction = FinancialTransaction.query.get_or_404(transaction_id)
        data = request.get_json()
        
        for key, value in data.items():
            if hasattr(transaction, key):
                if key == 'data' and value:
                    setattr(transaction, key, datetime.fromisoformat(value))
                else:
                    setattr(transaction, key, value)
        
        db.session.commit()
        return jsonify(transaction.to_dict())
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@financial_bp.route('/financial/transactions/<int:transaction_id>', methods=['DELETE'])
def delete_financial_transaction(transaction_id):
    try:
        transaction = FinancialTransaction.query.get_or_404(transaction_id)
        db.session.delete(transaction)
        db.session.commit()
        return jsonify({'message': 'Transação deletada com sucesso'})
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

# Rotas para Relatórios de Produção
@financial_bp.route('/financial/production-reports', methods=['GET'])
def get_production_reports():
    try:
        page = request.args.get('page', 1, type=int)
        per_page = request.args.get('per_page', 20, type=int)
        
        reports = ProductionReport.query.order_by(ProductionReport.data.desc()).paginate(
            page=page, per_page=per_page, error_out=False
        )
        
        return jsonify({
            'reports': [r.to_dict() for r in reports.items],
            'total': reports.total,
            'pages': reports.pages,
            'current_page': page
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@financial_bp.route('/financial/production-reports', methods=['POST'])
def create_production_report():
    try:
        data = request.get_json()
        
        report = ProductionReport(
            data=datetime.fromisoformat(data.get('data', datetime.now().isoformat())),
            lugar=data.get('lugar'),
            assunto=data.get('assunto'),
            mensagem=data.get('mensagem'),
            autor=data.get('autor'),
            estado=data.get('estado', 'OK'),
            noticia=data.get('noticia')
        )
        
        db.session.add(report)
        db.session.commit()
        
        return jsonify(report.to_dict()), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

# Rotas para Encomendas Avançadas
@financial_bp.route('/financial/advanced-orders', methods=['GET'])
def get_advanced_orders():
    try:
        page = request.args.get('page', 1, type=int)
        per_page = request.args.get('per_page', 20, type=int)
        
        orders = AdvancedOrder.query.order_by(AdvancedOrder.data_encomenda.desc()).paginate(
            page=page, per_page=per_page, error_out=False
        )
        
        return jsonify({
            'orders': [o.to_dict() for o in orders.items],
            'total': orders.total,
            'pages': orders.pages,
            'current_page': page
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@financial_bp.route('/financial/advanced-orders', methods=['POST'])
def create_advanced_order():
    try:
        data = request.get_json()
        
        order = AdvancedOrder(
            idc=data.get('idc'),
            data_encomenda=datetime.fromisoformat(data.get('data_encomenda', datetime.now().isoformat())),
            modo_encomenda=data.get('modo_encomenda'),
            pessoala=data.get('pessoala'),
            pessoaaqui=data.get('pessoaaqui'),
            praco=datetime.fromisoformat(data['praco']) if data.get('praco') else None,
            estado_encomenda=data.get('estado_encomenda', 'novo'),
            noticia=data.get('noticia'),
            ultimanota=data.get('ultimanota', 0),
            imposto1=data.get('imposto1'),
            imposto1v=data.get('imposto1v'),
            imposto2=data.get('imposto2'),
            imposto2v=data.get('imposto2v'),
            imposto3=data.get('imposto3'),
            imposto3v=data.get('imposto3v'),
            imposto4=data.get('imposto4'),
            imposto4v=data.get('imposto4v'),
            imposto5=data.get('imposto5'),
            imposto5v=data.get('imposto5v'),
            imposto6=data.get('imposto6'),
            imposto6v=data.get('imposto6v'),
            desconto_encomenda=data.get('desconto_encomenda', 0.0),
            valor_total_encomenda=data.get('valor_total_encomenda', 'R$'),
            cambio=data.get('cambio', 1.0),
            praco1=data.get('praco1', 30),
            praco1f=data.get('praco1f', 1.1),
            praco2=data.get('praco2', 60),
            praco2f=data.get('praco2f', 1.15),
            praco3=data.get('praco3', 90),
            praco3f=data.get('praco3f', 1.2),
            taxa1v=data.get('taxa1v', 0),
            taxa2v=data.get('taxa2v', 0),
            taxa3v=data.get('taxa3v', 0),
            entregaonde=data.get('entregaonde'),
            fabricarate=datetime.fromisoformat(data['fabricarate']) if data.get('fabricarate') else None
        )
        
        db.session.add(order)
        db.session.commit()
        
        return jsonify(order.to_dict()), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

# Rotas para Tabela de Descontos
@financial_bp.route('/financial/discounts', methods=['GET'])
def get_discounts():
    try:
        discounts = DiscountTable.query.order_by(DiscountTable.soma.asc()).all()
        return jsonify([d.to_dict() for d in discounts])
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@financial_bp.route('/financial/discounts', methods=['POST'])
def create_discount():
    try:
        data = request.get_json()
        
        discount = DiscountTable(
            soma=data.get('soma'),
            desconto=data.get('desconto')
        )
        
        db.session.add(discount)
        db.session.commit()
        
        return jsonify(discount.to_dict()), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

# Rotas para Cálculos de Custo
@financial_bp.route('/financial/cost-calculations', methods=['GET'])
def get_cost_calculations():
    try:
        calculations = CostCalculation.query.order_by(CostCalculation.ano.desc(), CostCalculation.mes.desc()).all()
        return jsonify([c.to_dict() for c in calculations])
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@financial_bp.route('/financial/cost-calculations', methods=['POST'])
def create_cost_calculation():
    try:
        data = request.get_json()
        
        calculation = CostCalculation(
            ano=data.get('ano'),
            mes=data.get('mes'),
            empregados=data.get('empregados'),
            horas_por_semana=data.get('horas_por_semana'),
            rs_por_hora=data.get('rs_por_hora')
        )
        
        db.session.add(calculation)
        db.session.commit()
        
        return jsonify(calculation.to_dict()), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

# Rota para estatísticas financeiras
@financial_bp.route('/financial/stats', methods=['GET'])
def get_financial_stats():
    try:
        # Estatísticas básicas
        total_transactions = FinancialTransaction.query.count()
        total_reports = ProductionReport.query.count()
        total_orders = AdvancedOrder.query.count()
        
        # Soma de entradas e saídas
        entradas = db.session.query(db.func.sum(FinancialTransaction.valor1)).filter(
            FinancialTransaction.valor1 > 0
        ).scalar() or 0
        
        saidas = db.session.query(db.func.sum(FinancialTransaction.valor1)).filter(
            FinancialTransaction.valor1 < 0
        ).scalar() or 0
        
        return jsonify({
            'total_transactions': total_transactions,
            'total_reports': total_reports,
            'total_orders': total_orders,
            'entradas': entradas,
            'saidas': abs(saidas),
            'saldo': entradas + saidas
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 500


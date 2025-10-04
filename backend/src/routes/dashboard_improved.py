from flask import Blueprint, jsonify
from src.models.user import db
from src.models.jewelry import Jewelry
from src.models.order import Order
from src.models.customer import Customer
from src.models.inventory import Inventory
from src.models.cost import Cost, Profit
from src.models.financial import FinancialTransaction
from sqlalchemy import func
from datetime import datetime, timedelta

dashboard_bp = Blueprint('dashboard', __name__)

@dashboard_bp.route('/dashboard/overview', methods=['GET'])
def get_dashboard_overview():
    """Get dashboard overview with real-time statistics"""
    try:
        # Calculate current month date range
        today = datetime.now()
        first_day_month = datetime(today.year, today.month, 1)

        # Vendas do mês (from FinancialTransaction or Order)
        vendas_mes = db.session.query(
            func.coalesce(func.sum(Order.total_price), 0)
        ).filter(
            Order.created_at >= first_day_month,
            Order.status.in_(['completed', 'paid'])
        ).scalar() or 0

        # Total de vendas (all time)
        vendas_total = db.session.query(
            func.coalesce(func.sum(Order.total_price), 0)
        ).filter(
            Order.status.in_(['completed', 'paid'])
        ).scalar() or 0

        # Estoque total
        estoque_total = db.session.query(
            func.coalesce(func.sum(Inventory.quantidade), 0)
        ).scalar() or 0

        # Itens com baixo estoque (menos que 5 unidades)
        estoque_baixo = db.session.query(
            func.count(Inventory.id)
        ).filter(Inventory.quantidade < 5).scalar() or 0

        # Clientes totais e ativos
        clientes_total = db.session.query(func.count(Customer.id)).scalar() or 0

        # Clientes ativos (que fizeram pedidos nos últimos 6 meses)
        six_months_ago = today - timedelta(days=180)
        clientes_ativos = db.session.query(
            func.count(func.distinct(Order.customer_id))
        ).filter(Order.created_at >= six_months_ago).scalar() or 0

        # Encomendas pendentes
        encomendas_pendentes = db.session.query(
            func.count(Order.id)
        ).filter(Order.status == 'pending').scalar() or 0

        # Encomendas totais
        encomendas_total = db.session.query(func.count(Order.id)).scalar() or 0

        # Dados para gráficos - distribuição de joias por tipo
        jewelry_types = db.session.query(
            Jewelry.type,
            func.count(Jewelry.id).label('count')
        ).group_by(Jewelry.type).all()

        jewelry_distribution = [
            {'nome': tipo or 'Outros', 'valor': count, 'cor': '#8884d8'}
            for tipo, count in jewelry_types
        ]

        # Vendas dos últimos 6 meses
        monthly_sales = []
        for i in range(6):
            month_start = datetime(today.year, today.month - i, 1) if today.month > i else datetime(today.year - 1, today.month - i + 12, 1)
            month_end = datetime(month_start.year, month_start.month + 1, 1) if month_start.month < 12 else datetime(month_start.year + 1, 1, 1)

            sales = db.session.query(
                func.coalesce(func.sum(Order.total_price), 0)
            ).filter(
                Order.created_at >= month_start,
                Order.created_at < month_end,
                Order.status.in_(['completed', 'paid'])
            ).scalar() or 0

            monthly_sales.append({
                'mes': month_start.strftime('%b'),
                'vendas': float(sales)
            })

        monthly_sales.reverse()  # Ordem cronológica

        return jsonify({
            'vendas': {
                'total': float(vendas_total),
                'mes': float(vendas_mes)
            },
            'estoque': {
                'total': int(estoque_total),
                'baixo': int(estoque_baixo)
            },
            'clientes': {
                'total': int(clientes_total),
                'ativos': int(clientes_ativos)
            },
            'encomendas': {
                'total': int(encomendas_total),
                'pendentes': int(encomendas_pendentes)
            },
            'graficos': {
                'jewelry_distribution': jewelry_distribution,
                'monthly_sales': monthly_sales
            },
            'ultima_atualizacao': datetime.now().isoformat()
        })

    except Exception as e:
        print(f"Erro no dashboard overview: {str(e)}")
        return jsonify({
            'error': 'Erro interno do servidor',
            'message': str(e)
        }), 500

# Keep other existing dashboard routes...

from flask import Blueprint, jsonify
from src.models.user import db
from src.models.jewelry import Jewelry
from src.models.material import Material
from src.models.pattern import Pattern
from src.models.stone import Stone

dashboard_bp = Blueprint('dashboard', __name__)

@dashboard_bp.route('/dashboard/overview', methods=['GET'])
def get_dashboard_overview():
    """Obter visão geral do dashboard"""
    try:
        # Contadores principais
        total_jewelry = Jewelry.query.count()
        total_materials = Material.query.count()
        total_patterns = Pattern.query.count()
        total_stones = Stone.query.count()
        
        # Joias visíveis
        visible_jewelry = Jewelry.query.filter(Jewelry.escondido == False).count()
        
        # Itens para web
        web_jewelry = Jewelry.query.filter(Jewelry.webexport == True).count()
        web_materials = Material.query.filter(Material.webexport == True).count()
        web_stones = Stone.query.filter(Stone.webexport == True).count()
        
        # Preços médios
        avg_jewelry_price = db.session.query(db.func.avg(Jewelry.preco2)).scalar() or 0
        avg_material_price = db.session.query(db.func.avg(Material.precopordimensao)).scalar() or 0
        avg_stone_price = db.session.query(db.func.avg(Stone.preco)).scalar() or 0
        
        return jsonify({
            'totals': {
                'jewelry': total_jewelry,
                'materials': total_materials,
                'patterns': total_patterns,
                'stones': total_stones
            },
            'visibility': {
                'visible_jewelry': visible_jewelry,
                'hidden_jewelry': total_jewelry - visible_jewelry
            },
            'web_export': {
                'jewelry': web_jewelry,
                'materials': web_materials,
                'stones': web_stones
            },
            'average_prices': {
                'jewelry': round(avg_jewelry_price, 2),
                'materials': round(avg_material_price, 2),
                'stones': round(avg_stone_price, 2)
            }
        })
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@dashboard_bp.route('/dashboard/jewelry-by-type', methods=['GET'])
def get_jewelry_by_type():
    """Obter distribuição de joias por tipo"""
    try:
        query = db.session.query(
            Pattern.tipo, 
            db.func.count(Jewelry.id).label('count')
        ).join(
            Jewelry, Pattern.id == Jewelry.idpa
        ).group_by(Pattern.tipo).all()
        
        data = [{'tipo': tipo or 'Sem tipo', 'count': count} for tipo, count in query]
        
        return jsonify({'data': data})
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@dashboard_bp.route('/dashboard/materials-by-category', methods=['GET'])
def get_materials_by_category():
    """Obter distribuição de materiais por categoria"""
    try:
        materials = Material.query.all()
        categorias = {}
        
        for material in materials:
            cat = material.categoria
            categorias[cat] = categorias.get(cat, 0) + 1
        
        data = [{'categoria': k, 'count': v} for k, v in categorias.items()]
        
        return jsonify({'data': data})
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@dashboard_bp.route('/dashboard/stones-by-material', methods=['GET'])
def get_stones_by_material():
    """Obter distribuição de pedras por material"""
    try:
        query = db.session.query(
            Stone.material, 
            db.func.count(Stone.id).label('count')
        ).group_by(Stone.material).order_by(db.func.count(Stone.id).desc()).limit(10).all()
        
        data = [{'material': material or 'Sem material', 'count': count} for material, count in query]
        
        return jsonify({'data': data})
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@dashboard_bp.route('/dashboard/price-distribution', methods=['GET'])
def get_price_distribution():
    """Obter distribuição de preços das joias"""
    try:
        # Definir faixas de preço
        ranges = [
            (0, 100, '0-100'),
            (100, 300, '100-300'),
            (300, 500, '300-500'),
            (500, 1000, '500-1000'),
            (1000, float('inf'), '1000+')
        ]
        
        data = []
        for min_price, max_price, label in ranges:
            if max_price == float('inf'):
                count = Jewelry.query.filter(Jewelry.preco2 >= min_price).count()
            else:
                count = Jewelry.query.filter(
                    Jewelry.preco2 >= min_price,
                    Jewelry.preco2 < max_price
                ).count()
            
            data.append({'range': label, 'count': count})
        
        return jsonify({'data': data})
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@dashboard_bp.route('/dashboard/recent-items', methods=['GET'])
def get_recent_items():
    """Obter itens recentes (baseado no ID)"""
    try:
        # Últimas joias adicionadas
        recent_jewelry = Jewelry.query.order_by(Jewelry.id.desc()).limit(5).all()
        
        # Últimos materiais adicionados
        recent_materials = Material.query.order_by(Material.id.desc()).limit(5).all()
        
        # Últimas pedras adicionadas
        recent_stones = Stone.query.order_by(Stone.id.desc()).limit(5).all()
        
        return jsonify({
            'jewelry': [item.to_dict() for item in recent_jewelry],
            'materials': [item.to_dict() for item in recent_materials],
            'stones': [item.to_dict() for item in recent_stones]
        })
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@dashboard_bp.route('/dashboard/search', methods=['GET'])
def global_search():
    """Pesquisa global em todas as entidades"""
    try:
        from flask import request
        query = request.args.get('q', '').strip()
        
        if not query:
            return jsonify({'results': []})
        
        results = []
        
        # Pesquisar em joias
        jewelry_results = Jewelry.query.filter(
            (Jewelry.descricao.contains(query)) |
            (Jewelry.noticia.contains(query))
        ).limit(5).all()
        
        for item in jewelry_results:
            results.append({
                'type': 'jewelry',
                'id': item.id,
                'title': item.descricao or f'Joia {item.idj}',
                'subtitle': item.noticia[:100] if item.noticia else '',
                'url': f'/jewelry/{item.id}'
            })
        
        # Pesquisar em materiais
        material_results = Material.query.filter(
            (Material.nome.contains(query)) |
            (Material.tipo.contains(query))
        ).limit(5).all()
        
        for item in material_results:
            results.append({
                'type': 'material',
                'id': item.id,
                'title': item.nome or f'Material {item.idmat}',
                'subtitle': f'{item.tipo} - {item.cor}' if item.tipo and item.cor else item.tipo or item.cor or '',
                'url': f'/materials/{item.id}'
            })
        
        # Pesquisar em padrões
        pattern_results = Pattern.query.filter(
            (Pattern.nome.contains(query)) |
            (Pattern.code.contains(query))
        ).limit(5).all()
        
        for item in pattern_results:
            results.append({
                'type': 'pattern',
                'id': item.id,
                'title': item.nome or f'Padrão {item.idpa}',
                'subtitle': f'{item.tipo} - {item.colecao}' if item.tipo and item.colecao else item.tipo or item.colecao or '',
                'url': f'/patterns/{item.id}'
            })
        
        # Pesquisar em pedras
        stone_results = Stone.query.filter(
            (Stone.material.contains(query)) |
            (Stone.cor.contains(query))
        ).limit(5).all()
        
        for item in stone_results:
            results.append({
                'type': 'stone',
                'id': item.id,
                'title': item.descricao_completa,
                'subtitle': item.dimensoes_formatadas,
                'url': f'/stones/{item.id}'
            })
        
        return jsonify({'results': results})
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500


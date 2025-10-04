from flask import Blueprint, request, jsonify
from src.models.user import db
from src.models.pattern import Pattern

patterns_bp = Blueprint('patterns', __name__)

@patterns_bp.route('/patterns', methods=['GET'])
def get_patterns():
    """Listar todos os padrões com filtros opcionais"""
    try:
        page = request.args.get('page', 1, type=int)
        per_page = request.args.get('per_page', 20, type=int)
        search = request.args.get('search', '')
        tipo = request.args.get('tipo', '')
        colecao = request.args.get('colecao', '')
        
        query = Pattern.query
        
        # Filtros
        if search:
            query = query.filter(
                (Pattern.nome.contains(search)) |
                (Pattern.code.contains(search)) |
                (Pattern.noticia.contains(search))
            )
        
        if tipo:
            query = query.filter(Pattern.tipo.contains(tipo))
            
        if colecao:
            query = query.filter(Pattern.colecao.contains(colecao))
        
        # Ordenação
        order_by = request.args.get('order_by', 'idpa')
        order_dir = request.args.get('order_dir', 'asc')
        
        if hasattr(Pattern, order_by):
            column = getattr(Pattern, order_by)
            if order_dir == 'desc':
                query = query.order_by(column.desc())
            else:
                query = query.order_by(column.asc())
        
        # Paginação
        pagination = query.paginate(
            page=page, 
            per_page=per_page, 
            error_out=False
        )
        
        patterns_list = [item.to_dict() for item in pagination.items]
        
        return jsonify({
            'patterns': patterns_list,
            'pagination': {
                'page': page,
                'per_page': per_page,
                'total': pagination.total,
                'pages': pagination.pages,
                'has_next': pagination.has_next,
                'has_prev': pagination.has_prev
            }
        })
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@patterns_bp.route('/patterns/<int:pattern_id>', methods=['GET'])
def get_pattern_by_id(pattern_id):
    """Obter um padrão específico"""
    try:
        pattern = Pattern.query.get_or_404(pattern_id)
        return jsonify(pattern.to_dict())
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@patterns_bp.route('/patterns', methods=['POST'])
def create_pattern():
    """Criar um novo padrão"""
    try:
        data = request.get_json()
        
        pattern = Pattern(
            idpa=data.get('idpa'),
            idpaimp=data.get('idpaimp'),
            foto=data.get('foto'),
            tipo=data.get('tipo'),
            code=data.get('code'),
            colecao=data.get('colecao'),
            nome=data.get('nome'),
            tempo=data.get('tempo', 0.0),
            noticia=data.get('noticia'),
            comp=data.get('comp', 0.0),
            lag=data.get('lag', 0.0),
            alt=data.get('alt', 0.0)
        )
        
        db.session.add(pattern)
        db.session.commit()
        
        return jsonify(pattern.to_dict()), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@patterns_bp.route('/patterns/<int:pattern_id>', methods=['PUT'])
def update_pattern(pattern_id):
    """Atualizar um padrão"""
    try:
        pattern = Pattern.query.get_or_404(pattern_id)
        data = request.get_json()
        
        # Atualizar campos
        for field in ['idpa', 'idpaimp', 'foto', 'tipo', 'code', 'colecao',
                     'nome', 'tempo', 'noticia', 'comp', 'lag', 'alt']:
            if field in data:
                setattr(pattern, field, data[field])
        
        db.session.commit()
        return jsonify(pattern.to_dict())
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@patterns_bp.route('/patterns/<int:pattern_id>', methods=['DELETE'])
def delete_pattern(pattern_id):
    """Eliminar um padrão"""
    try:
        pattern = Pattern.query.get_or_404(pattern_id)
        db.session.delete(pattern)
        db.session.commit()
        
        return jsonify({'message': 'Padrão eliminado com sucesso'}), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@patterns_bp.route('/patterns/types', methods=['GET'])
def get_pattern_types():
    """Obter todos os tipos de padrões únicos"""
    try:
        types = db.session.query(Pattern.tipo).distinct().filter(Pattern.tipo.isnot(None)).all()
        types_list = [t[0] for t in types if t[0]]
        return jsonify({'types': sorted(types_list)})
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@patterns_bp.route('/patterns/collections', methods=['GET'])
def get_pattern_collections():
    """Obter todas as coleções únicas"""
    try:
        collections = db.session.query(Pattern.colecao).distinct().filter(Pattern.colecao.isnot(None)).all()
        collections_list = [c[0] for c in collections if c[0]]
        return jsonify({'collections': sorted(collections_list)})
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@patterns_bp.route('/patterns/stats', methods=['GET'])
def get_patterns_stats():
    """Obter estatísticas dos padrões"""
    try:
        total = Pattern.query.count()
        
        # Tempo médio de produção
        avg_time = db.session.query(db.func.avg(Pattern.tempo)).scalar() or 0
        
        # Padrões por tipo
        tipos_query = db.session.query(
            Pattern.tipo, 
            db.func.count(Pattern.id)
        ).group_by(Pattern.tipo).all()
        
        tipos = [{'tipo': tipo or 'Sem tipo', 'count': count} for tipo, count in tipos_query]
        
        # Padrões por coleção
        colecoes_query = db.session.query(
            Pattern.colecao, 
            db.func.count(Pattern.id)
        ).group_by(Pattern.colecao).limit(10).all()
        
        colecoes = [{'colecao': colecao or 'Sem coleção', 'count': count} for colecao, count in colecoes_query]
        
        return jsonify({
            'total': total,
            'tempo_medio': round(avg_time, 2),
            'tipos': tipos,
            'colecoes': colecoes
        })
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500


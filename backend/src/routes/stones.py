from flask import Blueprint, request, jsonify
from src.utils.auth import auth_required
from src.models.user import db
from src.models.stone import Stone

stones_bp = Blueprint('stones', __name__)

@stones_bp.route('/stones', methods=['GET'])
@auth_required
def get_stones(current_user):
    """Listar todas as pedras com filtros opcionais"""
    try:
        page = request.args.get('page', 1, type=int)
        per_page = request.args.get('per_page', 20, type=int)
        search = request.args.get('search', '')
        material = request.args.get('material', '')
        cor = request.args.get('cor', '')
        tipo = request.args.get('tipo', '')
        lapidacao = request.args.get('lapidacao', '')
        webexport = request.args.get('webexport', type=bool)
        nasjoias = request.args.get('nasjoias', type=bool)
        
        query = Stone.query
        
        # Filtros
        if search:
            query = query.filter(
                (Stone.material.contains(search)) |
                (Stone.cor.contains(search)) |
                (Stone.tipo.contains(search)) |
                (Stone.lapidacao.contains(search))
            )
        
        if material:
            query = query.filter(Stone.material.contains(material))
            
        if cor:
            query = query.filter(Stone.cor.contains(cor))
            
        if tipo:
            query = query.filter(Stone.tipo.contains(tipo))
            
        if lapidacao:
            query = query.filter(Stone.lapidacao.contains(lapidacao))
            
        if webexport is not None:
            query = query.filter(Stone.webexport == webexport)
            
        if nasjoias is not None:
            query = query.filter(Stone.nasjoias == nasjoias)
        
        # Ordenação
        order_by = request.args.get('order_by', 'idpe')
        order_dir = request.args.get('order_dir', 'asc')
        
        if hasattr(Stone, order_by):
            column = getattr(Stone, order_by)
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
        
        stones_list = [item.to_dict() for item in pagination.items]
        
        return jsonify({
            'stones': stones_list,
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

@stones_bp.route('/stones/<int:stone_id>', methods=['GET'])
@auth_required
def get_stone_by_id(current_user, stone_id):
    """Obter uma pedra específica"""
    try:
        stone = Stone.query.get_or_404(stone_id)
        return jsonify(stone.to_dict())
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@stones_bp.route('/stones', methods=['POST'])
@auth_required
def create_stone(current_user):
    """Criar uma nova pedra"""
    try:
        data = request.get_json()
        
        stone = Stone(
            idpe=data.get('idpe'),
            idpeimp=data.get('idpeimp'),
            foto=data.get('foto'),
            tipo=data.get('tipo'),
            lapidacao=data.get('lapidacao'),
            material=data.get('material'),
            cor=data.get('cor'),
            comprimento=data.get('comprimento', 0.0),
            largura=data.get('largura', 0.0),
            altura=data.get('altura', 0.0),
            peso=data.get('peso', 0.0),
            tempo=data.get('tempo', 0.0),
            preco=data.get('preco', 0.0),
            noticia=data.get('noticia'),
            ststoque=data.get('ststoque'),
            qmin=data.get('qmin', 0.0),
            nasjoias=data.get('nasjoias', False),
            webexport=data.get('webexport', False)
        )
        
        db.session.add(stone)
        db.session.commit()
        
        return jsonify(stone.to_dict()), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@stones_bp.route('/stones/<int:stone_id>', methods=['PUT'])
@auth_required
def update_stone(current_user, stone_id):
    """Atualizar uma pedra"""
    try:
        stone = Stone.query.get_or_404(stone_id)
        data = request.get_json()
        
        # Atualizar campos
        for field in ['idpe', 'idpeimp', 'foto', 'tipo', 'lapidacao', 'material',
                     'cor', 'comprimento', 'largura', 'altura', 'peso', 'tempo',
                     'preco', 'noticia', 'ststoque', 'qmin', 'nasjoias', 'webexport']:
            if field in data:
                setattr(stone, field, data[field])
        
        db.session.commit()
        return jsonify(stone.to_dict())
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@stones_bp.route('/stones/<int:stone_id>', methods=['DELETE'])
@auth_required
def delete_stone(current_user, stone_id):
    """Eliminar uma pedra"""
    try:
        stone = Stone.query.get_or_404(stone_id)
        db.session.delete(stone)
        db.session.commit()
        
        return jsonify({'message': 'Pedra eliminada com sucesso'}), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@stones_bp.route('/stones/materials', methods=['GET'])
@auth_required
def get_stone_materials(current_user):
    """Obter todos os materiais de pedras únicos"""
    try:
        materials = db.session.query(Stone.material).distinct().filter(Stone.material.isnot(None)).all()
        materials_list = [m[0] for m in materials if m[0]]
        return jsonify({'materials': sorted(materials_list)})
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@stones_bp.route('/stones/colors', methods=['GET'])
@auth_required
def get_stone_colors(current_user):
    """Obter todas as cores de pedras únicas"""
    try:
        colors = db.session.query(Stone.cor).distinct().filter(Stone.cor.isnot(None)).all()
        colors_list = [c[0] for c in colors if c[0]]
        return jsonify({'colors': sorted(colors_list)})
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@stones_bp.route('/stones/types', methods=['GET'])
@auth_required
def get_stone_types(current_user):
    """Obter todos os tipos de pedras únicos"""
    try:
        types = db.session.query(Stone.tipo).distinct().filter(Stone.tipo.isnot(None)).all()
        types_list = [t[0] for t in types if t[0]]
        return jsonify({'types': sorted(types_list)})
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@stones_bp.route('/stones/cuts', methods=['GET'])
@auth_required
def get_stone_cuts():
    """Obter todos os tipos de lapidação únicos"""
    try:
        cuts = db.session.query(Stone.lapidacao).distinct().filter(Stone.lapidacao.isnot(None)).all()
        cuts_list = [c[0] for c in cuts if c[0]]
        return jsonify({'cuts': sorted(cuts_list)})
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@stones_bp.route('/stones/stats', methods=['GET'])
@auth_required
def get_stones_stats():
    """Obter estatísticas das pedras"""
    try:
        total = Stone.query.count()
        web_export = Stone.query.filter(Stone.webexport == True).count()
        nas_joias = Stone.query.filter(Stone.nasjoias == True).count()
        
        # Preço médio
        avg_price = db.session.query(db.func.avg(Stone.preco)).scalar() or 0
        
        # Pedras por material
        materiais_query = db.session.query(
            Stone.material, 
            db.func.count(Stone.id)
        ).group_by(Stone.material).limit(10).all()
        
        materiais = [{'material': material or 'Sem material', 'count': count} for material, count in materiais_query]
        
        # Pedras por cor
        cores_query = db.session.query(
            Stone.cor, 
            db.func.count(Stone.id)
        ).group_by(Stone.cor).limit(10).all()
        
        cores = [{'cor': cor or 'Sem cor', 'count': count} for cor, count in cores_query]
        
        # Pedras por tipo
        tipos_query = db.session.query(
            Stone.tipo, 
            db.func.count(Stone.id)
        ).group_by(Stone.tipo).all()
        
        tipos = [{'tipo': tipo or 'Sem tipo', 'count': count} for tipo, count in tipos_query]
        
        return jsonify({
            'total': total,
            'web_export': web_export,
            'nas_joias': nas_joias,
            'preco_medio': round(avg_price, 2),
            'materiais': materiais,
            'cores': cores,
            'tipos': tipos
        })
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500


from flask import Blueprint, request, jsonify
from src.utils.auth import auth_required
from src.models.user import db
from src.models.material import Material

materials_bp = Blueprint('materials', __name__)

@materials_bp.route('/materials', methods=['GET'])
@auth_required
def get_materials(current_user):
    """Listar todos os materiais com filtros opcionais"""
    try:
        page = request.args.get('page', 1, type=int)
        per_page = request.args.get('per_page', 20, type=int)
        search = request.args.get('search', '')
        tipo = request.args.get('tipo', '')
        webexport = request.args.get('webexport', type=bool)
        
        query = Material.query
        
        # Filtros
        if search:
            query = query.filter(
                (Material.nome.contains(search)) |
                (Material.tipo.contains(search)) |
                (Material.cor.contains(search))
            )
        
        if tipo:
            query = query.filter(Material.tipo.contains(tipo))
            
        if webexport is not None:
            query = query.filter(Material.webexport == webexport)
        
        # Ordenação
        order_by = request.args.get('order_by', 'idmat')
        order_dir = request.args.get('order_dir', 'asc')
        
        if hasattr(Material, order_by):
            column = getattr(Material, order_by)
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
        
        materials_list = [item.to_dict() for item in pagination.items]
        
        return jsonify({
            'materials': materials_list,
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

@materials_bp.route('/materials/<int:material_id>', methods=['GET'])
@auth_required
def get_material_by_id(current_user, material_id):
    """Obter um material específico"""
    try:
        material = Material.query.get_or_404(material_id)
        return jsonify(material.to_dict())
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@materials_bp.route('/materials', methods=['POST'])
@auth_required
def create_material(current_user):
    """Criar um novo material"""
    try:
        data = request.get_json()
        
        material = Material(
            idmat=data.get('idmat'),
            idmatimp=data.get('idmatimp'),
            foto=data.get('foto'),
            tipo=data.get('tipo'),
            nome=data.get('nome'),
            dimensao=data.get('dimensao'),
            precopordimensao=data.get('precopordimensao', 0.0),
            cor=data.get('cor'),
            noticia=data.get('noticia'),
            ststoque=data.get('ststoque'),
            qmin=data.get('qmin', 0),
            webexport=data.get('webexport', False)
        )
        
        db.session.add(material)
        db.session.commit()
        
        return jsonify(material.to_dict()), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@materials_bp.route('/materials/<int:material_id>', methods=['PUT'])
@auth_required
def update_material(current_user, material_id):
    """Atualizar um material"""
    try:
        material = Material.query.get_or_404(material_id)
        data = request.get_json()
        
        # Atualizar campos
        for field in ['idmat', 'idmatimp', 'foto', 'tipo', 'nome', 'dimensao',
                     'precopordimensao', 'cor', 'noticia', 'ststoque', 'qmin', 
                     'webexport']:
            if field in data:
                setattr(material, field, data[field])
        
        db.session.commit()
        return jsonify(material.to_dict())
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@materials_bp.route('/materials/<int:material_id>', methods=['DELETE'])
@auth_required
def delete_material(current_user, material_id):
    """Eliminar um material"""
    try:
        material = Material.query.get_or_404(material_id)
        db.session.delete(material)
        db.session.commit()
        
        return jsonify({'message': 'Material eliminado com sucesso'}), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@materials_bp.route('/materials/types', methods=['GET'])
@auth_required
def get_material_types(current_user):
    """Obter todos os tipos de materiais únicos"""
    try:
        types = db.session.query(Material.tipo).distinct().filter(Material.tipo.isnot(None)).all()
        types_list = [t[0] for t in types if t[0]]
        return jsonify({'types': sorted(types_list)})
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@materials_bp.route('/materials/stats', methods=['GET'])
@auth_required
def get_materials_stats(current_user):
    """Obter estatísticas dos materiais"""
    try:
        total = Material.query.count()
        web_export = Material.query.filter(Material.webexport == True).count()
        
        # Preço médio
        avg_price = db.session.query(db.func.avg(Material.precopordimensao)).scalar() or 0
        
        # Materiais por tipo
        tipos_query = db.session.query(
            Material.tipo, 
            db.func.count(Material.id)
        ).group_by(Material.tipo).all()
        
        tipos = [{'tipo': tipo or 'Sem tipo', 'count': count} for tipo, count in tipos_query]
        
        # Materiais por categoria
        categorias = {}
        for material in Material.query.all():
            cat = material.categoria
            categorias[cat] = categorias.get(cat, 0) + 1
        
        categorias_list = [{'categoria': k, 'count': v} for k, v in categorias.items()]
        
        return jsonify({
            'total': total,
            'web_export': web_export,
            'preco_medio': round(avg_price, 2),
            'tipos': tipos,
            'categorias': categorias_list
        })
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500



from flask import Blueprint, request, jsonify
from src.models.user import db
from src.models.jewelry import Jewelry
from src.models.pattern import Pattern
from src.utils.auth import auth_required
# from src.main import cache # Removido para evitar importação circular

jewelry_bp = Blueprint("jewelry", __name__)

@jewelry_bp.route("/jewelry", methods=["GET"])
@auth_required
def get_jewelry_protected(current_user):
    return get_jewelry()

# Alias para compatibilidade com frontend
@jewelry_bp.route("/joias", methods=["GET"])
@auth_required
def get_joias_protected(current_user):
    return get_jewelry(current_user)

# @cache.cached(query_string=True) # Removido temporariamente para evitar importação circular
@auth_required
def get_jewelry(current_user):
    """Listar todas as joias com filtros opcionais"""
    try:
        page = request.args.get("page", 1, type=int)
        per_page = request.args.get("per_page", 20, type=int)
        per_page = min(100, per_page)  # Limitar máximo de itens por página
        page = max(1, page)  # Garantir que página seja pelo menos 1
        search = request.args.get("search", "")
        escondido = request.args.get("escondido", type=bool)
        webexport = request.args.get("webexport", type=bool)
        
        query = Jewelry.query
        
        # Filtros
        if search:
            query = query.filter(
                (Jewelry.descricao.contains(search)) |
                (Jewelry.noticia.contains(search))
            )
        
        if escondido is not None:
            query = query.filter(Jewelry.escondido == escondido)
            
        if webexport is not None:
            query = query.filter(Jewelry.webexport == webexport)
        
        # Ordenação
        order_by = request.args.get("order_by", "idj")
        order_dir = request.args.get("order_dir", "asc")
        
        if hasattr(Jewelry, order_by):
            column = getattr(Jewelry, order_by)
            if order_dir == "desc":
                query = query.order_by(column.desc())
            else:
                query = query.order_by(column.asc())
        
        # Paginação
        pagination = query.paginate(
            page=page, 
            per_page=per_page, 
            error_out=False
        )
        
        jewelry_list = [item.to_dict() for item in pagination.items]
        
        # Retornar apenas a lista para compatibilidade com o frontend
        # O frontend espera um array direto, não um objeto com propriedade jewelry
        return jsonify(jewelry_list)
        
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@jewelry_bp.route("/jewelry/<int:jewelry_id>", methods=["GET"])
@auth_required
def get_jewelry_by_id(current_user, jewelry_id):
    """Obter uma joia específica"""
    try:
        jewelry = Jewelry.query.get_or_404(jewelry_id)
        return jsonify(jewelry.to_dict())
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@jewelry_bp.route("/jewelry", methods=["POST"])
@auth_required
def create_jewelry(current_user):
    """Criar uma nova joia"""
    try:
        data = request.get_json()
        
        # Gerar próximo idj automaticamente
        max_idj = db.session.query(db.func.max(Jewelry.idj)).scalar() or 0
        next_idj = max_idj + 1
        
        # Mapear campos do frontend para o modelo
        name = data.get("name", "")
        code = data.get("code", "")
        category = data.get("category", "")
        price = data.get("price", 0)
        cost = data.get("cost", 0)
        stock_quantity = data.get("stock_quantity", 1)
        description = data.get("description", "")
        
        # Buscar ou criar padrão baseado na categoria
        pattern = None
        if category:
            pattern = Pattern.query.filter_by(nome=category).first()
            if not pattern:
                # Criar padrão se não existir
                pattern = Pattern(
                    nome=category,
                    tipo=category.lower(),
                    noticia=f"Padrão {category}",
                    colecao="Padrão"
                )
                db.session.add(pattern)
                db.session.flush()  # Para obter o ID
        
        jewelry = Jewelry(
            idj=next_idj,
            idjimp=data.get("idjimp"),
            idpa=pattern.id if pattern else None,
            foto=data.get("foto"),
            noticia=description or name,
            descricao=name,
            escondido=data.get("escondido", False),
            precomat=float(cost) if cost else 0.0,
            precoped=data.get("precoped", 0.0),
            precotem=data.get("precotem", 0.0),
            preco0=data.get("preco0", 0.0),
            preco1=float(price) if price else 0.0,
            preco2=float(price) if price else 0.0,
            lucro1=data.get("lucro1", 1.0),
            lucro2=data.get("lucro2", 1.2),
            qmin=float(stock_quantity) if stock_quantity else 1.0,
            precoweb=data.get("precoweb"),
            webexport=data.get("webexport", True)
        )
        
        db.session.add(jewelry)
        db.session.commit()
        
        # cache.clear() # Removido temporariamente para evitar importação circular
        
        return jsonify(jewelry.to_dict()), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 500

@jewelry_bp.route("/jewelry/<int:jewelry_id>", methods=["DELETE"])
@auth_required
def delete_jewelry(current_user, jewelry_id):
    """Eliminar uma joia"""
    try:
        jewelry = Jewelry.query.get_or_404(jewelry_id)
        db.session.delete(jewelry)
        db.session.commit()
        
        # cache.clear() # Removido temporariamente para evitar importação circular
        
        return jsonify({"message": "Joia eliminada com sucesso"}), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 500


@jewelry_bp.route("/jewelry/<int:jewelry_id>", methods=["PUT"])
@auth_required
def update_jewelry(current_user, jewelry_id):
    """Update a jewelry item"""
    try:
        jewelry = Jewelry.query.get(jewelry_id)

        if not jewelry:
            return jsonify({'error': 'Joia não encontrada'}), 404

        data = request.get_json()

        # Update fields if provided
        if 'name' in data:
            jewelry.name = data['name']
        if 'type' in data:
            jewelry.type = data['type']
        if 'description' in data:
            jewelry.description = data['description']
        if 'price' in data:
            jewelry.price = data['price']
        if 'material_id' in data:
            jewelry.material_id = data['material_id']
        if 'weight' in data:
            jewelry.weight = data['weight']
        if 'size' in data:
            jewelry.size = data['size']
        if 'color' in data:
            jewelry.color = data['color']
        if 'category' in data:
            jewelry.category = data['category']
        if 'status' in data:
            jewelry.status = data['status']

        db.session.commit()

        return jsonify({
            'message': 'Joia atualizada com sucesso',
            'jewelry': {
                'id': jewelry.id,
                'name': jewelry.name,
                'type': jewelry.type,
                'description': jewelry.description,
                'price': float(jewelry.price) if jewelry.price else None,
                'material_id': jewelry.material_id,
                'weight': float(jewelry.weight) if jewelry.weight else None,
                'size': jewelry.size,
                'color': jewelry.color,
                'category': jewelry.category,
                'status': jewelry.status,
                'created_at': jewelry.created_at.isoformat()
            }
        }), 200

    except Exception as e:
        print(f"Erro ao atualizar joia: {str(e)}")
        return jsonify({'error': 'Erro interno do servidor'}), 500

@jewelry_bp.route("/jewelry/stats", methods=["GET"])
# @cache.cached() # Removido temporariamente para evitar importação circular
@auth_required
def get_jewelry_stats(current_user):
    """Obter estatísticas das joias"""
    try:
        total = Jewelry.query.count()
        visiveis = Jewelry.query.filter(Jewelry.escondido == False).count()
        web_export = Jewelry.query.filter(Jewelry.webexport == True).count()
        
        # Preço médio
        avg_price = db.session.query(db.func.avg(Jewelry.preco2)).scalar() or 0
        
        # Joias por tipo (baseado no padrão)
        tipos_query = db.session.query(
            Pattern.tipo, 
            db.func.count(Jewelry.id)
        ).join(Jewelry, Pattern.id == Jewelry.idpa).group_by(Pattern.tipo).all()
        
        tipos = [{"tipo": tipo, "count": count} for tipo, count in tipos_query]
        
        return jsonify({
            "total": total,
            "visiveis": visiveis,
            "web_export": web_export,
            "preco_medio": round(avg_price, 2),
            "tipos": tipos
        })
        
    except Exception as e:
        return jsonify({"error": str(e)}), 500






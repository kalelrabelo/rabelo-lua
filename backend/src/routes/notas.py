from flask import Blueprint, jsonify, request
from src.models.user import db
from src.models.nota import Nota
from src.models.imposto import Imposto
from src.models.pattern import Pattern
from src.models.jewelry import Jewelry
from src.models.material import Material
from src.models.stone import Stone
from datetime import datetime
import re

notas_bp = Blueprint("notas", __name__)

@notas_bp.route("/notas", methods=["GET"])
def get_notas():
    notas = Nota.query.all()
    return jsonify([nota.to_dict() for nota in notas])

@notas_bp.route("/impostos", methods=["GET"])
def get_impostos():
    impostos = Imposto.query.all()
    return jsonify([imposto.to_dict() for imposto in impostos])

@notas_bp.route("/notas/<int:nota_id>", methods=["GET"])
def get_nota(nota_id):
    nota = Nota.query.get_or_404(nota_id)
    return jsonify(nota.to_dict())

@notas_bp.route("/notas", methods=["POST"])
def create_nota():
    data = request.get_json()
    nota = Nota(**data)
    db.session.add(nota)
    db.session.commit()
    return jsonify(nota.to_dict()), 201

@notas_bp.route("/notas/<int:nota_id>", methods=["PUT"])
def update_nota(nota_id):
    nota = Nota.query.get_or_404(nota_id)
    data = request.get_json()
    
    for key, value in data.items():
        if hasattr(nota, key):
            setattr(nota, key, value)
    
    db.session.commit()
    return jsonify(nota.to_dict())

@notas_bp.route("/notas/<int:nota_id>", methods=["DELETE"])
def delete_nota(nota_id):
    nota = Nota.query.get_or_404(nota_id)
    db.session.delete(nota)
    db.session.commit()
    return jsonify({"message": "Nota deletada com sucesso"}), 200

# Rota para preenchimento automático com filtros inteligentes
@notas_bp.route("/notas/preencher_auto", methods=["POST"])
def preencher_nota_auto():
    data = request.get_json()
    filtro = data.get("filtro", "").lower()
    tipo_filtro = data.get("tipo_filtro", "auto")  # auto, cliente, produto, data, modo
    
    resultado = {}
    
    try:
        if tipo_filtro == "auto" or tipo_filtro == "cliente":
            # Buscar por cliente/remetente
            nota_cliente = Nota.query.filter(
                db.or_(
                    Nota.remetente1.ilike(f"%{filtro}%"),
                    Nota.des1.ilike(f"%{filtro}%"),
                    Nota.des2.ilike(f"%{filtro}%")
                )
            ).order_by(Nota.data.desc()).first()
            
            if nota_cliente:
                resultado.update({
                    "remetente1": nota_cliente.remetente1,
                    "remetente2": nota_cliente.remetente2,
                    "remetente3": nota_cliente.remetente3,
                    "remetente4": nota_cliente.remetente4,
                    "remetente6": nota_cliente.remetente6,
                    "remetente7": nota_cliente.remetente7,
                    "remetente8": nota_cliente.remetente8,
                    "remetente9": nota_cliente.remetente9,
                    "remetente10": nota_cliente.remetente10,
                    "des1": nota_cliente.des1,
                    "des2": nota_cliente.des2,
                    "des3": nota_cliente.des3,
                    "des4": nota_cliente.des4,
                    "des5": nota_cliente.des5,
                    "des6": nota_cliente.des6,
                    "des7": nota_cliente.des7,
                    "des8": nota_cliente.des8,
                    "fax": nota_cliente.fax,
                    "email": nota_cliente.email,
                    "lugar": nota_cliente.lugar,
                    "fonte": "cliente_anterior"
                })
        
        if tipo_filtro == "auto" or tipo_filtro == "produto":
            # Buscar produtos relacionados (padrões, joias, materiais, pedras)
            produtos_encontrados = []
            
            # Buscar padrões
            padroes = Pattern.query.filter(
                db.or_(
                    Pattern.nome.ilike(f"%{filtro}%"),
                    Pattern.tipo.ilike(f"%{filtro}%"),
                    Pattern.colecao.ilike(f"%{filtro}%")
                )
            ).limit(5).all()
            
            for padrao in padroes:
                produtos_encontrados.append({
                    "tipo": "padrao",
                    "id": padrao.id,
                    "nome": padrao.nome,
                    "categoria": padrao.tipo,
                    "colecao": padrao.colecao,
                    "descricao": f"Padrão {padrao.nome} - {padrao.tipo} - Coleção {padrao.colecao}"
                })
            
            # Buscar joias
            joias = Jewelry.query.filter(
                db.or_(
                    Jewelry.name.ilike(f"%{filtro}%"),
                    Jewelry.category.ilike(f"%{filtro}%"),
                    Jewelry.collection.ilike(f"%{filtro}%")
                )
            ).limit(5).all()
            
            for joia in joias:
                produtos_encontrados.append({
                    "tipo": "joia",
                    "id": joia.id,
                    "nome": joia.name,
                    "categoria": joia.category,
                    "colecao": joia.collection,
                    "preco": joia.price,
                    "descricao": f"Joia {joia.name} - {joia.category} - R$ {joia.price}"
                })
            
            # Buscar materiais
            materiais = Material.query.filter(
                Material.name.ilike(f"%{filtro}%")
            ).limit(5).all()
            
            for material in materiais:
                produtos_encontrados.append({
                    "tipo": "material",
                    "id": material.id,
                    "nome": material.name,
                    "preco": material.price_per_gram,
                    "descricao": f"Material {material.name} - R$ {material.price_per_gram}/g"
                })
            
            # Buscar pedras
            pedras = Stone.query.filter(
                db.or_(
                    Stone.name.ilike(f"%{filtro}%"),
                    Stone.type.ilike(f"%{filtro}%")
                )
            ).limit(5).all()
            
            for pedra in pedras:
                produtos_encontrados.append({
                    "tipo": "pedra",
                    "id": pedra.id,
                    "nome": pedra.name,
                    "tipo": pedra.type,
                    "preco": pedra.price_per_carat,
                    "descricao": f"Pedra {pedra.name} - {pedra.type} - R$ {pedra.price_per_carat}/ct"
                })
            
            resultado["produtos_encontrados"] = produtos_encontrados
        
        if tipo_filtro == "auto" or tipo_filtro == "modo":
            # Buscar por modo de pagamento/entrega
            nota_modo = Nota.query.filter(
                Nota.modo.ilike(f"%{filtro}%")
            ).order_by(Nota.data.desc()).first()
            
            if nota_modo:
                resultado.update({
                    "modo": nota_modo.modo,
                    "praco1": nota_modo.praco1,
                    "praco1f": nota_modo.praco1f,
                    "praco2": nota_modo.praco2,
                    "praco2f": nota_modo.praco2f,
                    "praco3": nota_modo.praco3,
                    "praco3f": nota_modo.praco3f,
                    "fonte": "modo_anterior"
                })
        
        if tipo_filtro == "auto" or tipo_filtro == "imposto":
            # Buscar impostos aplicáveis
            impostos = Imposto.query.filter(
                Imposto.nome.ilike(f"%{filtro}%")
            ).all()
            
            if impostos:
                resultado["impostos_disponiveis"] = [imposto.to_dict() for imposto in impostos]
        
        # Preencher dados padrão se não encontrou nada específico
        if not resultado:
            # Buscar a última nota para usar como template
            ultima_nota = Nota.query.order_by(Nota.data.desc()).first()
            if ultima_nota:
                resultado.update({
                    "remetente1": ultima_nota.remetente1,
                    "remetente2": ultima_nota.remetente2,
                    "remetente3": ultima_nota.remetente3,
                    "remetente4": ultima_nota.remetente4,
                    "remetente6": ultima_nota.remetente6,
                    "remetente7": ultima_nota.remetente7,
                    "remetente8": ultima_nota.remetente8,
                    "remetente9": ultima_nota.remetente9,
                    "remetente10": ultima_nota.remetente10,
                    "lugar": ultima_nota.lugar,
                    "modo": ultima_nota.modo,
                    "fonte": "template_padrao"
                })
        
        # Adicionar data atual
        resultado["data"] = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        resultado["autor"] = "Sistema"
        
        return jsonify(resultado)
        
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# Rota para buscar sugestões baseadas em filtro
@notas_bp.route("/notas/sugestoes", methods=["POST"])
def get_sugestoes():
    data = request.get_json()
    filtro = data.get("filtro", "").lower()
    tipo = data.get("tipo", "all")  # all, clientes, produtos, modos
    
    sugestoes = []
    
    try:
        if tipo in ["all", "clientes"]:
            # Buscar clientes únicos
            clientes = db.session.query(Nota.remetente1).filter(
                Nota.remetente1.ilike(f"%{filtro}%")
            ).distinct().limit(10).all()
            
            for cliente in clientes:
                if cliente[0]:
                    sugestoes.append({
                        "tipo": "cliente",
                        "valor": cliente[0],
                        "label": f"Cliente: {cliente[0]}"
                    })
        
        if tipo in ["all", "produtos"]:
            # Buscar produtos (padrões, joias, etc.)
            padroes = Pattern.query.filter(
                Pattern.nome.ilike(f"%{filtro}%")
            ).limit(5).all()
            
            for padrao in padroes:
                sugestoes.append({
                    "tipo": "produto",
                    "valor": padrao.nome,
                    "label": f"Padrão: {padrao.nome} - {padrao.categoria}"
                })
        
        if tipo in ["all", "modos"]:
            # Buscar modos únicos
            modos = db.session.query(Nota.modo).filter(
                Nota.modo.ilike(f"%{filtro}%")
            ).distinct().limit(5).all()
            
            for modo in modos:
                if modo[0]:
                    sugestoes.append({
                        "tipo": "modo",
                        "valor": modo[0],
                        "label": f"Modo: {modo[0]}"
                    })
        
        return jsonify(sugestoes)
        
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# Rota para calcular impostos automaticamente
@notas_bp.route("/notas/calcular_impostos", methods=["POST"])
def calcular_impostos():
    data = request.get_json()
    valor_base = data.get("valor_base", 0)
    tipo_imposto = data.get("tipo_imposto", "")
    
    try:
        impostos_aplicados = []
        valor_total = valor_base
        
        if tipo_imposto:
            imposto = Imposto.query.filter(Imposto.nome.ilike(f"%{tipo_imposto}%")).first()
            if imposto and imposto.imposto:
                valor_imposto = valor_base * imposto.imposto
                valor_total += valor_imposto
                impostos_aplicados.append({
                    "nome": imposto.nome,
                    "percentual": imposto.imposto,
                    "valor": valor_imposto
                })
        else:
            # Aplicar impostos padrão
            impostos = Imposto.query.filter(Imposto.nome.isnot(None)).all()
            for imposto in impostos:
                if imposto.imposto:
                    valor_imposto = valor_base * imposto.imposto
                    valor_total += valor_imposto
                    impostos_aplicados.append({
                        "nome": imposto.nome,
                        "percentual": imposto.imposto,
                        "valor": valor_imposto
                    })
        
        return jsonify({
            "valor_base": valor_base,
            "impostos_aplicados": impostos_aplicados,
            "valor_total": valor_total
        })
        
    except Exception as e:
        return jsonify({"error": str(e)}), 500



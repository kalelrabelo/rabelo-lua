#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Rotas aprimoradas para joias com paginação, ordenação e relacionamentos
"""

from flask import Blueprint, request, jsonify
from datetime import datetime
import sqlite3

enhanced_jewelry_bp = Blueprint("enhanced_jewelry", __name__)

def get_db():
    """Obter conexão com o banco de dados"""
    conn = sqlite3.connect('data/joalheria.db')
    conn.row_factory = sqlite3.Row
    return conn

@enhanced_jewelry_bp.route("/joias/enhanced", methods=["GET"])
def get_joias_enhanced():
    """Listar joias com paginação, ordenação e filtros aprimorados"""
    try:
        # Parâmetros de paginação
        page = max(1, request.args.get("page", 1, type=int))
        per_page = min(100, request.args.get("per_page", 10, type=int))
        offset = (page - 1) * per_page
        
        # Parâmetros de busca e filtros
        search = request.args.get("search", "")
        categoria = request.args.get("categoria", "")
        com_imagem = request.args.get("com_imagem", "")
        
        # Parâmetros de ordenação
        order_by = request.args.get("order_by", "id")
        order_dir = request.args.get("order_dir", "desc").upper()
        if order_dir not in ["ASC", "DESC"]:
            order_dir = "DESC"
        
        conn = get_db()
        cursor = conn.cursor()
        
        # Query base
        base_query = "FROM joias WHERE 1=1"
        params = []
        
        # Aplicar filtros
        if search:
            base_query += " AND (nome LIKE ? OR descricao_completa LIKE ? OR descricao LIKE ?)"
            search_param = f"%{search}%"
            params.extend([search_param, search_param, search_param])
        
        if categoria:
            base_query += " AND descricao LIKE ?"
            params.append(f"%{categoria}%")
        
        if com_imagem == "true":
            base_query += " AND imagem_path IS NOT NULL"
        elif com_imagem == "false":
            base_query += " AND imagem_path IS NULL"
        
        # Contar total de registros
        count_query = f"SELECT COUNT(*) {base_query}"
        cursor.execute(count_query, params)
        total = cursor.fetchone()[0]
        
        # Ordenação (priorizar com imagem, depois por campo escolhido)
        order_clause = f"""
        ORDER BY 
            CASE WHEN imagem_path IS NOT NULL THEN 0 ELSE 1 END,
            {order_by} {order_dir}
        """
        
        # Query principal com paginação
        select_query = f"""
        SELECT 
            id, nome, descricao, descricao_completa,
            preco, preco_web, preco_venda_2, estoque,
            imagem_path, joias_relacionadas, id_original,
            id_padrao, created_at
        {base_query}
        {order_clause}
        LIMIT ? OFFSET ?
        """
        
        params.extend([per_page, offset])
        cursor.execute(select_query, params)
        
        # Formatar resultados
        joias = []
        for row in cursor.fetchall():
            joia = dict(row)
            
            # Adicionar URL completa da imagem se existir
            if joia.get('imagem_path'):
                joia['imagem_url'] = joia['imagem_path']
            
            # Determinar preço a mostrar
            preco = joia.get('preco_web') or joia.get('preco_venda_2') or joia.get('preco', 0)
            joia['preco_display'] = float(preco) if preco else 0
            
            # Adicionar categoria baseada na descrição
            desc = (joia.get('descricao_completa') or joia.get('descricao') or '').lower()
            if 'anel' in desc or 'aliança' in desc:
                joia['categoria'] = 'Anéis'
            elif 'brinco' in desc:
                joia['categoria'] = 'Brincos'
            elif 'colar' in desc or 'corrente' in desc:
                joia['categoria'] = 'Colares'
            elif 'pulseira' in desc:
                joia['categoria'] = 'Pulseiras'
            elif 'pingente' in desc:
                joia['categoria'] = 'Pingentes'
            else:
                joia['categoria'] = 'Diversos'
            
            joias.append(joia)
        
        # Calcular informações de paginação
        total_pages = (total + per_page - 1) // per_page
        
        response = {
            "joias": joias,
            "pagination": {
                "page": page,
                "per_page": per_page,
                "total": total,
                "total_pages": total_pages,
                "has_prev": page > 1,
                "has_next": page < total_pages
            }
        }
        
        conn.close()
        return jsonify(response)
        
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@enhanced_jewelry_bp.route("/joias/related/<int:joia_id>", methods=["GET"])
def get_related_joias(joia_id):
    """Obter joias relacionadas (mesma joia, pedras diferentes)"""
    try:
        conn = get_db()
        cursor = conn.cursor()
        
        # Primeiro, obter a joia atual e suas relacionadas
        cursor.execute("""
        SELECT joias_relacionadas, nome, id_original
        FROM joias
        WHERE id = ? OR id_original = ?
        """, (joia_id, joia_id))
        
        row = cursor.fetchone()
        if not row:
            conn.close()
            return jsonify({"error": "Joia não encontrada"}), 404
        
        # Obter IDs relacionados
        ids_str = row['joias_relacionadas']
        nome_base = row['nome']
        
        related_joias = []
        
        if ids_str:
            # Converter string de IDs em lista
            ids = [int(id_str) for id_str in ids_str.split(',') if id_str.strip()]
            
            # Buscar joias relacionadas
            placeholders = ','.join(['?' for _ in ids])
            cursor.execute(f"""
            SELECT 
                id, nome, descricao_completa, preco, preco_web,
                imagem_path, id_original, estoque
            FROM joias
            WHERE id_original IN ({placeholders})
            ORDER BY 
                CASE WHEN imagem_path IS NOT NULL THEN 0 ELSE 1 END,
                id DESC
            """, ids)
            
            for row in cursor.fetchall():
                joia = dict(row)
                preco = joia.get('preco_web') or joia.get('preco', 0)
                joia['preco_display'] = float(preco) if preco else 0
                related_joias.append(joia)
        else:
            # Se não tem relacionadas explícitas, buscar por nome similar
            cursor.execute("""
            SELECT 
                id, nome, descricao_completa, preco, preco_web,
                imagem_path, id_original, estoque
            FROM joias
            WHERE nome = ? AND id != ?
            ORDER BY 
                CASE WHEN imagem_path IS NOT NULL THEN 0 ELSE 1 END,
                id DESC
            LIMIT 20
            """, (nome_base, joia_id))
            
            for row in cursor.fetchall():
                joia = dict(row)
                preco = joia.get('preco_web') or joia.get('preco', 0)
                joia['preco_display'] = float(preco) if preco else 0
                related_joias.append(joia)
        
        conn.close()
        
        return jsonify({
            "nome_base": nome_base,
            "total": len(related_joias),
            "joias": related_joias
        })
        
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@enhanced_jewelry_bp.route("/joias/stats", methods=["GET"])
def get_joias_stats():
    """Obter estatísticas das joias"""
    try:
        conn = get_db()
        cursor = conn.cursor()
        
        # Total de joias
        cursor.execute("SELECT COUNT(*) FROM joias")
        total = cursor.fetchone()[0]
        
        # Joias com imagem
        cursor.execute("SELECT COUNT(*) FROM joias WHERE imagem_path IS NOT NULL")
        com_imagem = cursor.fetchone()[0]
        
        # Joias por categoria (baseado na descrição)
        categorias = {
            'Anéis': 0,
            'Brincos': 0,
            'Colares': 0,
            'Pulseiras': 0,
            'Pingentes': 0,
            'Diversos': 0
        }
        
        cursor.execute("SELECT descricao_completa, descricao FROM joias")
        for row in cursor.fetchall():
            desc = ((row['descricao_completa'] or '') + ' ' + (row['descricao'] or '')).lower()
            if 'anel' in desc or 'aliança' in desc:
                categorias['Anéis'] += 1
            elif 'brinco' in desc:
                categorias['Brincos'] += 1
            elif 'colar' in desc or 'corrente' in desc:
                categorias['Colares'] += 1
            elif 'pulseira' in desc:
                categorias['Pulseiras'] += 1
            elif 'pingente' in desc:
                categorias['Pingentes'] += 1
            else:
                categorias['Diversos'] += 1
        
        conn.close()
        
        return jsonify({
            "total": total,
            "com_imagem": com_imagem,
            "sem_imagem": total - com_imagem,
            "categorias": categorias
        })
        
    except Exception as e:
        return jsonify({"error": str(e)}), 500
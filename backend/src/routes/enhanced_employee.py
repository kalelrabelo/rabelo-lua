#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Rotas aprimoradas para funcionários com detalhes completos
"""

from flask import Blueprint, request, jsonify
import sqlite3
from datetime import datetime

enhanced_employee_bp = Blueprint("enhanced_employee", __name__)

def get_db():
    """Obter conexão com o banco de dados"""
    conn = sqlite3.connect('data/joalheria.db')
    conn.row_factory = sqlite3.Row
    return conn

@enhanced_employee_bp.route("/funcionarios/enhanced", methods=["GET"])
def get_funcionarios_enhanced():
    """Listar funcionários com paginação e dados completos"""
    try:
        page = max(1, request.args.get("page", 1, type=int))
        per_page = min(100, request.args.get("per_page", 10, type=int))
        offset = (page - 1) * per_page
        
        search = request.args.get("search", "")
        order_by = request.args.get("order_by", "id")
        order_dir = request.args.get("order_dir", "desc").upper()
        
        conn = get_db()
        cursor = conn.cursor()
        
        # Query base
        base_query = "FROM employee WHERE 1=1"
        params = []
        
        if search:
            base_query += " AND (name LIKE ? OR cargo LIKE ? OR cpf LIKE ?)"
            search_param = f"%{search}%"
            params.extend([search_param, search_param, search_param])
        
        # Contar total
        count_query = f"SELECT COUNT(*) {base_query}"
        cursor.execute(count_query, params)
        total = cursor.fetchone()[0]
        
        # Query principal
        select_query = f"""
        SELECT 
            id, name, cpf, rg, cargo, role,
            data_nascimento, endereco, telefone, email,
            salary, data_admissao, naturalidade,
            estado_civil, nome_mae, nome_pai,
            foto_path, active, id_original
        {base_query}
        ORDER BY {order_by} {order_dir}
        LIMIT ? OFFSET ?
        """
        
        params.extend([per_page, offset])
        cursor.execute(select_query, params)
        
        funcionarios = []
        for row in cursor.fetchall():
            func = dict(row)
            
            # Formatar dados
            if func.get('data_nascimento'):
                try:
                    dt = datetime.strptime(func['data_nascimento'], '%Y-%m-%d')
                    func['data_nascimento_formatada'] = dt.strftime('%d/%m/%Y')
                    # Calcular idade
                    hoje = datetime.now()
                    idade = hoje.year - dt.year
                    if (hoje.month, hoje.day) < (dt.month, dt.day):
                        idade -= 1
                    func['idade'] = idade
                except:
                    func['data_nascimento_formatada'] = func['data_nascimento']
                    func['idade'] = None
            
            if func.get('data_admissao'):
                try:
                    dt = datetime.strptime(func['data_admissao'], '%Y-%m-%d')
                    func['data_admissao_formatada'] = dt.strftime('%d/%m/%Y')
                    # Calcular tempo de serviço
                    hoje = datetime.now()
                    anos = hoje.year - dt.year
                    if (hoje.month, hoje.day) < (dt.month, dt.day):
                        anos -= 1
                    func['tempo_servico'] = f"{anos} anos"
                except:
                    func['data_admissao_formatada'] = func['data_admissao']
                    func['tempo_servico'] = None
            
            # Formatar salário
            if func.get('salary'):
                func['salario_formatado'] = f"R$ {func['salary']:,.2f}".replace(',', 'X').replace('.', ',').replace('X', '.')
            
            funcionarios.append(func)
        
        # Calcular informações de paginação
        total_pages = (total + per_page - 1) // per_page
        
        response = {
            "funcionarios": funcionarios,
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

@enhanced_employee_bp.route("/funcionarios/<int:func_id>/carteira", methods=["GET"])
def get_funcionario_carteira(func_id):
    """Obter dados do funcionário formatados para carteira de identidade"""
    try:
        conn = get_db()
        cursor = conn.cursor()
        
        cursor.execute("""
        SELECT 
            id, name, cpf, rg, cargo, role,
            data_nascimento, endereco, telefone, email,
            salary, data_admissao, naturalidade,
            estado_civil, nome_mae, nome_pai,
            foto_path, active, id_original
        FROM employee
        WHERE id = ?
        """, (func_id,))
        
        row = cursor.fetchone()
        if not row:
            conn.close()
            return jsonify({"error": "Funcionário não encontrado"}), 404
        
        func = dict(row)
        
        # Formatar dados para carteira
        carteira = {
            "dados_pessoais": {
                "nome": func.get('name', ''),
                "cpf": func.get('cpf', ''),
                "rg": func.get('rg', ''),
                "data_nascimento": func.get('data_nascimento', ''),
                "naturalidade": func.get('naturalidade', ''),
                "estado_civil": func.get('estado_civil', ''),
                "nome_mae": func.get('nome_mae', 'Não informado'),
                "nome_pai": func.get('nome_pai', 'Não informado')
            },
            "dados_profissionais": {
                "id_funcionario": func.get('id'),
                "id_original": func.get('id_original'),
                "cargo": func.get('cargo') or func.get('role', ''),
                "data_admissao": func.get('data_admissao', ''),
                "salario": func.get('salary', 0),
                "ativo": func.get('active', True)
            },
            "contato": {
                "endereco": func.get('endereco', ''),
                "telefone": func.get('telefone', ''),
                "email": func.get('email', '')
            },
            "foto_path": func.get('foto_path'),
            "assinatura_digital": f"FUNC-{func.get('id'):04d}-{datetime.now().strftime('%Y')}"
        }
        
        # Formatar datas
        if carteira['dados_pessoais']['data_nascimento']:
            try:
                dt = datetime.strptime(carteira['dados_pessoais']['data_nascimento'], '%Y-%m-%d')
                carteira['dados_pessoais']['data_nascimento_formatada'] = dt.strftime('%d/%m/%Y')
                # Calcular idade
                hoje = datetime.now()
                idade = hoje.year - dt.year
                if (hoje.month, hoje.day) < (dt.month, dt.day):
                    idade -= 1
                carteira['dados_pessoais']['idade'] = f"{idade} anos"
            except:
                carteira['dados_pessoais']['data_nascimento_formatada'] = carteira['dados_pessoais']['data_nascimento']
        
        if carteira['dados_profissionais']['data_admissao']:
            try:
                dt = datetime.strptime(carteira['dados_profissionais']['data_admissao'], '%Y-%m-%d')
                carteira['dados_profissionais']['data_admissao_formatada'] = dt.strftime('%d/%m/%Y')
                # Calcular tempo de serviço
                hoje = datetime.now()
                anos = hoje.year - dt.year
                if (hoje.month, hoje.day) < (dt.month, dt.day):
                    anos -= 1
                carteira['dados_profissionais']['tempo_servico'] = f"{anos} anos"
            except:
                carteira['dados_profissionais']['data_admissao_formatada'] = carteira['dados_profissionais']['data_admissao']
        
        # Formatar salário
        if carteira['dados_profissionais']['salario']:
            carteira['dados_profissionais']['salario_formatado'] = f"R$ {carteira['dados_profissionais']['salario']:,.2f}".replace(',', 'X').replace('.', ',').replace('X', '.')
        
        conn.close()
        return jsonify(carteira)
        
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@enhanced_employee_bp.route("/funcionarios/<int:func_id>/foto", methods=["POST"])
def upload_foto_funcionario(func_id):
    """Upload de foto do funcionário"""
    try:
        if 'foto' not in request.files:
            return jsonify({"error": "Nenhuma foto enviada"}), 400
        
        file = request.files['foto']
        if file.filename == '':
            return jsonify({"error": "Arquivo sem nome"}), 400
        
        # Salvar arquivo
        filename = f"funcionario_{func_id}.jpg"
        filepath = f"/images/funcionarios/{filename}"
        
        # Aqui você salvaria o arquivo no sistema de arquivos
        # file.save(os.path.join('frontend/public/images/funcionarios', filename))
        
        # Atualizar banco de dados
        conn = get_db()
        cursor = conn.cursor()
        
        cursor.execute("""
        UPDATE employee
        SET foto_path = ?
        WHERE id = ?
        """, (filepath, func_id))
        
        conn.commit()
        conn.close()
        
        return jsonify({
            "success": True,
            "foto_path": filepath
        })
        
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@enhanced_employee_bp.route("/funcionarios/stats", methods=["GET"])
def get_funcionarios_stats():
    """Obter estatísticas dos funcionários"""
    try:
        conn = get_db()
        cursor = conn.cursor()
        
        # Total de funcionários
        cursor.execute("SELECT COUNT(*) FROM employee")
        total = cursor.fetchone()[0]
        
        # Funcionários ativos
        cursor.execute("SELECT COUNT(*) FROM employee WHERE active = 1")
        ativos = cursor.fetchone()[0]
        
        # Por cargo
        cursor.execute("""
        SELECT cargo, COUNT(*) as total
        FROM employee
        WHERE cargo IS NOT NULL
        GROUP BY cargo
        """)
        
        por_cargo = {}
        for row in cursor.fetchall():
            por_cargo[row['cargo']] = row['total']
        
        # Folha de pagamento total
        cursor.execute("SELECT SUM(salary) FROM employee WHERE active = 1")
        folha_total = cursor.fetchone()[0] or 0
        
        conn.close()
        
        return jsonify({
            "total": total,
            "ativos": ativos,
            "inativos": total - ativos,
            "por_cargo": por_cargo,
            "folha_pagamento_total": folha_total,
            "folha_pagamento_formatada": f"R$ {folha_total:,.2f}".replace(',', 'X').replace('.', ',').replace('X', '.')
        })
        
    except Exception as e:
        return jsonify({"error": str(e)}), 500
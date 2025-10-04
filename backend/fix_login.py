#!/usr/bin/env python3
"""
Script de correção do erro de login HTTP 500
Cria usuários de teste e verifica integridade do banco
"""

import os
import sys
from pathlib import Path

# Adicionar o diretório backend ao PYTHONPATH
backend_dir = Path(__file__).resolve().parent
sys.path.insert(0, str(backend_dir))

from src.models.user import db, User
from flask import Flask
import bcrypt

def create_app():
    """Cria aplicação Flask para contexto"""
    app = Flask(__name__)
    
    # Configuração do banco de dados
    BASE_DIR = Path(__file__).resolve().parent
    DATA_DIR = BASE_DIR / 'data'
    DATA_DIR.mkdir(exist_ok=True)
    
    DATABASE_PATH = DATA_DIR / 'joalheria.db'
    app.config['SQLALCHEMY_DATABASE_URI'] = f'sqlite:///{str(DATABASE_PATH)}'
    app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
    app.config['SECRET_KEY'] = 'dev-secret-key'
    
    db.init_app(app)
    return app

def hash_password(password):
    """Cria hash seguro da senha usando bcrypt"""
    return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

def fix_login_issues():
    """Corrige problemas de login e cria usuários de teste"""
    app = create_app()
    
    with app.app_context():
        print("🔧 Iniciando correção do sistema de login...")
        
        # Criar tabelas se não existirem
        try:
            db.create_all()
            print("✅ Banco de dados verificado/criado")
        except Exception as e:
            print(f"❌ Erro ao criar banco: {e}")
            return False
        
        # Verificar se existem usuários
        user_count = User.query.count()
        print(f"📊 Usuários existentes: {user_count}")
        
        # Criar usuários de teste se não existirem
        test_users = [
            {
                'username': 'admin',
                'email': 'admin@joalheria.com',
                'password': 'admin123',
                'is_admin': True
            },
            {
                'username': 'user',
                'email': 'user@joalheria.com',
                'password': 'user123',
                'is_admin': False
            },
            {
                'username': 'lua',
                'email': 'lua@assistant.com',
                'password': 'lua2024',
                'is_admin': True
            }
        ]
        
        for user_data in test_users:
            # Verificar se usuário já existe
            existing = User.query.filter(
                (User.username == user_data['username']) | 
                (User.email == user_data['email'])
            ).first()
            
            if existing:
                print(f"ℹ️  Usuário '{user_data['username']}' já existe")
                # Atualizar senha se necessário
                try:
                    existing.password_hash = hash_password(user_data['password'])
                    existing.is_admin = user_data['is_admin']
                    db.session.commit()
                    print(f"✅ Senha atualizada para '{user_data['username']}'")
                except Exception as e:
                    print(f"⚠️  Erro ao atualizar '{user_data['username']}': {e}")
            else:
                # Criar novo usuário
                try:
                    new_user = User(
                        username=user_data['username'],
                        email=user_data['email'],
                        password_hash=hash_password(user_data['password']),
                        is_admin=user_data['is_admin']
                    )
                    db.session.add(new_user)
                    db.session.commit()
                    print(f"✅ Usuário '{user_data['username']}' criado com sucesso")
                except Exception as e:
                    print(f"❌ Erro ao criar '{user_data['username']}': {e}")
                    db.session.rollback()
        
        # Listar todos os usuários
        print("\n📋 Usuários disponíveis para login:")
        print("-" * 50)
        all_users = User.query.all()
        for user in all_users:
            admin_badge = "👑" if user.is_admin else "👤"
            print(f"{admin_badge} Username: {user.username}")
            print(f"   Email: {user.email}")
            print(f"   Admin: {'Sim' if user.is_admin else 'Não'}")
            print("-" * 50)
        
        print("\n✅ Correção concluída!")
        print("\n🔑 Credenciais de teste:")
        print("   Admin: admin / admin123")
        print("   User: user / user123")
        print("   LUA: lua / lua2024")
        
        return True

if __name__ == "__main__":
    success = fix_login_issues()
    if success:
        print("\n🎉 Sistema de login corrigido com sucesso!")
        print("📝 Agora você pode fazer login com as credenciais acima")
    else:
        print("\n❌ Houve problemas durante a correção")
        print("📝 Verifique os erros acima e tente novamente")
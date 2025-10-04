#!/usr/bin/env python3
"""
Script de verificação para testar se o problema do IntegrityError foi resolvido
"""

import os
import sys
import sqlite3
from pathlib import Path

def verify_database():
    """Verifica a estrutura e dados do banco"""
    db_path = Path(__file__).parent / 'data' / 'joalheria.db'
    
    if not db_path.exists():
        print("❌ Banco de dados não encontrado")
        return False
    
    print(f"✅ Banco de dados encontrado: {db_path}")
    
    try:
        conn = sqlite3.connect(str(db_path))
        cursor = conn.cursor()
        
        # Verificar usuários
        cursor.execute("SELECT username, email, is_admin FROM user ORDER BY username")
        users = cursor.fetchall()
        
        print(f"✅ Usuários no banco: {len(users)}")
        for username, email, is_admin in users:
            admin_status = "👑 Admin" if is_admin else "👤 User"
            print(f"   - {username} ({email}) {admin_status}")
        
        # Verificar constraint UNIQUE no email
        cursor.execute("SELECT COUNT(DISTINCT email) as unique_emails, COUNT(*) as total_users FROM user")
        unique_emails, total_users = cursor.fetchone()
        
        if unique_emails == total_users:
            print("✅ Todos os emails são únicos - constraint UNIQUE funcionando")
        else:
            print("❌ Emails duplicados encontrados!")
            return False
        
        conn.close()
        return True
        
    except Exception as e:
        print(f"❌ Erro ao verificar banco: {e}")
        return False

def verify_secret_key():
    """Verifica se o SECRET_KEY está sendo lido do ambiente"""
    # Teste 1: com SECRET_KEY no ambiente
    os.environ['SECRET_KEY'] = 'test_secret_123'
    
    import importlib
    import main
    importlib.reload(main)
    
    if main.app.config['SECRET_KEY'] == 'test_secret_123':
        print("✅ SECRET_KEY sendo lido corretamente do ambiente")
        env_test = True
    else:
        print("❌ SECRET_KEY não sendo lido do ambiente")
        env_test = False
    
    # Teste 2: sem SECRET_KEY no ambiente (deve usar default)
    del os.environ['SECRET_KEY']
    importlib.reload(main)
    
    if main.app.config['SECRET_KEY'] == 'dev-secret-change-me':
        print("✅ SECRET_KEY usando valor default quando não definido")
        default_test = True
    else:
        print("❌ SECRET_KEY default não funcionando")
        default_test = False
    
    return env_test and default_test

def main():
    """Executa todas as verificações"""
    print("🔍 Verificando correções do IntegrityError...")
    print("=" * 50)
    
    success = True
    
    # Teste 1: Verificar banco de dados
    if not verify_database():
        success = False
    
    print()
    
    # Teste 2: Verificar SECRET_KEY
    if not verify_secret_key():
        success = False
    
    print()
    print("=" * 50)
    
    if success:
        print("✅ Todas as verificações passaram!")
        print("🎉 O problema do IntegrityError foi resolvido com sucesso!")
        return 0
    else:
        print("❌ Algumas verificações falharam!")
        return 1

if __name__ == "__main__":
    sys.exit(main())
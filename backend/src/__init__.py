"""
Módulo principal da aplicação backend
"""

# Configurar o path para importações
import sys
from pathlib import Path

# Adicionar o diretório backend ao path
backend_dir = Path(__file__).resolve().parent.parent
if str(backend_dir) not in sys.path:
    sys.path.insert(0, str(backend_dir))
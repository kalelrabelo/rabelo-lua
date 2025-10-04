import os
import sys
from pathlib import Path

# Adicionar o diretório backend ao PYTHONPATH para resolver importações
backend_dir = Path(__file__).resolve().parent
sys.path.insert(0, str(backend_dir))

from datetime import datetime, timedelta
import jwt
from flask import Flask, send_from_directory, send_file, request, jsonify
from flask_cors import CORS
import bcrypt

# Importar db primeiro
from src.models.user import db

# Importar modelos
from src.models.user import User
from src.models.jewelry import Jewelry
from src.models.material import Material
from src.models.pattern import Pattern
from src.models.pattern_image import PatternImage
from src.models.stone import Stone
from src.models.employee import Employee
from src.models.vale import Vale
from src.models.payment import Payment
from src.models.caixa import CaixaCategory, CaixaTransaction
from src.models.payroll import Payroll
from src.models.order import Order
from src.models.inventory import Inventory
from src.models.cost import Cost, Profit
from src.models.nota import Nota
from src.models.imposto import Imposto
from src.models.financial import FinancialTransaction, ProductionReport, AdvancedOrder, DiscountTable
from src.models.customer import Customer
from src.models.supplier import Supplier
from src.models.size import Size # Importar modelo Size

# Importar rotas
from src.routes.user import user_bp
from src.utils.auth import auth_required
from src.routes.jewelry import jewelry_bp
from src.routes.materials import materials_bp
from src.routes.patterns import patterns_bp
from src.routes.stones import stones_bp
from src.routes.employees import employees_bp
from src.routes.vales import vales_bp
from src.routes.payments import payments_bp
from src.routes.caixa import caixa_bp
from src.routes.payroll import payroll_bp
from src.routes.orders import orders_bp
from src.routes.inventory import inventory_bp
from src.routes.costs import costs_bp
from src.routes.discounts import discounts_bp
from src.routes.notas import notas_bp
from src.routes.financial import financial_bp
from src.routes.customers import customers_bp
from src.routes.sizes import sizes_bp # Importar rota sizes_bp

# Importar rotas aprimoradas
from src.routes.enhanced_jewelry import enhanced_jewelry_bp
from src.routes.enhanced_employee import enhanced_employee_bp
from src.routes.dashboard import dashboard_bp
from src.routes.ai_assistant import ai_bp  # Rota da IA Lua
from src.routes.ai_assistant_enhanced import ai_enhanced_bp  # Rota da IA Lua Melhorada
# Nova integração com Ollama
try:
    from src.routes.ai_assistant_ollama import ai_ollama_bp  # Nova rota com Ollama
    OLLAMA_AVAILABLE = True
    print("✅ Sistema LUA com Ollama carregado")
except ImportError as e:
    print(f"⚠️ Sistema Ollama não disponível: {e}")
    OLLAMA_AVAILABLE = False
    ai_ollama_bp = None
# Sistema de voz - Migração para Kokoro
try:
    from src.routes.kokoro_voice import kokoro_voice_bp  # Nova rota Kokoro
    KOKORO_AVAILABLE = True
    print("✅ Sistema Kokoro TTS carregado")
except ImportError as e:
    print(f"⚠️ Sistema Kokoro não disponível: {e}")
    # Criar blueprint vazio para evitar erros
    from flask import Blueprint
    kokoro_voice_bp = Blueprint('kokoro_voice', __name__)
    KOKORO_AVAILABLE = False

# Manter compatibilidade com sistema antigo temporariamente
try:
    from src.routes.ai_voice import ai_voice_bp  # Rota antiga (fallback)
    from src.routes.voice_config import voice_config_bp  # Rota antiga de config
    AI_VOICE_AVAILABLE = True
except ImportError:
    print("⚠️ Sistema de voz antigo não disponível")
    AI_VOICE_AVAILABLE = False
    voice_config_bp = None

app = Flask(__name__)



# Configuração do banco de dados com caminho relativo para Windows
BASE_DIR = Path(__file__).resolve().parent
DATA_DIR = BASE_DIR / 'data'
DATA_DIR.mkdir(exist_ok=True)  # Criar pasta data se não existir

# Usar caminho relativo que funciona em Windows e Linux
DATABASE_PATH = DATA_DIR / 'joalheria.db'
app.config['SQLALCHEMY_DATABASE_URI'] = f'sqlite:///{str(DATABASE_PATH)}'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
app.config['SECRET_KEY'] = os.getenv('SECRET_KEY', 'dev-secret-change-me')
if app.config['SECRET_KEY'] == 'dev-secret-change-me':
    print("⚠️  WARNING: Using default SECRET_KEY. Set SECRET_KEY environment variable for production!")

# Inicializar extensões
db.init_app(app)
CORS(app, resources={
    r"/*": {
        "origins": ["http://localhost:3000", "http://127.0.0.1:3000", "http://localhost:5173", "http://localhost:5174", "http://localhost:5175", "http://localhost:5176"],
        "methods": ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
        "allow_headers": ["Content-Type", "Authorization"]
    }
})

# Função para hash de senha usando bcrypt
def hash_password(password):
    """Cria hash seguro da senha usando bcrypt"""
    return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

def check_password(password, hashed):
    """Verifica se a senha corresponde ao hash"""
    return bcrypt.checkpw(password.encode('utf-8'), hashed.encode('utf-8'))

# Função para gerar token JWT
def generate_token(user_id):
    payload = {
        'user_id': user_id,
        'exp': datetime.utcnow() + timedelta(days=1)
    }
    return jwt.encode(payload, app.config['SECRET_KEY'], algorithm='HS256')

# Função para verificar token JWT
def verify_token(token):
    try:
        payload = jwt.decode(token, app.config['SECRET_KEY'], algorithms=['HS256'])
        return payload['user_id']
    except jwt.ExpiredSignatureError:
        return None
    except jwt.InvalidTokenError:
        return None



# Rotas de autenticação
@app.route('/api/login', methods=['POST'])
def login():
    try:
        data = request.get_json()
        if not data:
            return jsonify({'error': 'Dados não fornecidos'}), 400
            
        username = data.get('username')
        password = data.get('password')

        if not username or not password:
            return jsonify({'error': 'Username e password são obrigatórios'}), 400

        print(f"Tentativa de login - Usuário: {username}")

        try:
            # Tentar buscar usuário no banco de dados
            user = User.query.filter_by(username=username).first()
        except Exception as db_error:
            print(f"Erro ao acessar banco de dados: {db_error}")
            # Tentar inicializar banco se não existir
            try:
                with app.app_context():
                    db.create_all()
                    print("⚠️ Banco de dados foi criado agora")
                    # Tentar buscar usuário novamente
                    user = User.query.filter_by(username=username).first()
            except Exception as init_error:
                print(f"Erro ao inicializar banco: {init_error}")
                return jsonify({'error': 'Erro ao acessar banco de dados. Por favor, reinicie o servidor.'}), 503

        if user:
            # Verificar senha com bcrypt
            try:
                if check_password(password, user.password_hash):
                    token = generate_token(user.id)

                    print(f"Login bem-sucedido para: {username}")
                    return jsonify({
                        'success': True,
                        'user': {
                            'id': user.id,
                            'username': user.username,
                            'email': user.email,
                            'is_admin': user.is_admin
                        },
                        'token': token
                    })
                else:
                    print(f"Senha incorreta para usuário: {username}")
            except Exception as pwd_error:
                print(f"Erro ao verificar senha: {pwd_error}")
                return jsonify({'error': 'Erro ao verificar credenciais'}), 500
        else:
            print(f"Usuário não encontrado: {username}")
            # Listar usuários existentes para debug (remover em produção)
            try:
                users = User.query.all()
                print(f"Usuários no banco: {[u.username for u in users]}")
            except:
                print("Não foi possível listar usuários")

        return jsonify({'error': 'Credenciais inválidas'}), 401

    except Exception as e:
        print(f"❌ Erro crítico no login: {str(e)}")
        import traceback
        traceback.print_exc()
        return jsonify({
            'error': 'Erro interno do servidor',
            'details': str(e) if request.args.get('debug') else None
        }), 500

@app.route('/api/register', methods=['POST'])
def register():
    """Registra novo usuário no sistema"""
    try:
        data = request.get_json()
        username = data.get('username')
        password = data.get('password')
        email = data.get('email')
        is_admin = data.get('is_admin', False)

        if not username or not password or not email:
            return jsonify({'error': 'Username, password e email são obrigatórios'}), 400

        # Verificar se usuário já existe
        if User.query.filter_by(username=username).first():
            return jsonify({'error': 'Username já existe'}), 400

        if User.query.filter_by(email=email).first():
            return jsonify({'error': 'Email já cadastrado'}), 400

        # Criar novo usuário
        new_user = User(
            username=username,
            email=email,
            password_hash=hash_password(password),
            is_admin=is_admin
        )

        db.session.add(new_user)
        db.session.commit()

        print(f"Novo usuário criado: {username}")

        return jsonify({
            'success': True,
            'message': 'Usuário criado com sucesso',
            'user': {
                'id': new_user.id,
                'username': new_user.username,
                'email': new_user.email,
                'is_admin': new_user.is_admin
            }
        }), 201

    except Exception as e:
        print(f"Erro ao registrar usuário: {str(e)}")
        return jsonify({'error': f'Erro ao criar usuário: {str(e)}'}), 500

@app.route('/api/verify-token', methods=['POST'])
def verify_token_endpoint():
    try:
        data = request.get_json()
        token = data.get('token')

        if not token:
            return jsonify({'valid': False}), 400

        user_id = verify_token(token)
        if user_id:
            user = User.query.get(user_id)
            if user:
                return jsonify({
                    'valid': True,
                    'user': {
                        'id': user.id,
                        'username': user.username,
                        'email': user.email,
                        'is_admin': user.is_admin
                    }
                })

        return jsonify({'valid': False}), 401

    except Exception as e:
        print(f"Erro na verificação do token: {str(e)}")
        return jsonify({'valid': False}), 500

@app.route('/api/logout', methods=['POST'])
@auth_required
def logout():
    # Em uma implementação real, você poderia invalidar o token
    return jsonify({'success': True, 'message': 'Logout realizado com sucesso'})

# Registrar blueprints
app.register_blueprint(user_bp, url_prefix="/api")
app.register_blueprint(jewelry_bp, url_prefix="/api")
app.register_blueprint(materials_bp, url_prefix="/api")
app.register_blueprint(patterns_bp, url_prefix="/api")
app.register_blueprint(stones_bp, url_prefix="/api")
app.register_blueprint(employees_bp, url_prefix="/api")
app.register_blueprint(vales_bp, url_prefix="/api")
app.register_blueprint(payments_bp, url_prefix="/api")
app.register_blueprint(caixa_bp, url_prefix="/api")
app.register_blueprint(payroll_bp, url_prefix="/api")
app.register_blueprint(orders_bp, url_prefix="/api")
app.register_blueprint(inventory_bp, url_prefix="/api")
app.register_blueprint(costs_bp, url_prefix="/api")
app.register_blueprint(discounts_bp, url_prefix="/api")
app.register_blueprint(notas_bp, url_prefix="/api")
app.register_blueprint(financial_bp, url_prefix="/api")
app.register_blueprint(dashboard_bp, url_prefix="/api")
app.register_blueprint(customers_bp, url_prefix="/api")
app.register_blueprint(ai_bp, url_prefix="/api")  # Registrar rotas da IA
app.register_blueprint(ai_enhanced_bp, url_prefix="/api")  # Registrar rotas da IA melhorada
# Registrar blueprints de voz - Priorizar Kokoro
if KOKORO_AVAILABLE:
    app.register_blueprint(kokoro_voice_bp, url_prefix="/api/voice")
    print("✅ Sistema de voz Kokoro registrado")
elif AI_VOICE_AVAILABLE:
    # Fallback para sistema antigo se Kokoro não estiver disponível
    app.register_blueprint(ai_voice_bp, url_prefix="/api/voice")  # Registrar rotas do sistema de voz
    if voice_config_bp:
        app.register_blueprint(voice_config_bp, url_prefix="/api/voice")  # Registrar rotas de configuração de voz
    print("✅ Sistema de voz LUA (antigo) registrado como fallback")
app.register_blueprint(sizes_bp, url_prefix="/api") # Registrar rota sizes_bp

# Registrar rotas aprimoradas
app.register_blueprint(enhanced_jewelry_bp, url_prefix="/api")
app.register_blueprint(enhanced_employee_bp, url_prefix="/api")


def create_or_get_user(username, email, password, is_admin=True):
    """Criar ou obter usuário existente, evitando duplicatas por username OU email"""
    try:
        # Verificar se usuário já existe por username OU email
        existing_user = User.query.filter(
            (User.username == username) | (User.email == email)
        ).first()
        
        if existing_user:
            print(f"✅ Usuário já existe: {existing_user.username} ({existing_user.email})")
            return existing_user
        
        # Criar novo usuário
        new_user = User(
            username=username,
            email=email,
            password_hash=hash_password(password),
            is_admin=is_admin
        )
        
        db.session.add(new_user)
        db.session.commit()  # Commit isolado por usuário
        
        print(f"✅ Usuário criado: {username} ({email})")
        return new_user
        
    except Exception as e:
        print(f"❌ Erro ao criar usuário {username}: {str(e)}")
        db.session.rollback()  # Rollback em caso de erro
        
        # Tentar obter usuário existente após rollback
        existing_user = User.query.filter(
            (User.username == username) | (User.email == email)
        ).first()
        
        if existing_user:
            print(f"✅ Usuário já existente obtido após rollback: {existing_user.username}")
            return existing_user
        
        raise e

# Função de inicialização do banco
def init_database():
    """Inicializa o banco de dados e cria usuários padrão"""
    try:
        # Criar todas as tabelas
        with app.app_context():
            db.create_all()
            print(f"✅ Banco de dados criado em: {DATABASE_PATH}")

            # Criar usuários administradores usando helper robusto
            print("🔧 Criando usuários administradores...")
            
            # Antonio Rabelo - Usuário mestre
            create_or_get_user(
                username='Antonio Rabelo',
                email='antonio@antoniorabelo.com', 
                password='rabloce'
            )
            
            # Antonio Darvin - Segundo administrador  
            create_or_get_user(
                username='Antonio Darvin',
                email='darvin@antoniorabelo.com',
                password='darvince'
            )
            
            # Maria Lucia - Terceira administradora
            create_or_get_user(
                username='Maria Lucia', 
                email='maria@antoniorabelo.com',
                password='luciace'
            )

            # Sistema configurado apenas com os 3 administradores da família Rabelo
            # NÃO criar dados de teste automáticos
            # Todos os dados devem ser inseridos manualmente pelos usuários
            
            print("✅ Sistema inicializado com os 3 administradores autorizados:")
            print("   - Antonio Rabelo (rabloce)")
            print("   - Antonio Darvin (darvince)")
            print("   - Maria Lucia (luciace)")

            print("✅ Banco de dados inicializado com sucesso!")
            return True

    except Exception as e:
        print(f"❌ Erro ao inicializar banco: {str(e)}")
        import traceback
        traceback.print_exc()
        return False

# Rota de teste
@app.route('/api/health', methods=['GET'])
def health_check():
    """Verifica status do sistema"""
    try:
        # Testar conexão com banco
        user_count = User.query.count()
        db_status = "OK"
    except:
        user_count = 0
        db_status = "ERROR"

    return jsonify({
        'status': 'OK', 
        'message': 'ERP Joalheria Antonio Rabelo - Sistema Funcionando',
        'timestamp': datetime.utcnow().isoformat(),
        'database': db_status,
        'users_count': user_count,
        'version': '2.0.0',
        'platform': 'Windows Compatible'
    })

@app.route('/api/lua', methods=['POST'])
def ia_lua():
    """Endpoint para IA Lua - Assistente Virtual"""
    data = request.get_json()
    message = data.get('message', '')
    context = data.get('context', {})
    
    # Processar mensagem e gerar resposta inteligente
    response_text = process_lua_message(message, context)
    
    return jsonify({
        'success': True,
        'response': response_text,
        'timestamp': datetime.utcnow().isoformat()
    })

def process_lua_message(message, context):
    """Processa mensagem da IA Lua e retorna resposta apropriada"""
    message_lower = message.lower()
    
    # Vales
    if 'vale' in message_lower or 'adiantamento' in message_lower:
        if 'josemir' in message_lower:
            vales = Vale.query.filter_by(employee_name='Josemir').all()
            if vales:
                total = sum(v.amount for v in vales)
                return f"Encontrei {len(vales)} vales para Josemir, totalizando R$ {total:.2f}. Abrindo a lista de vales..."
            return "Não encontrei vales para Josemir."
        else:
            total_vales = Vale.query.count()
            return f"Temos {total_vales} vales registrados no sistema. Como posso ajudar com os vales?"
    
    # Funcionários
    if 'funcionário' in message_lower or 'colaborador' in message_lower:
        if 'cadastr' in message_lower:
            return "Vou abrir o formulário de cadastro de funcionário para você."
        else:
            count = Employee.query.count()
            return f"Temos {count} funcionários cadastrados. Abrindo a lista de funcionários..."
    
    # Vendas
    if 'venda' in message_lower or 'pedido' in message_lower:
        if 'hoje' in message_lower or 'dia' in message_lower:
            today_sales = Order.query.filter(
                Order.created_at >= datetime.utcnow().date()
            ).count()
            return f"Hoje temos {today_sales} vendas registradas. Abrindo relatório de vendas do dia..."
        else:
            total_sales = Order.query.count()
            return f"Temos {total_sales} vendas no total. Como posso ajudar com as vendas?"
    
    # Clientes
    if 'cliente' in message_lower:
        count = Customer.query.count()
        return f"Temos {count} clientes cadastrados. Abrindo lista de clientes..."
    
    # Estoque
    if 'estoque' in message_lower or 'produto' in message_lower:
        count = Jewelry.query.count()
        return f"Temos {count} produtos cadastrados no estoque. Abrindo controle de estoque..."
    
    # Encomendas
    if 'encomenda' in message_lower:
        count = Order.query.filter_by(status='encomenda').count()
        return f"Temos {count} encomendas pendentes. Abrindo lista de encomendas..."
    
    # Respostas padrão
    greetings = ['olá', 'oi', 'bom dia', 'boa tarde', 'boa noite']
    if any(g in message_lower for g in greetings):
        return "Olá! Sou a Lua, sua assistente virtual. Como posso ajudá-lo hoje?"
    
    help_keywords = ['ajuda', 'help', 'como', 'o que']
    if any(h in message_lower for h in help_keywords):
        return "Posso ajudar você com:\n• Consultar vales de funcionários\n• Cadastrar novos funcionários\n• Ver vendas do dia\n• Gerenciar clientes\n• Controlar estoque\n• Acompanhar encomendas\n\nO que você gostaria de fazer?"
    
    return "Entendi sua solicitação. Como posso ajudá-lo com isso?"

# Servir arquivos estáticos do frontend
@app.route('/', defaults={'path': ''})
@app.route('/<path:path>')
def serve_frontend(path):
    static_folder = Path(__file__).parent.parent / 'frontend' / 'dist'
    
    if path != "" and (static_folder / path).exists():
        return send_from_directory(str(static_folder), path)
    else:
        index_path = static_folder / 'index.html'
        if index_path.exists():
            return send_from_directory(str(static_folder), 'index.html')
        else:
            return jsonify({'message': 'Frontend não compilado. Execute npm run build no diretório frontend.'}), 404

if __name__ == '__main__':
    # Inicializar banco na primeira execução
    if init_database():
        print("\n" + "="*50)
        print("🚀 ERP JOALHERIA ANTONIO RABELO")
        print("="*50)
        print("📍 Servidor: http://localhost:5000")
        print("🔐 Antonio Rabelo: Antonio Rabelo/rabeloce")
        print("🔐 Darvin Rabelo: Darvin Rabelo/darvince")
        print("🔐 Maria Lucia: Maria Lucia/luciace")
        print("💾 Banco de dados: " + str(DATABASE_PATH))
        print("✅ Sistema pronto para uso!")
        print("="*50 + "\n")

        import os
        debug_mode = os.getenv("FLASK_DEBUG", "0") == "1"
        port = int(os.getenv("PORT", 5000))
        app.run(debug=debug_mode, use_reloader=False, host='0.0.0.0', port=port)
    else:
        print("❌ Falha ao inicializar o sistema. Verifique os logs acima.")
        sys.exit(1)
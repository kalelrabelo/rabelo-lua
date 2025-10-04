# 🤖 Lua TTS System - Sistema Completo de IA Conversacional

## 📋 Visão Geral

Sistema de assistente virtual inteligente com síntese de voz (TTS) e interface visual interativa. A Lua é uma IA conversacional que utiliza o motor Kokoro TTS para síntese de voz em português brasileiro, com uma interface visual impressionante que apresenta uma esfera de energia azul pulsante sincronizada com a voz.

## ✨ Funcionalidades Implementadas

### 1. **Sistema TTS Corrigido** ✅
- Motor Kokoro TTS configurado e otimizado para PT-BR
- Correção do erro `'EspeakG2P' object has no attribute 'lexicon'`
- Suporte a múltiplas vozes em português
- Sistema de cache Redis para otimização

### 2. **Interface Visual da Lua** ✅
- Esfera de energia azul em loop contínuo
- Pulsação sincronizada com a voz da Lua
- Visualizador de áudio em tempo real
- Modo conversa em tela cheia com fade escuro

### 3. **Comunicação Bidirecional** ✅
- WebSocket para comunicação em tempo real
- Speech-to-Text (STT) para captura de voz do usuário
- Text-to-Speech (TTS) para respostas da Lua
- Modo conversa contínua

### 4. **Correções e Melhorias** ✅
- Versões de dependências fixadas para estabilidade
- Correção de warnings do Pydantic
- Dockerfile otimizado
- Suporte para Windows e Linux

## 🚀 Como Executar

### Pré-requisitos

- Docker Desktop instalado e rodando
- 4GB de RAM disponível
- Conexão com internet para baixar dependências

### Método 1: Docker (Recomendado)

#### Windows:
```batch
# Abra o CMD ou PowerShell como Administrador
cd caminho\para\lua-tts-system

# Execute o script de inicialização
start_windows.bat
```

#### Linux/Mac:
```bash
# Dê permissão de execução
chmod +x start_fixed.sh

# Execute o script
./start_fixed.sh
```

### Método 2: Docker Compose Manual

```bash
# Build da imagem
docker build -t lua-tts-fixed -f Dockerfile .

# Iniciar serviços
docker-compose up -d

# Verificar logs
docker-compose logs -f
```

### Método 3: Desenvolvimento Local (sem Docker)

```bash
# Instalar dependências do sistema (Ubuntu/Debian)
sudo apt-get update
sudo apt-get install -y python3.11 python3-pip ffmpeg libsndfile1 espeak-ng portaudio19-dev redis-server

# Criar ambiente virtual
python3 -m venv venv
source venv/bin/activate  # Linux/Mac
# ou
venv\Scripts\activate  # Windows

# Instalar dependências Python
pip install -r requirements_fixed.txt

# Iniciar Redis
redis-server &

# Iniciar aplicação
cd backend
python -m uvicorn main_fixed:app --host 0.0.0.0 --port 8000 --reload
```

## 🎤 Como Usar o Modo Conversa

### 1. **Acessar a Interface**
```
http://localhost:8000
```

### 2. **Iniciar Modo Conversa**

Existem 3 formas de iniciar:

#### Opção 1: Comando de Voz
- Digite ou fale: **"Lua, iniciar modo conversa"**

#### Opção 2: Botão
- Clique no botão **"Iniciar Modo Conversa"**

#### Opção 3: Enter no Campo
- Digite o comando e pressione **Enter**

### 3. **Durante a Conversa**

- 🎤 **Falar**: Clique no botão do microfone ou ele ativa automaticamente
- 👂 **Ouvir**: A Lua responde com voz sintetizada
- 🔵 **Visual**: A esfera pulsa conforme a Lua fala
- 📊 **Visualizador**: Barras de áudio mostram a intensidade da voz

### 4. **Sair do Modo Conversa**
- Pressione **ESC** ou
- Clique no **X** no canto superior direito

## 📁 Estrutura do Projeto

```
lua-tts-system/
├── backend/                    # Backend FastAPI
│   ├── main_fixed.py          # Aplicação principal corrigida
│   ├── modules/               
│   │   ├── tts/              
│   │   │   └── kokoro_engine.py  # Motor TTS corrigido
│   │   └── lua/              
│   │       └── assistant.py      # Lógica da assistente
│   └── core/                     # Configurações
│
├── frontend/                   # Frontend React
│   └── public/
│       ├── index.html         # Interface React completa
│       └── videos/            
│           └── energy-sphere.mp4  # Vídeo da esfera (baixar separadamente)
│
├── Dockerfile                 # Imagem Docker otimizada
├── docker-compose.yml         # Orquestração de serviços
├── requirements_fixed.txt     # Dependências Python corrigidas
├── start_windows.bat         # Script Windows
└── start_fixed.sh           # Script Linux/Mac
```

## 🔧 Configurações

### Variáveis de Ambiente (.env)

```env
# API
API_HOST=0.0.0.0
API_PORT=8000

# TTS
KOKORO_MODEL=hexgrad/Kokoro-82M
KOKORO_LANGUAGE=pt
KOKORO_VOICE=af_heart

# Redis
REDIS_URL=redis://redis:6379

# GPU (opcional)
USE_GPU=false
```

### Vozes Disponíveis

- `luna` - Voz padrão da Lua
- `pt-BR-f1` - Feminina 1
- `pt-BR-f2` - Feminina 2
- `pt-BR-f3` - Feminina 3
- `pt-BR-m1` - Masculina 1
- `pt-BR-m2` - Masculina 2

## 📡 API Endpoints

### WebSocket
- `ws://localhost:8000/ws` - Comunicação em tempo real

### REST API
- `GET /health` - Status do sistema
- `POST /api/tts/synthesize` - Gerar fala
- `POST /api/chat` - Processar mensagem
- `GET /api/tts/voices` - Listar vozes

### Documentação Interativa
- `http://localhost:8000/docs` - Swagger UI
- `http://localhost:8000/redoc` - ReDoc

## 🎥 Vídeo da Esfera

O vídeo da esfera azul (413MB) deve ser baixado separadamente:

### Opção 1: Download Manual
1. Baixe o vídeo de: [Link do vídeo]
2. Salve em: `frontend/public/videos/energy-sphere.mp4`

### Opção 2: Usar Vídeo Alternativo
Você pode usar qualquer vídeo loop de sua preferência, apenas:
1. Renomeie para `energy-sphere.mp4`
2. Coloque em `frontend/public/videos/`

## 🐛 Solução de Problemas

### Erro: "Docker não está rodando"
```bash
# Windows: Inicie o Docker Desktop
# Linux: 
sudo systemctl start docker
```

### Erro: "Port 8000 already in use"
```bash
# Windows
netstat -ano | findstr :8000
taskkill /PID <PID> /F

# Linux
sudo fuser -k 8000/tcp
```

### Erro: "Kokoro engine failed"
```bash
# Reinstalar dependências
docker-compose down
docker-compose build --no-cache
docker-compose up
```

### Microfone não funciona
- Verifique permissões do navegador
- Use HTTPS para produção (requerido para WebRTC)

## 📊 Monitoramento

### Logs em Tempo Real
```bash
# Todos os serviços
docker-compose logs -f

# Apenas backend
docker-compose logs -f lua-backend

# Apenas Redis
docker-compose logs -f redis
```

### Status dos Containers
```bash
docker ps
docker stats
```

## 🔄 Atualizações

### Atualizar do GitHub
```bash
git pull origin main
docker-compose down
docker-compose build --no-cache
docker-compose up -d
```

## 🌐 Deploy em Produção

### Configurações Recomendadas

1. **HTTPS**: Configure certificado SSL
2. **Domínio**: Configure DNS apropriado
3. **Firewall**: Libere portas 80, 443, 8000
4. **Redis**: Use instância dedicada
5. **GPU**: Habilite se disponível

### Docker Swarm / Kubernetes
O sistema está pronto para orquestração:
```yaml
# Exemplo para Kubernetes
kubectl apply -f k8s-deployment.yaml
```

## 📈 Performance

- **Tempo de resposta TTS**: ~500ms - 2s
- **Latência WebSocket**: < 100ms
- **Cache Redis**: 1h para áudios gerados
- **Uso de RAM**: ~2GB
- **Uso de CPU**: ~2 cores

## 🤝 Contribuindo

1. Fork o projeto
2. Crie uma branch (`git checkout -b feature/MinhaFeature`)
3. Commit suas mudanças (`git commit -m 'Add MinhaFeature'`)
4. Push para a branch (`git push origin feature/MinhaFeature`)
5. Abra um Pull Request

## 📄 Licença

Este projeto está sob licença MIT. Veja o arquivo `LICENSE` para mais detalhes.

## 👨‍💻 Autor

**Kalel Rabelo**
- GitHub: [@kalelrabelo](https://github.com/kalelrabelo)
- Repositório: [rabelo-lua](https://github.com/kalelrabelo/rabelo-lua)

## 🙏 Agradecimentos

- Equipe Kokoro TTS
- Comunidade FastAPI
- Contribuidores do projeto

---

**Desenvolvido com ❤️ por Kalel Rabelo**
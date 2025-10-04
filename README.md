# 🌙 Lua TTS System - Assistente de IA com Voz PT-BR

Sistema completo de Text-to-Speech (TTS) com assistente de IA conversacional, utilizando o modelo **Kokoro-82M** para síntese de voz em português brasileiro.

## 🚀 Características Principais

### ✅ Funcionalidades Implementadas
- ✨ **Assistente Lua**: IA conversacional com personalidade amigável
- 🎙️ **TTS em PT-BR**: Síntese de voz natural usando Kokoro-82M
- 🔊 **Múltiplas Vozes**: 6 vozes disponíveis (3 femininas, 2 masculinas, 1 Lua)
- ⚡ **API RESTful**: Endpoints completos para TTS e chat
- 🎨 **Interface Web**: Frontend React moderno com Tailwind CSS
- 🐳 **Docker Ready**: Containerização completa para deploy fácil
- 🔄 **Streaming de Áudio**: Resposta em tempo real
- 🎛️ **Controle de Velocidade**: Ajuste de velocidade de fala (0.5x a 2.0x)

### 🛠️ Stack Tecnológica
- **Backend**: FastAPI + Python 3.11
- **TTS Engine**: Kokoro-82M (PyTorch)
- **Frontend**: React 18 + Vite + Tailwind CSS
- **Container**: Docker + Docker Compose
- **Audio**: SoundFile + espeak-ng

## 📦 Instalação e Execução

### Opção 1: Docker (Recomendado)

```bash
# Build da imagem
docker build -t lua-webapp .

# Executar container
docker run -p 8000:8000 lua-webapp

# Ou usar Docker Compose
docker-compose up -d
```

### Opção 2: Execução Local

#### Requisitos
- Python 3.11+
- Node.js 18+
- FFmpeg
- espeak-ng

#### Backend
```bash
# Instalar dependências do sistema (Windows)
# Baixe e instale: https://www.python.org/downloads/
# Baixe FFmpeg: https://ffmpeg.org/download.html

# Criar ambiente virtual
python -m venv venv

# Ativar ambiente (Windows)
venv\Scripts\activate

# Ativar ambiente (Linux/Mac)
source venv/bin/activate

# Instalar dependências
pip install -r requirements.txt

# Executar servidor
cd backend
python main.py
```

#### Frontend
```bash
cd frontend
npm install
npm run dev
```

## 🌐 Endpoints da API

### Endpoints Principais

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| GET | `/` | Informações do sistema |
| GET | `/health` | Status de saúde |
| GET | `/docs` | Documentação Swagger |
| GET | `/api/voice/voices` | Listar vozes disponíveis |
| POST | `/api/voice/speak` | Converter texto em fala |
| POST | `/api/voice/mix` | Misturar múltiplas vozes |
| POST | `/api/chat` | Chat com Lua |
| POST | `/api/chat/voice` | Chat com resposta em voz |
| GET | `/api/chat/history` | Histórico de conversas |
| DELETE | `/api/chat/history` | Limpar histórico |

### Exemplos de Uso

#### 1. Listar Vozes
```bash
curl http://localhost:8000/api/voice/voices
```

#### 2. Gerar Fala
```bash
curl -X POST http://localhost:8000/api/voice/speak \
  -H "Content-Type: application/json" \
  -d '{
    "text": "Olá! Eu sou a Lua, sua assistente virtual.",
    "voice": "luna",
    "speed": 1.0
  }' \
  --output speech.wav
```

#### 3. Chat com Lua
```bash
curl -X POST http://localhost:8000/api/chat \
  -H "Content-Type: application/json" \
  -d '{
    "message": "Olá Lua, como você está?",
    "user_id": "user123"
  }'
```

## 🎯 Vozes Disponíveis

| ID | Descrição | Tipo |
|----|-----------|------|
| `pt-BR-f1` | Voz Feminina 1 | Feminina |
| `pt-BR-f2` | Voz Feminina 2 | Feminina |
| `pt-BR-f3` | Voz Feminina 3 | Feminina |
| `pt-BR-m1` | Voz Masculina 1 | Masculina |
| `pt-BR-m2` | Voz Masculina 2 | Masculina |
| `luna` | Voz da Lua (Padrão) | Assistente |

## 🏗️ Estrutura do Projeto

```
webapp/
├── backend/
│   ├── core/              # Configurações e logger
│   ├── modules/
│   │   ├── lua/           # Módulo da assistente Lua
│   │   └── tts/           # Engine Kokoro TTS
│   ├── main.py            # Aplicação FastAPI
│   └── requirements.txt   # Dependências Python
├── frontend/
│   ├── src/
│   │   ├── components/    # Componentes React
│   │   ├── App.jsx        # Componente principal
│   │   └── main.jsx       # Entry point
│   ├── package.json       # Dependências Node
│   └── vite.config.js     # Configuração Vite
├── Dockerfile             # Imagem Docker
├── docker-compose.yml     # Orquestração
└── README.md             # Documentação
```

## 🔧 Configuração

### Variáveis de Ambiente

Crie um arquivo `.env` no diretório `backend/`:

```env
# API Configuration
API_HOST=0.0.0.0
API_PORT=8000

# Model Configuration
USE_GPU=false
DEFAULT_VOICE=luna
DEFAULT_VOICE_CODE=p

# Features
ENABLE_WEB_PLAYER=true
ENABLE_VOICE_MIXING=true
ENABLE_STREAMING=true

# Logging
LOG_LEVEL=INFO
```

## 🧪 Testes

### Testar Backend
```bash
# Verificar saúde
curl http://localhost:8000/health

# Testar TTS
python -c "
import requests
response = requests.post('http://localhost:8000/api/voice/speak', 
    json={'text': 'Teste de voz', 'voice': 'luna'})
with open('test.wav', 'wb') as f:
    f.write(response.content)
"
```

### Testar Frontend
Acesse: http://localhost:3000

## 📈 Performance

- **Tempo de inicialização**: ~30-60 segundos
- **Latência TTS**: ~500ms para primeira resposta
- **Uso de memória**: ~2GB (CPU) / ~4GB (GPU)
- **Tamanho do modelo**: ~350MB

## 🔄 Próximos Passos Recomendados

1. **Integração com LLM**: Conectar com OpenAI, Anthropic ou Ollama
2. **Speech-to-Text**: Adicionar reconhecimento de voz
3. **Banco de Dados**: Persistir histórico de conversas
4. **Autenticação**: Sistema de usuários
5. **WebSockets**: Comunicação em tempo real
6. **Fine-tuning**: Treinar vozes personalizadas
7. **Cache**: Implementar cache de áudio
8. **Monitoramento**: Adicionar métricas e logs

## 🐛 Solução de Problemas

### Erro: "Model not initialized"
- Aguarde a inicialização completa (~30s)
- Verifique logs: `docker logs lua-tts-system`

### Erro: "Out of memory"
- Reduza batch size
- Use CPU ao invés de GPU
- Aumente memória Docker

### Audio não reproduz
- Verifique FFmpeg instalado
- Teste com curl diretamente
- Verifique CORS no navegador

## 📝 Licença

MIT License - Uso livre para projetos pessoais e comerciais.

## 👨‍💻 Desenvolvimento

Desenvolvido com ❤️ usando:
- **Kokoro-82M** by hexgrad
- **FastAPI** framework
- **React** + **Vite**

## 🆘 Suporte

Para problemas ou dúvidas:
1. Verifique os logs: `docker logs lua-tts-system`
2. Acesse a documentação: http://localhost:8000/docs
3. Teste endpoints individualmente

---
**Versão**: 1.0.0  
**Status**: ✅ Produção  
**Última Atualização**: 2024
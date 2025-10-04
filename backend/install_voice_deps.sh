#!/bin/bash

echo "==================================="
echo "🎙️ Instalando Sistema de Voz LUA"
echo "==================================="

# Verificar Python
python --version
if [ $? -ne 0 ]; then
    echo "❌ Python não encontrado. Instale Python 3.8+ primeiro."
    exit 1
fi

echo ""
echo "📦 Instalando dependências base..."
pip install --upgrade pip

echo ""
echo "🔊 Instalando dependências de áudio..."
# Instalar ffmpeg (necessário para pydub)
if ! command -v ffmpeg &> /dev/null; then
    echo "Instalando ffmpeg..."
    if [[ "$OSTYPE" == "linux-gnu"* ]]; then
        sudo apt-get update && sudo apt-get install -y ffmpeg
    elif [[ "$OSTYPE" == "darwin"* ]]; then
        brew install ffmpeg
    elif [[ "$OSTYPE" == "msys" ]] || [[ "$OSTYPE" == "cygwin" ]]; then
        echo "⚠️  Por favor, instale ffmpeg manualmente no Windows: https://ffmpeg.org/download.html"
    fi
fi

echo ""
echo "🤖 Instalando TTS e Voice Cloning..."
# Instalar PyTorch primeiro (versão CPU para desenvolvimento)
pip install torch torchvision torchaudio --index-url https://download.pytorch.org/whl/cpu

# Instalar Coqui TTS
pip install TTS

# Instalar outras dependências
pip install pydub
pip install numpy scipy librosa soundfile
pip install simpleaudio
pip install gtts  # Fallback

echo ""
echo "📚 Instalando dependências de NLP (opcional)..."
pip install transformers sentencepiece

echo ""
echo "💾 Instalando cache e utilidades..."
pip install redis cachetools

echo ""
echo "✅ Instalação concluída!"
echo ""
echo "🎯 Próximos passos:"
echo "1. Execute: python -c 'from TTS.api import TTS; print(TTS.list_models())' para ver modelos disponíveis"
echo "2. O sistema baixará o modelo XTTS v2 automaticamente no primeiro uso (~2GB)"
echo "3. A voz do Jarvis será processada para voice cloning"
echo ""
echo "⚠️  Notas importantes:"
echo "- O primeiro uso pode demorar devido ao download do modelo"
echo "- Requer ~4GB de espaço em disco para modelos"
echo "- Para GPU, instale torch com CUDA: pip install torch torchvision torchaudio"
echo ""
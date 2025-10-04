"""
Integração do Kokoro TTS com o Backend Flask
Bridge entre o Frontend React e o servidor Kokoro TTS
"""

import os
import requests
import json
import logging
from flask import Blueprint, request, jsonify, send_file
from functools import wraps
from typing import Dict, Any, Optional

# Configurar logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Blueprint
kokoro_voice_bp = Blueprint('kokoro_voice', __name__)

# Configuração
KOKORO_API = os.getenv("KOKORO_API", "http://localhost:8000")
KOKORO_TIMEOUT = 30

def kokoro_available(f):
    """Decorator para verificar se Kokoro está disponível"""
    @wraps(f)
    def decorated_function(*args, **kwargs):
        try:
            response = requests.get(f"{KOKORO_API}/api/voice/status", timeout=5)
            if response.status_code != 200:
                return jsonify({"error": "Kokoro TTS offline"}), 503
        except:
            return jsonify({"error": "Kokoro TTS não disponível"}), 503
        return f(*args, **kwargs)
    return decorated_function

@kokoro_voice_bp.route('/api/voice/status', methods=['GET'])
def voice_status():
    """Status do sistema de voz"""
    try:
        # Verificar Kokoro
        kokoro_status = "offline"
        kokoro_info = {}
        
        try:
            response = requests.get(f"{KOKORO_API}/api/voice/status", timeout=5)
            if response.status_code == 200:
                kokoro_status = "online"
                kokoro_info = response.json()
        except Exception as e:
            logger.error(f"Erro ao verificar Kokoro: {e}")
        
        return jsonify({
            "status": kokoro_status,
            "service": "Kokoro TTS",
            "api_url": KOKORO_API,
            "info": kokoro_info,
            "features": [
                "multiple_voices",
                "voice_mixing",
                "emotion_control",
                "speed_pitch_control",
                "brazilian_portuguese"
            ]
        })
    except Exception as e:
        logger.error(f"Erro no status: {e}")
        return jsonify({"error": str(e)}), 500

@kokoro_voice_bp.route('/api/voice/list', methods=['GET'])
@kokoro_available
def list_voices():
    """Listar vozes disponíveis"""
    try:
        response = requests.get(
            f"{KOKORO_API}/api/voices",
            timeout=KOKORO_TIMEOUT
        )
        
        if response.status_code == 200:
            return jsonify(response.json())
        else:
            return jsonify({"error": "Erro ao buscar vozes"}), response.status_code
            
    except requests.exceptions.Timeout:
        return jsonify({"error": "Timeout ao buscar vozes"}), 504
    except Exception as e:
        logger.error(f"Erro ao listar vozes: {e}")
        return jsonify({"error": str(e)}), 500

@kokoro_voice_bp.route('/api/voice/synthesize', methods=['POST'])
@kokoro_available
def synthesize_speech():
    """Sintetizar fala"""
    try:
        data = request.json
        
        if not data or 'text' not in data:
            return jsonify({"error": "Texto não fornecido"}), 400
        
        # Preparar payload para Kokoro
        payload = {
            "text": data.get('text'),
            "voice_id": data.get('voice_id', 'luna_br'),
            "speed": data.get('speed', 1.0),
            "pitch": data.get('pitch', 1.0),
            "emotion": data.get('emotion', 'neutral'),
            "format": data.get('format', 'mp3')
        }
        
        # Chamar Kokoro TTS
        response = requests.post(
            f"{KOKORO_API}/api/tts",
            json=payload,
            timeout=KOKORO_TIMEOUT
        )
        
        if response.status_code == 200:
            result = response.json()
            
            # Adicionar URL completa
            if 'url' in result:
                result['full_url'] = f"{KOKORO_API}{result['url']}"
            
            return jsonify(result)
        else:
            return jsonify({"error": "Erro na síntese"}), response.status_code
            
    except requests.exceptions.Timeout:
        return jsonify({"error": "Timeout na síntese"}), 504
    except Exception as e:
        logger.error(f"Erro na síntese: {e}")
        return jsonify({"error": str(e)}), 500

@kokoro_voice_bp.route('/api/voice/preview', methods=['POST'])
@kokoro_available
def preview_voice():
    """Preview de uma voz específica"""
    try:
        data = request.json
        voice_id = data.get('voice_id', 'luna_br')
        
        # Chamar endpoint de preview do Kokoro
        response = requests.post(
            f"{KOKORO_API}/api/voice/preview",
            params={"voice_id": voice_id},
            timeout=KOKORO_TIMEOUT
        )
        
        if response.status_code == 200:
            result = response.json()
            
            # Adicionar URL completa
            if 'url' in result:
                result['full_url'] = f"{KOKORO_API}{result['url']}"
            
            return jsonify(result)
        else:
            return jsonify({"error": "Erro no preview"}), response.status_code
            
    except Exception as e:
        logger.error(f"Erro no preview: {e}")
        return jsonify({"error": str(e)}), 500

@kokoro_voice_bp.route('/api/voice/mix', methods=['POST'])
@kokoro_available
def mix_voices():
    """Misturar múltiplas vozes"""
    try:
        data = request.json
        
        if not data or 'text' not in data or 'voices' not in data:
            return jsonify({"error": "Dados incompletos"}), 400
        
        # Chamar endpoint de mix do Kokoro
        response = requests.post(
            f"{KOKORO_API}/api/tts/mix",
            json=data,
            timeout=KOKORO_TIMEOUT * 2  # Mais tempo para mix
        )
        
        if response.status_code == 200:
            result = response.json()
            
            # Adicionar URL completa
            if 'url' in result:
                result['full_url'] = f"{KOKORO_API}{result['url']}"
            
            return jsonify(result)
        else:
            return jsonify({"error": "Erro na mistura"}), response.status_code
            
    except Exception as e:
        logger.error(f"Erro na mistura: {e}")
        return jsonify({"error": str(e)}), 500

@kokoro_voice_bp.route('/api/voice/config', methods=['GET'])
def get_voice_config():
    """Obter configuração salva"""
    try:
        response = requests.get(
            f"{KOKORO_API}/api/voice/config",
            timeout=KOKORO_TIMEOUT
        )
        
        if response.status_code == 200:
            return jsonify(response.json())
        else:
            return jsonify({"default": None})
            
    except Exception as e:
        logger.error(f"Erro ao obter config: {e}")
        return jsonify({"default": None, "error": str(e)})

@kokoro_voice_bp.route('/api/voice/config', methods=['POST'])
@kokoro_available
def save_voice_config():
    """Salvar configuração de voz"""
    try:
        data = request.json
        
        response = requests.post(
            f"{KOKORO_API}/api/voice/save",
            json=data,
            timeout=KOKORO_TIMEOUT
        )
        
        if response.status_code == 200:
            return jsonify(response.json())
        else:
            return jsonify({"error": "Erro ao salvar config"}), response.status_code
            
    except Exception as e:
        logger.error(f"Erro ao salvar config: {e}")
        return jsonify({"error": str(e)}), 500

@kokoro_voice_bp.route('/api/voice/audio/<path:filename>', methods=['GET'])
@kokoro_available
def get_audio_file(filename):
    """Proxy para arquivos de áudio do Kokoro"""
    try:
        # Buscar arquivo do Kokoro
        response = requests.get(
            f"{KOKORO_API}/api/audio/{filename}",
            stream=True,
            timeout=KOKORO_TIMEOUT
        )
        
        if response.status_code == 200:
            # Retransmitir o arquivo
            return send_file(
                response.raw,
                mimetype=response.headers.get('Content-Type', 'audio/mpeg'),
                as_attachment=False,
                download_name=filename
            )
        else:
            return jsonify({"error": "Arquivo não encontrado"}), 404
            
    except Exception as e:
        logger.error(f"Erro ao buscar áudio: {e}")
        return jsonify({"error": str(e)}), 500

@kokoro_voice_bp.route('/api/voice/cache/clear', methods=['DELETE'])
@kokoro_available
def clear_cache():
    """Limpar cache de áudio"""
    try:
        response = requests.delete(
            f"{KOKORO_API}/api/cache/clear",
            timeout=KOKORO_TIMEOUT
        )
        
        if response.status_code == 200:
            return jsonify(response.json())
        else:
            return jsonify({"error": "Erro ao limpar cache"}), response.status_code
            
    except Exception as e:
        logger.error(f"Erro ao limpar cache: {e}")
        return jsonify({"error": str(e)}), 500

# Rota de fallback para compatibilidade
@kokoro_voice_bp.route('/api/voice/speak', methods=['POST'])
def speak_text():
    """Compatibilidade com sistema antigo"""
    try:
        data = request.json
        text = data.get('text', '')
        
        if not text:
            return jsonify({"error": "Texto vazio"}), 400
        
        # Redirecionar para novo sistema
        return synthesize_speech()
        
    except Exception as e:
        logger.error(f"Erro no speak: {e}")
        return jsonify({"error": str(e)}), 500
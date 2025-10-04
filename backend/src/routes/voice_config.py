"""
Rotas de configuração de voz para o Voice Selector
"""

from flask import Blueprint, request, jsonify
import json
import os
from pathlib import Path
import tempfile
import base64

voice_config_bp = Blueprint('voice_config', __name__)

# Caminho para o arquivo de configuração
CONFIG_DIR = Path(__file__).parent.parent.parent / "config"
CONFIG_FILE = CONFIG_DIR / "voice.json"

# Criar diretório de config se não existir
CONFIG_DIR.mkdir(parents=True, exist_ok=True)

# Configuração padrão
DEFAULT_CONFIG = {
    "voice_id": "jarvis_cloned",
    "settings": {
        "speed": 1.0,
        "pitch": 1.0,
        "energy": 0.9,
        "emotion": "confident"
    },
    "engine": "xtts_v2",
    "language": "pt-BR"
}

def load_voice_config():
    """Carrega a configuração de voz do arquivo"""
    if CONFIG_FILE.exists():
        try:
            with open(CONFIG_FILE, 'r', encoding='utf-8') as f:
                return json.load(f)
        except Exception as e:
            print(f"Erro ao carregar configuração: {e}")
    return DEFAULT_CONFIG.copy()

def save_voice_config(config):
    """Salva a configuração de voz no arquivo"""
    try:
        with open(CONFIG_FILE, 'w', encoding='utf-8') as f:
            json.dump(config, f, indent=2, ensure_ascii=False)
        return True
    except Exception as e:
        print(f"Erro ao salvar configuração: {e}")
        return False

@voice_config_bp.route('/config', methods=['GET'])
def get_voice_config():
    """Retorna a configuração atual de voz"""
    try:
        config = load_voice_config()
        return jsonify({
            'success': True,
            'config': config
        })
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@voice_config_bp.route('/config', methods=['POST'])
def set_voice_config():
    """Define a configuração de voz"""
    try:
        data = request.get_json()
        
        # Validar dados recebidos
        if not data or 'voice_id' not in data:
            return jsonify({
                'success': False,
                'error': 'voice_id é obrigatório'
            }), 400
        
        # Criar nova configuração
        new_config = {
            'voice_id': data['voice_id'],
            'settings': data.get('settings', DEFAULT_CONFIG['settings']),
            'engine': data.get('engine', 'xtts_v2'),
            'language': data.get('language', 'pt-BR')
        }
        
        # Salvar configuração
        if save_voice_config(new_config):
            # Recarregar voice engine com nova configuração se disponível
            try:
                from src.services.voice_engine import voice_engine
                if voice_engine:
                    voice_engine.load_voice_config(new_config)
            except:
                pass
            
            return jsonify({
                'success': True,
                'message': 'Configuração salva com sucesso',
                'config': new_config
            })
        else:
            return jsonify({
                'success': False,
                'error': 'Erro ao salvar configuração'
            }), 500
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@voice_config_bp.route('/preview', methods=['POST'])
def preview_voice():
    """Gera preview de áudio com a voz especificada"""
    try:
        from src.services.voice_engine import voice_engine
        
        data = request.get_json()
        voice_id = data.get('voice_id', 'jarvis_cloned')
        text = data.get('text', 'Olá, eu sou a LUA. Como posso ajudar você hoje?')
        settings = data.get('settings', {})
        
        if not voice_engine:
            # Fallback para gTTS se voice_engine não estiver disponível
            try:
                from gtts import gTTS
                import io
                
                tts = gTTS(text=text, lang='pt-br', slow=False)
                audio_buffer = io.BytesIO()
                tts.write_to_fp(audio_buffer)
                audio_buffer.seek(0)
                
                audio_base64 = base64.b64encode(audio_buffer.read()).decode('utf-8')
                
                return jsonify({
                    'success': True,
                    'audio_base64': audio_base64,
                    'engine': 'gtts_fallback'
                })
            except Exception as gtts_error:
                print(f"Erro com gTTS: {gtts_error}")
                return jsonify({
                    'success': False,
                    'error': 'Sistema de voz não disponível'
                }), 503
        
        # Gerar áudio com voice_engine
        audio_file = voice_engine.generate_voice_preview(
            text=text,
            voice_id=voice_id,
            settings=settings
        )
        
        if audio_file and os.path.exists(audio_file):
            with open(audio_file, 'rb') as f:
                audio_data = f.read()
                audio_base64 = base64.b64encode(audio_data).decode('utf-8')
            
            # Limpar arquivo temporário
            try:
                os.remove(audio_file)
            except:
                pass
            
            return jsonify({
                'success': True,
                'audio_base64': audio_base64,
                'voice_id': voice_id
            })
        else:
            return jsonify({
                'success': False,
                'error': 'Erro ao gerar áudio'
            }), 500
            
    except Exception as e:
        print(f"Erro no preview: {e}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@voice_config_bp.route('/upload', methods=['POST'])
def upload_custom_voice():
    """Faz upload de uma voz customizada para cloning"""
    try:
        if 'voice_file' not in request.files:
            return jsonify({
                'success': False,
                'error': 'Nenhum arquivo enviado'
            }), 400
        
        voice_file = request.files['voice_file']
        voice_name = request.form.get('voice_name', 'Custom Voice')
        
        if voice_file.filename == '':
            return jsonify({
                'success': False,
                'error': 'Nome de arquivo inválido'
            }), 400
        
        # Salvar arquivo temporariamente
        voices_dir = Path(__file__).parent.parent.parent / "voices" / "custom"
        voices_dir.mkdir(parents=True, exist_ok=True)
        
        # Gerar ID único para a voz
        import hashlib
        import time
        voice_id = f"custom_{hashlib.md5(f'{voice_name}{time.time()}'.encode()).hexdigest()[:8]}"
        
        # Salvar arquivo de voz
        voice_path = voices_dir / f"{voice_id}.mp3"
        voice_file.save(str(voice_path))
        
        # Adicionar à configuração
        config = load_voice_config()
        if 'custom_voices' not in config:
            config['custom_voices'] = []
        
        config['custom_voices'].append({
            'id': voice_id,
            'name': voice_name,
            'path': str(voice_path),
            'uploaded_at': time.time()
        })
        
        save_voice_config(config)
        
        # Processar voz para cloning se voice_engine disponível
        try:
            from src.services.voice_engine import voice_engine
            if voice_engine:
                voice_engine.add_custom_voice(voice_id, str(voice_path))
        except:
            pass
        
        return jsonify({
            'success': True,
            'voice_id': voice_id,
            'voice_name': voice_name,
            'message': 'Voz customizada carregada com sucesso'
        })
        
    except Exception as e:
        print(f"Erro ao fazer upload de voz: {e}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500
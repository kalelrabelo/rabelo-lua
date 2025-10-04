"""
Sistema de Voice Engine Lite - Versão simplificada com gTTS
Para testes e desenvolvimento sem precisar do Coqui TTS completo
"""

import os
import hashlib
import tempfile
from pathlib import Path
from typing import Optional, Dict, Any
from datetime import datetime, timedelta
import base64

try:
    from gtts import gTTS
    GTTS_AVAILABLE = True
except ImportError:
    print("⚠️ gTTS não instalado. Instalando...")
    os.system("pip install gtts")
    try:
        from gtts import gTTS
        GTTS_AVAILABLE = True
    except:
        GTTS_AVAILABLE = False

try:
    from pydub import AudioSegment
    from pydub.effects import normalize
    PYDUB_AVAILABLE = True
except ImportError:
    print("⚠️ PyDub não instalado")
    PYDUB_AVAILABLE = False

class VoiceEngineLite:
    """Motor simplificado de síntese de voz usando gTTS"""
    
    def __init__(self):
        self.base_dir = Path(__file__).parent.parent.parent
        self.cache_dir = self.base_dir / "cache" / "voice"
        self.cache_dir.mkdir(parents=True, exist_ok=True)
        
        # Cache de áudio
        self.audio_cache = {}
        
        print("✅ Voice Engine Lite inicializado (usando gTTS)")
    
    def generate_speech(self, text: str, emotion: str = None, cache: bool = True) -> Optional[str]:
        """Gera áudio a partir do texto usando gTTS"""
        if not text or not GTTS_AVAILABLE:
            return None
        
        # Gerar hash para cache
        text_hash = hashlib.md5(f"{text}_{emotion}".encode()).hexdigest()
        
        # Verificar cache
        if cache and text_hash in self.audio_cache:
            cached_file = self.audio_cache[text_hash]
            if Path(cached_file).exists():
                print(f"📦 Usando cache: {text[:30]}...")
                return cached_file
        
        try:
            output_path = self.cache_dir / f"lua_speech_{text_hash}.mp3"
            
            # Ajustar texto baseado na emoção
            if emotion == "confident":
                # Adicionar pausas para tom mais confiante
                text = text.replace(". ", "... ")
            elif emotion == "excited":
                # Adicionar ênfase
                text = text.upper()
            
            # Gerar áudio com gTTS
            print(f"🎙️ Gerando fala: {text[:50]}...")
            tts = gTTS(text=text, lang='pt-br', slow=False)
            tts.save(str(output_path))
            
            # Processar áudio se PyDub disponível
            if PYDUB_AVAILABLE and output_path.exists():
                processed_path = self._process_audio(output_path, emotion)
            else:
                processed_path = output_path
            
            # Adicionar ao cache
            if cache:
                self.audio_cache[text_hash] = str(processed_path)
            
            print(f"✅ Áudio gerado: {processed_path.name}")
            return str(processed_path)
            
        except Exception as e:
            print(f"❌ Erro ao gerar fala: {str(e)}")
            return None
    
    def _process_audio(self, audio_path: Path, emotion: str = None) -> Path:
        """Processa áudio com PyDub"""
        if not PYDUB_AVAILABLE:
            return audio_path
        
        try:
            audio = AudioSegment.from_file(str(audio_path))
            
            # Normalizar volume
            audio = normalize(audio)
            
            # Ajustar velocidade baseado na emoção
            if emotion == "confident":
                # Velocidade ligeiramente mais lenta
                audio = audio._spawn(audio.raw_data, overrides={
                    "frame_rate": int(audio.frame_rate * 0.95)
                }).set_frame_rate(audio.frame_rate)
            elif emotion == "excited":
                # Velocidade ligeiramente mais rápida
                audio = audio._spawn(audio.raw_data, overrides={
                    "frame_rate": int(audio.frame_rate * 1.05)
                }).set_frame_rate(audio.frame_rate)
            
            # Salvar processado
            output_path = audio_path.parent / f"{audio_path.stem}_processed.mp3"
            audio.export(str(output_path), format="mp3")
            
            return output_path
            
        except Exception as e:
            print(f"⚠️ Erro ao processar áudio: {str(e)}")
            return audio_path
    
    def get_voice_status(self) -> Dict[str, Any]:
        """Retorna status do sistema de voz"""
        return {
            "engine": "gTTS (Lite)",
            "voice_cloning": False,
            "device": "cpu",
            "cache_size": len(self.audio_cache),
            "voice_style": "default",
            "reference_voice": "Google TTS PT-BR"
        }
    
    def clear_cache(self, older_than_hours: int = 24):
        """Limpa cache antigo"""
        try:
            now = datetime.now()
            cutoff_time = now - timedelta(hours=older_than_hours)
            
            for audio_file in self.cache_dir.glob("*.mp3"):
                if datetime.fromtimestamp(audio_file.stat().st_mtime) < cutoff_time:
                    audio_file.unlink()
                    print(f"🗑️ Cache removido: {audio_file.name}")
            
            self.audio_cache.clear()
                
        except Exception as e:
            print(f"⚠️ Erro ao limpar cache: {str(e)}")

# Usar versão Lite por padrão (mais leve)
voice_engine = VoiceEngineLite()

def generate_lua_voice(text: str, emotion: str = "confident") -> Optional[str]:
    """Interface para gerar voz da LUA"""
    return voice_engine.generate_speech(text, emotion)

def get_engine_status() -> Dict[str, Any]:
    """Retorna status do engine"""
    return voice_engine.get_voice_status()
"""
Sistema de Voice Engine integrado com Kokoro-FastAPI
Substitui o TTS antigo (Coqui/Jarvis) pelo Kokoro moderno
"""

import os
import json
import base64
import tempfile
import hashlib
import logging
from pathlib import Path
from typing import Optional, Dict, List, Union, Tuple
from datetime import datetime, timedelta
import requests
from concurrent.futures import ThreadPoolExecutor
import time

# Configurar logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class KokoroVoiceEngine:
    """
    Motor de voz usando Kokoro-FastAPI
    """
    
    def __init__(self, kokoro_url: str = "http://localhost:9880"):
        """
        Inicializa o motor de voz Kokoro
        
        Args:
            kokoro_url: URL base do servidor Kokoro-FastAPI
        """
        self.kokoro_url = kokoro_url
        self.config_dir = Path(__file__).parent.parent.parent / 'config'
        self.config_dir.mkdir(exist_ok=True)
        self.voice_config_path = self.config_dir / 'voice.json'
        self.cache_dir = Path(__file__).parent.parent.parent / 'cache' / 'voice'
        self.cache_dir.mkdir(parents=True, exist_ok=True)
        
        # Estado do engine
        self.is_ready = False
        self.available_voices = []
        self.current_voice_config = self.load_voice_config()
        
        # Pool de threads para operações assíncronas
        self.executor = ThreadPoolExecutor(max_workers=3)
        
        # Verificar se Kokoro está disponível
        self.check_kokoro_availability()
        
    def check_kokoro_availability(self, max_retries: int = 3) -> bool:
        """
        Verifica se o servidor Kokoro-FastAPI está disponível
        """
        for attempt in range(max_retries):
            try:
                response = requests.get(f"{self.kokoro_url}/api/voices", timeout=5)
                if response.status_code == 200:
                    self.available_voices = response.json().get('voices', [])
                    self.is_ready = True
                    logger.info(f"✅ Kokoro-FastAPI conectado! {len(self.available_voices)} vozes disponíveis")
                    return True
            except requests.exceptions.RequestException as e:
                logger.warning(f"⚠️ Tentativa {attempt+1}/{max_retries} falhou: {e}")
                if attempt < max_retries - 1:
                    time.sleep(2)
        
        logger.error("❌ Kokoro-FastAPI não está disponível")
        self.is_ready = False
        return False
    
    def load_voice_config(self) -> Dict:
        """
        Carrega configuração de voz do arquivo
        """
        default_config = {
            "voice_id": "af_bella",  # Voz padrão do Kokoro
            "voice_mix": None,  # Ex: "af_bella+af_sky:0.6,0.4"
            "settings": {
                "speed": 1.0,
                "pitch": 1.0,
                "energy": 0.9,
                "emotion": "confident"
            },
            "fallback_voice": "af",  # Voz de fallback
            "cache_enabled": True,
            "cache_duration_hours": 24
        }
        
        if self.voice_config_path.exists():
            try:
                with open(self.voice_config_path, 'r', encoding='utf-8') as f:
                    loaded_config = json.load(f)
                    # Mesclar com config padrão para garantir todas as chaves
                    for key, value in default_config.items():
                        if key not in loaded_config:
                            loaded_config[key] = value
                    return loaded_config
            except Exception as e:
                logger.error(f"Erro ao carregar config de voz: {e}")
        
        # Salvar config padrão
        self.save_voice_config(default_config)
        return default_config
    
    def save_voice_config(self, config: Dict) -> bool:
        """
        Salva configuração de voz no arquivo
        """
        try:
            with open(self.voice_config_path, 'w', encoding='utf-8') as f:
                json.dump(config, f, indent=2, ensure_ascii=False)
            self.current_voice_config = config
            logger.info(f"✅ Configuração de voz salva: {config['voice_id']}")
            return True
        except Exception as e:
            logger.error(f"Erro ao salvar config de voz: {e}")
            return False
    
    def get_voice_status(self) -> Dict:
        """
        Retorna status do engine de voz
        """
        return {
            "engine": "Kokoro-FastAPI",
            "status": "Online" if self.is_ready else "Offline",
            "current_voice": self.current_voice_config.get("voice_id", "none"),
            "voice_mix": self.current_voice_config.get("voice_mix"),
            "available_voices": len(self.available_voices),
            "cache_enabled": self.current_voice_config.get("cache_enabled", True),
            "kokoro_url": self.kokoro_url
        }
    
    def list_voices(self) -> List[Dict]:
        """
        Lista todas as vozes disponíveis no Kokoro
        """
        if not self.is_ready:
            self.check_kokoro_availability()
        
        try:
            response = requests.get(f"{self.kokoro_url}/api/voices", timeout=5)
            if response.status_code == 200:
                data = response.json()
                voices = data.get('voices', [])
                
                # Formatar vozes para o frontend
                formatted_voices = []
                for voice in voices:
                    formatted_voices.append({
                        'id': voice,
                        'name': self._format_voice_name(voice),
                        'description': self._get_voice_description(voice),
                        'language': 'multi',  # Kokoro suporta múltiplos idiomas
                        'engine': 'kokoro',
                        'selected': voice == self.current_voice_config.get('voice_id')
                    })
                
                return formatted_voices
        except Exception as e:
            logger.error(f"Erro ao listar vozes: {e}")
            return []
    
    def _format_voice_name(self, voice_id: str) -> str:
        """
        Formata nome da voz para exibição
        """
        # Mapa de nomes amigáveis
        voice_names = {
            'af_bella': 'Bella (Feminina)',
            'af_sarah': 'Sarah (Feminina)',
            'af_nicole': 'Nicole (Feminina)',
            'af_sky': 'Sky (Feminina Jovem)',
            'af': 'Feminina Padrão',
            'am_adam': 'Adam (Masculino)',
            'am_michael': 'Michael (Masculino)',
            'am': 'Masculino Padrão',
            'bf_emma': 'Emma (Britânica)',
            'bf_isabella': 'Isabella (Britânica)',
            'bf': 'Britânica Feminina',
            'bm_george': 'George (Britânico)',
            'bm_lewis': 'Lewis (Britânico)',
            'bm': 'Britânico Masculino'
        }
        
        return voice_names.get(voice_id, voice_id.replace('_', ' ').title())
    
    def _get_voice_description(self, voice_id: str) -> str:
        """
        Retorna descrição da voz
        """
        descriptions = {
            'af_bella': 'Voz feminina suave e profissional',
            'af_sarah': 'Voz feminina clara e articulada',
            'af_nicole': 'Voz feminina jovem e energética',
            'af_sky': 'Voz feminina jovem e amigável',
            'af': 'Voz feminina americana padrão',
            'am_adam': 'Voz masculina profunda e confiante',
            'am_michael': 'Voz masculina clara e profissional',
            'am': 'Voz masculina americana padrão',
            'bf_emma': 'Voz feminina com sotaque britânico elegante',
            'bf_isabella': 'Voz feminina britânica sofisticada',
            'bf': 'Voz feminina britânica padrão',
            'bm_george': 'Voz masculina britânica autoritária',
            'bm_lewis': 'Voz masculina britânica jovem',
            'bm': 'Voz masculina britânica padrão'
        }
        
        return descriptions.get(voice_id, 'Voz neural de alta qualidade')
    
    def generate_speech(
        self,
        text: str,
        voice_id: Optional[str] = None,
        voice_mix: Optional[str] = None,
        speed: float = 1.0,
        use_cache: bool = True
    ) -> Optional[str]:
        """
        Gera fala usando Kokoro-FastAPI
        
        Args:
            text: Texto para converter em fala
            voice_id: ID da voz (sobrescreve config padrão)
            voice_mix: String de mix de vozes (ex: "af_bella+af_sky:0.6,0.4")
            speed: Velocidade da fala
            use_cache: Se deve usar cache
            
        Returns:
            Caminho do arquivo de áudio gerado ou None se falhar
        """
        if not self.is_ready:
            if not self.check_kokoro_availability():
                logger.error("Kokoro-FastAPI não disponível")
                return None
        
        # Usar voz configurada se não especificada
        if not voice_id and not voice_mix:
            voice_id = self.current_voice_config.get('voice_id')
            voice_mix = self.current_voice_config.get('voice_mix')
        
        # Verificar cache se habilitado
        if use_cache and self.current_voice_config.get('cache_enabled'):
            cache_key = self._generate_cache_key(text, voice_id or voice_mix, speed)
            cached_file = self._get_cached_audio(cache_key)
            if cached_file:
                logger.info(f"✅ Usando áudio do cache: {cache_key}")
                return cached_file
        
        try:
            # Preparar payload para Kokoro
            endpoint = f"{self.kokoro_url}/api/{'mix' if voice_mix else 'tts'}"
            
            if voice_mix:
                # Parse do formato de mix: "af_bella+af_sky:0.6,0.4"
                voices, weights = self._parse_voice_mix(voice_mix)
                payload = {
                    "text": text,
                    "voices": voices,
                    "weights": weights,
                    "speed": speed
                }
            else:
                payload = {
                    "text": text,
                    "voice": voice_id or "af_bella",
                    "speed": speed
                }
            
            # Fazer requisição ao Kokoro
            logger.info(f"🎵 Gerando áudio com Kokoro: {voice_id or voice_mix}")
            response = requests.post(endpoint, json=payload, timeout=30)
            
            if response.status_code == 200:
                # Salvar áudio retornado
                audio_data = response.content
                
                # Criar arquivo temporário
                with tempfile.NamedTemporaryFile(suffix='.wav', delete=False) as tmp_file:
                    tmp_file.write(audio_data)
                    audio_path = tmp_file.name
                
                # Salvar no cache se habilitado
                if use_cache and self.current_voice_config.get('cache_enabled'):
                    self._save_to_cache(cache_key, audio_path)
                
                logger.info(f"✅ Áudio gerado com sucesso: {audio_path}")
                return audio_path
            else:
                logger.error(f"Erro na geração de áudio: {response.status_code} - {response.text}")
                return None
                
        except Exception as e:
            logger.error(f"Erro ao gerar fala com Kokoro: {e}")
            return None
    
    def _parse_voice_mix(self, voice_mix: str) -> Tuple[List[str], List[float]]:
        """
        Parse da string de mix de vozes
        Ex: "af_bella+af_sky:0.6,0.4" -> (["af_bella", "af_sky"], [0.6, 0.4])
        """
        try:
            parts = voice_mix.split(':')
            voices = parts[0].split('+')
            
            if len(parts) > 1:
                weights = [float(w) for w in parts[1].split(',')]
            else:
                # Pesos iguais se não especificados
                weights = [1.0 / len(voices)] * len(voices)
            
            # Normalizar pesos
            total_weight = sum(weights)
            if total_weight > 0:
                weights = [w / total_weight for w in weights]
            
            return voices, weights
        except Exception as e:
            logger.error(f"Erro ao fazer parse de voice_mix: {e}")
            return ["af_bella"], [1.0]
    
    def _generate_cache_key(self, text: str, voice: str, speed: float) -> str:
        """
        Gera chave única para cache
        """
        content = f"{text}_{voice}_{speed}"
        return hashlib.md5(content.encode()).hexdigest()
    
    def _get_cached_audio(self, cache_key: str) -> Optional[str]:
        """
        Busca áudio no cache
        """
        cache_file = self.cache_dir / f"{cache_key}.wav"
        
        if cache_file.exists():
            # Verificar idade do cache
            cache_age = datetime.now() - datetime.fromtimestamp(cache_file.stat().st_mtime)
            max_age = timedelta(hours=self.current_voice_config.get('cache_duration_hours', 24))
            
            if cache_age < max_age:
                return str(cache_file)
            else:
                # Cache expirado
                cache_file.unlink()
        
        return None
    
    def _save_to_cache(self, cache_key: str, audio_path: str):
        """
        Salva áudio no cache
        """
        try:
            import shutil
            cache_file = self.cache_dir / f"{cache_key}.wav"
            shutil.copy2(audio_path, cache_file)
            logger.info(f"✅ Áudio salvo no cache: {cache_key}")
        except Exception as e:
            logger.error(f"Erro ao salvar no cache: {e}")
    
    def clear_cache(self, hours: int = 24):
        """
        Limpa cache antigo
        """
        try:
            cutoff_time = datetime.now() - timedelta(hours=hours)
            cleared = 0
            
            for cache_file in self.cache_dir.glob("*.wav"):
                file_time = datetime.fromtimestamp(cache_file.stat().st_mtime)
                if file_time < cutoff_time:
                    cache_file.unlink()
                    cleared += 1
            
            logger.info(f"✅ {cleared} arquivos removidos do cache")
            return cleared
        except Exception as e:
            logger.error(f"Erro ao limpar cache: {e}")
            return 0
    
    def test_voice(self, voice_id: str, text: str = "Teste de voz") -> Optional[str]:
        """
        Testa uma voz específica
        """
        return self.generate_speech(text, voice_id=voice_id, use_cache=False)
    
    def mix_voices(self, voices: List[str], weights: List[float], text: str) -> Optional[str]:
        """
        Mistura múltiplas vozes com pesos específicos
        """
        voice_mix = f"{'+'.join(voices)}:{','.join(map(str, weights))}"
        return self.generate_speech(text, voice_mix=voice_mix, use_cache=False)
    
    def update_voice_config(
        self,
        voice_id: Optional[str] = None,
        voice_mix: Optional[str] = None,
        speed: Optional[float] = None,
        pitch: Optional[float] = None
    ) -> bool:
        """
        Atualiza configuração de voz
        """
        if voice_id:
            self.current_voice_config['voice_id'] = voice_id
            self.current_voice_config['voice_mix'] = None
        
        if voice_mix:
            self.current_voice_config['voice_mix'] = voice_mix
            self.current_voice_config['voice_id'] = None
        
        if speed is not None:
            self.current_voice_config['settings']['speed'] = speed
        
        if pitch is not None:
            self.current_voice_config['settings']['pitch'] = pitch
        
        return self.save_voice_config(self.current_voice_config)
    
    def shutdown(self):
        """
        Desliga o engine de voz
        """
        try:
            self.executor.shutdown(wait=True, timeout=5)
            logger.info("✅ KokoroVoiceEngine desligado")
        except Exception as e:
            logger.error(f"Erro ao desligar engine: {e}")

# Singleton do engine
_kokoro_engine = None

def get_kokoro_engine() -> KokoroVoiceEngine:
    """
    Retorna instância singleton do KokoroVoiceEngine
    """
    global _kokoro_engine
    if _kokoro_engine is None:
        _kokoro_engine = KokoroVoiceEngine()
    return _kokoro_engine

def generate_lua_voice(text: str, emotion: str = "confident") -> Optional[str]:
    """
    Função de compatibilidade para gerar voz da LUA
    """
    engine = get_kokoro_engine()
    return engine.generate_speech(text)

# Exportar engine para compatibilidade
voice_engine = get_kokoro_engine()
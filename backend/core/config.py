"""
Configuration settings for Lua TTS System
"""
import os
from pathlib import Path
from pydantic_settings import BaseSettings
from typing import List, Optional


class Settings(BaseSettings):
    """Application settings"""
    
    # API Settings
    api_title: str = "Lua TTS System"
    api_description: str = "Sistema de Text-to-Speech com Kokoro-82M em PT-BR"
    api_version: str = "1.0.0"
    host: str = "0.0.0.0"
    port: int = 8000
    
    # CORS Settings
    cors_enabled: bool = True
    cors_origins: List[str] = ["*"]
    
    # Model Settings
    model_name: str = "kokoro-82m"
    device: str = "cpu"  # cpu, cuda, mps
    use_gpu: bool = False
    
    # Voice Settings
    default_voice: str = "pt-BR-f1"
    default_voice_code: str = "p"  # 'p' for Portuguese
    voice_speed: float = 1.0
    
    # Paths
    base_dir: Path = Path(__file__).parent.parent
    models_dir: Path = base_dir / "models"
    voices_dir: Path = base_dir / "voices"
    temp_dir: Path = base_dir / "temp"
    
    # Audio Settings
    sample_rate: int = 24000
    audio_format: str = "wav"
    
    # Logging
    log_level: str = "INFO"
    
    # Features
    enable_web_player: bool = True
    enable_voice_mixing: bool = True
    enable_streaming: bool = True
    
    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"
        case_sensitive = False

# Create global settings instance
settings = Settings()

# Create necessary directories
settings.models_dir.mkdir(parents=True, exist_ok=True)
settings.voices_dir.mkdir(parents=True, exist_ok=True)
settings.temp_dir.mkdir(parents=True, exist_ok=True)
"""
Kokoro TTS Engine for Portuguese (PT-BR)
Based on Kokoro-82M model
"""
import os
import tempfile
from typing import Optional, AsyncGenerator, Dict, Union, List, Tuple
from pathlib import Path

import numpy as np
import torch
import soundfile as sf
from kokoro import KModel, KPipeline

from backend.core.logger import logger
from backend.core.config import settings


class KokoroEngine:
    """Kokoro TTS Engine with PT-BR support"""
    
    # Portuguese voices mapping
    PTBR_VOICES = {
        "pt-BR-f1": "af_bella",  # Female voice 1
        "pt-BR-f2": "af_sarah",  # Female voice 2
        "pt-BR-f3": "af_nova",   # Female voice 3
        "pt-BR-m1": "am_michael", # Male voice 1
        "pt-BR-m2": "am_fenrir",  # Male voice 2
        "luna": "af_heart",      # Luna's default voice
    }
    
    def __init__(self):
        """Initialize Kokoro engine"""
        self.device = self._get_device()
        self.model: Optional[KModel] = None
        self.pipelines: Dict[str, KPipeline] = {}
        self.is_initialized = False
        
    def _get_device(self) -> str:
        """Determine the best available device"""
        if settings.use_gpu:
            if torch.cuda.is_available():
                logger.info("Using CUDA device")
                return "cuda"
            elif torch.backends.mps.is_available():
                logger.info("Using MPS device (Apple Silicon)")
                return "mps"
        logger.info("Using CPU device")
        return "cpu"
        
    async def initialize(self) -> bool:
        """Initialize the Kokoro model and pipelines"""
        try:
            logger.info("Initializing Kokoro TTS Engine...")
            
            # Initialize model
            self.model = KModel()
            
            # Move to appropriate device
            if self.device == "cuda":
                self.model = self.model.cuda()
            elif self.device == "mps":
                self.model = self.model.to(torch.device("mps"))
            else:
                self.model = self.model.cpu()
                
            self.model.eval()
            
            # Create pipeline for Portuguese
            self._create_pipeline("p")  # 'p' for Portuguese
            
            # Warm up the model
            await self._warmup()
            
            self.is_initialized = True
            logger.info("✅ Kokoro TTS Engine initialized successfully")
            return True
            
        except Exception as e:
            logger.error(f"Failed to initialize Kokoro engine: {e}")
            return False
            
    def _create_pipeline(self, lang_code: str) -> KPipeline:
        """Create or get pipeline for language code"""
        if lang_code not in self.pipelines:
            logger.info(f"Creating pipeline for language: {lang_code}")
            self.pipelines[lang_code] = KPipeline(
                lang_code=lang_code,
                model=self.model,
                device=self.device
            )
            
            # Try to add custom pronunciations for Portuguese if supported
            if lang_code == "p":
                try:
                    # Check if g2p has lexicon attribute
                    if hasattr(self.pipelines[lang_code], 'g2p') and hasattr(self.pipelines[lang_code].g2p, 'lexicon'):
                        lexicon = self.pipelines[lang_code].g2p.lexicon
                        if hasattr(lexicon, 'golds'):
                            lexicon.golds['lua'] = 'lˈuɐ'
                            lexicon.golds['olá'] = 'ɔlˈa'
                            lexicon.golds['kokoro'] = 'kɔkˈɔɾu'
                            logger.info("Custom pronunciations added successfully")
                    else:
                        logger.warning("G2P lexicon not available in current Kokoro version")
                except Exception as e:
                    logger.warning(f"Could not add custom pronunciations: {e}")
                
        return self.pipelines[lang_code]
        
    async def _warmup(self):
        """Warm up the model with a test generation"""
        try:
            logger.info("Warming up Kokoro model...")
            pipeline = self.pipelines.get("p")
            if pipeline:
                test_text = "Olá, eu sou a Lua."
                voice = self.PTBR_VOICES["luna"]
                
                # Generate small test audio
                for result in pipeline(test_text, voice=voice, speed=1.0):
                    if result.audio is not None:
                        logger.info("✅ Model warmup successful")
                        break
        except Exception as e:
            logger.warning(f"Warmup failed (non-critical): {e}")
            
    async def generate_speech(
        self,
        text: str,
        voice: str = "luna",
        speed: float = 1.0,
        lang_code: str = "p"
    ) -> AsyncGenerator[bytes, None]:
        """
        Generate speech from text
        
        Args:
            text: Text to synthesize
            voice: Voice identifier
            speed: Speech speed (0.5 to 2.0)
            lang_code: Language code ('p' for Portuguese)
            
        Yields:
            Audio chunks in bytes
        """
        if not self.is_initialized:
            raise RuntimeError("Engine not initialized")
            
        try:
            # Map voice to Kokoro voice
            kokoro_voice = self.PTBR_VOICES.get(voice, voice)
            
            # Get or create pipeline
            pipeline = self._create_pipeline(lang_code)
            
            # Generate audio
            logger.info(f"Generating speech: '{text[:50]}...' with voice '{voice}'")
            
            for result in pipeline(text, voice=kokoro_voice, speed=speed):
                if result.audio is not None:
                    audio_numpy = result.audio.numpy()
                    
                    # Convert to bytes
                    with tempfile.NamedTemporaryFile(suffix=".wav", delete=False) as tmp:
                        sf.write(tmp.name, audio_numpy, settings.sample_rate)
                        tmp.seek(0)
                        audio_bytes = open(tmp.name, 'rb').read()
                        os.unlink(tmp.name)
                        
                    yield audio_bytes
                    
        except Exception as e:
            logger.error(f"Speech generation failed: {e}")
            raise
            
    async def mix_voices(
        self,
        text: str,
        voices: List[str],
        weights: Optional[List[float]] = None,
        speed: float = 1.0
    ) -> AsyncGenerator[bytes, None]:
        """
        Generate speech with mixed voices
        
        Args:
            text: Text to synthesize
            voices: List of voice identifiers
            weights: Voice mixing weights (sum to 1.0)
            speed: Speech speed
            
        Yields:
            Mixed audio chunks
        """
        if not self.is_initialized:
            raise RuntimeError("Engine not initialized")
            
        if not voices:
            raise ValueError("At least one voice required")
            
        # Default equal weights
        if weights is None:
            weights = [1.0 / len(voices)] * len(voices)
            
        # Normalize weights
        total = sum(weights)
        weights = [w / total for w in weights]
        
        try:
            pipeline = self._create_pipeline("p")
            
            # Generate audio for each voice
            audios = []
            for voice, weight in zip(voices, weights):
                kokoro_voice = self.PTBR_VOICES.get(voice, voice)
                
                for result in pipeline(text, voice=kokoro_voice, speed=speed):
                    if result.audio is not None:
                        audio_numpy = result.audio.numpy() * weight
                        audios.append(audio_numpy)
                        break
                        
            # Mix audios
            if audios:
                # Pad to same length
                max_len = max(len(a) for a in audios)
                padded = [np.pad(a, (0, max_len - len(a))) for a in audios]
                
                # Sum weighted audios
                mixed = np.sum(padded, axis=0)
                
                # Normalize
                mixed = mixed / np.max(np.abs(mixed))
                
                # Convert to bytes
                with tempfile.NamedTemporaryFile(suffix=".wav", delete=False) as tmp:
                    sf.write(tmp.name, mixed, settings.sample_rate)
                    tmp.seek(0)
                    audio_bytes = open(tmp.name, 'rb').read()
                    os.unlink(tmp.name)
                    
                yield audio_bytes
                
        except Exception as e:
            logger.error(f"Voice mixing failed: {e}")
            raise
            
    def get_available_voices(self) -> Dict[str, str]:
        """Get list of available voices"""
        return {
            voice_id: f"Portuguese {desc}"
            for voice_id, desc in [
                ("pt-BR-f1", "Female 1"),
                ("pt-BR-f2", "Female 2"),
                ("pt-BR-f3", "Female 3"),
                ("pt-BR-m1", "Male 1"),
                ("pt-BR-m2", "Male 2"),
                ("luna", "Luna (Assistant)"),
            ]
        }
        
    async def cleanup(self):
        """Clean up resources"""
        try:
            if self.model:
                del self.model
                self.model = None
                
            for pipeline in self.pipelines.values():
                del pipeline
            self.pipelines.clear()
            
            # Clear GPU cache if available
            if self.device == "cuda" and torch.cuda.is_available():
                torch.cuda.empty_cache()
                torch.cuda.synchronize()
            elif self.device == "mps" and hasattr(torch.mps, "empty_cache"):
                torch.mps.empty_cache()
                
            self.is_initialized = False
            logger.info("Kokoro engine cleaned up")
            
        except Exception as e:
            logger.error(f"Cleanup failed: {e}")
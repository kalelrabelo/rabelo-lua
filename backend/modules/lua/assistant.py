"""
Lua AI Assistant Core Module
"""
import asyncio
from typing import Optional, Dict, Any, List, AsyncGenerator
from datetime import datetime
import json

from backend.core.logger import logger
from backend.modules.tts.kokoro_engine import KokoroEngine
from .personality import LuaPersonality


class LuaAssistant:
    """Main Lua Assistant class"""
    
    def __init__(self):
        """Initialize Lua Assistant"""
        self.personality = LuaPersonality()
        self.tts_engine = KokoroEngine()
        self.conversation_history: List[Dict[str, Any]] = []
        self.is_initialized = False
        self.session_id: Optional[str] = None
        
    async def initialize(self) -> bool:
        """Initialize all components"""
        try:
            logger.info("Initializing Lua Assistant...")
            
            # Initialize TTS engine
            if not await self.tts_engine.initialize():
                logger.error("Failed to initialize TTS engine")
                return False
                
            # Generate session ID
            self.session_id = f"lua_{datetime.now().strftime('%Y%m%d_%H%M%S')}"
            
            self.is_initialized = True
            logger.info(f"✅ Lua Assistant initialized (Session: {self.session_id})")
            return True
            
        except Exception as e:
            logger.error(f"Failed to initialize Lua: {e}")
            return False
            
    async def process_message(
        self,
        message: str,
        user_id: Optional[str] = None,
        context: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """
        Process user message and generate response
        
        Args:
            message: User's message
            user_id: Optional user identifier
            context: Optional context data
            
        Returns:
            Response dictionary with text and metadata
        """
        if not self.is_initialized:
            await self.initialize()
            
        try:
            # Log conversation
            self.conversation_history.append({
                "timestamp": datetime.now().isoformat(),
                "user_id": user_id,
                "role": "user",
                "message": message
            })
            
            # Generate response (placeholder for LLM integration)
            response_text = await self._generate_response(message, context)
            
            # Log response
            self.conversation_history.append({
                "timestamp": datetime.now().isoformat(),
                "role": "assistant",
                "message": response_text
            })
            
            return {
                "success": True,
                "response": response_text,
                "session_id": self.session_id,
                "timestamp": datetime.now().isoformat(),
                "metadata": {
                    "personality": self.personality.name,
                    "language": self.personality.language,
                    "voice": self.personality.voice
                }
            }
            
        except Exception as e:
            logger.error(f"Failed to process message: {e}")
            return {
                "success": False,
                "error": str(e),
                "response": self.personality.get_response("error")
            }
            
    async def _generate_response(
        self,
        message: str,
        context: Optional[Dict[str, Any]] = None
    ) -> str:
        """
        Generate response based on message
        This is a placeholder for LLM integration
        """
        # Simple rule-based responses for now
        message_lower = message.lower().strip()
        
        # Greetings
        if any(word in message_lower for word in ["olá", "oi", "bom dia", "boa tarde", "boa noite"]):
            return self.personality.get_greeting()
            
        # Farewells
        elif any(word in message_lower for word in ["tchau", "até logo", "adeus", "até mais"]):
            return self.personality.get_response("farewell")
            
        # Thanks
        elif any(word in message_lower for word in ["obrigado", "obrigada", "valeu", "thanks"]):
            return self.personality.get_response("thanks")
            
        # About Lua
        elif "quem é você" in message_lower or "seu nome" in message_lower:
            return "Eu sou a Lua! 🌙 Sou sua assistente virtual, criada para ajudar você com diversas tarefas. Posso conversar, responder perguntas e até mesmo falar com você usando minha voz!"
            
        # Capabilities
        elif "o que você pode fazer" in message_lower or "suas capacidades" in message_lower:
            return "Posso fazer muitas coisas! 🎯 Conversar com você, responder perguntas, gerar áudio com diferentes vozes, e muito mais. Estou sempre aprendendo coisas novas!"
            
        # Voice
        elif "sua voz" in message_lower or "falar" in message_lower:
            return "Sim! Eu posso falar com você usando minha voz. Uso a tecnologia Kokoro para gerar fala natural em português brasileiro. Quer me ouvir falando?"
            
        # Default response
        else:
            return f"Entendi sua mensagem: '{message}'. Ainda estou aprendendo, mas farei o meu melhor para ajudar! Como posso ser útil?"
            
    async def speak(
        self,
        text: str,
        voice: Optional[str] = None,
        speed: float = 1.0
    ) -> AsyncGenerator[bytes, None]:
        """
        Generate speech from text
        
        Args:
            text: Text to speak
            voice: Optional voice override
            speed: Speech speed
            
        Yields:
            Audio chunks
        """
        if not self.is_initialized:
            await self.initialize()
            
        voice = voice or self.personality.voice
        
        async for audio_chunk in self.tts_engine.generate_speech(
            text=text,
            voice=voice,
            speed=speed
        ):
            yield audio_chunk
            
    async def speak_response(
        self,
        message: str,
        user_id: Optional[str] = None,
        voice: Optional[str] = None,
        speed: float = 1.0
    ) -> AsyncGenerator[bytes, None]:
        """
        Process message and speak the response
        
        Args:
            message: User's message
            user_id: User identifier
            voice: Voice to use
            speed: Speech speed
            
        Yields:
            Audio chunks of the response
        """
        # Process message to get response
        result = await self.process_message(message, user_id)
        
        if result["success"]:
            # Speak the response
            async for audio_chunk in self.speak(
                result["response"],
                voice=voice,
                speed=speed
            ):
                yield audio_chunk
                
    def get_conversation_history(self) -> List[Dict[str, Any]]:
        """Get conversation history"""
        return self.conversation_history
        
    def clear_conversation(self):
        """Clear conversation history"""
        self.conversation_history.clear()
        logger.info("Conversation history cleared")
        
    async def cleanup(self):
        """Clean up resources"""
        try:
            await self.tts_engine.cleanup()
            self.conversation_history.clear()
            self.is_initialized = False
            logger.info("Lua Assistant cleaned up")
        except Exception as e:
            logger.error(f"Cleanup failed: {e}")
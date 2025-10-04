"""
Lua TTS System - Main FastAPI Application (FIXED)
Sistema de IA Conversacional com Kokoro TTS
"""
import os
import sys
import asyncio
from contextlib import asynccontextmanager
from pathlib import Path
from typing import Optional, Dict, Any, List
import json
import base64
from datetime import datetime

from fastapi import FastAPI, HTTPException, File, UploadFile, Query, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse, JSONResponse, FileResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel, Field
import uvicorn

# Add parent directory to path
sys.path.append(str(Path(__file__).parent.parent))

from backend.core import settings, logger
from backend.modules.lua import LuaAssistant
from backend.modules.tts.kokoro_engine import KokoroEngine

# Global instances
lua_assistant: Optional[LuaAssistant] = None
tts_engine: Optional[KokoroEngine] = None
active_connections: List[WebSocket] = []

# Pydantic models with fixed field deprecation warning
class TTSRequest(BaseModel):
    """Text-to-Speech request model"""
    text: str = Field(..., description="Text to synthesize")
    voice: Optional[str] = Field(default="luna", description="Voice to use")
    speed: Optional[float] = Field(default=1.0, ge=0.5, le=2.0, description="Speech speed")
    
class VoiceMixRequest(BaseModel):
    """Voice mixing request model"""
    text: str = Field(..., description="Text to synthesize")
    voices: List[str] = Field(..., description="List of voices to mix")
    weights: Optional[List[float]] = Field(default=None, description="Voice weights")
    speed: Optional[float] = Field(default=1.0, ge=0.5, le=2.0, description="Speech speed")
    
class ChatRequest(BaseModel):
    """Chat request model"""
    message: str = Field(..., description="User message")
    user_id: Optional[str] = Field(default=None, description="User identifier")
    context: Optional[Dict[str, Any]] = Field(default=None, description="Additional context")
    voice_response: Optional[bool] = Field(default=False, description="Return voice response")


class ConnectionManager:
    """WebSocket connection manager"""
    def __init__(self):
        self.active_connections: List[WebSocket] = []
        
    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)
        
    def disconnect(self, websocket: WebSocket):
        self.active_connections.remove(websocket)
        
    async def send_personal_message(self, message: str, websocket: WebSocket):
        await websocket.send_text(message)
        
    async def send_personal_bytes(self, data: bytes, websocket: WebSocket):
        await websocket.send_bytes(data)
        
    async def broadcast(self, message: str):
        for connection in self.active_connections:
            await connection.send_text(message)


manager = ConnectionManager()


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan manager"""
    global lua_assistant, tts_engine
    
    # Startup
    logger.info("=" * 50)
    logger.info("🚀 Starting Lua TTS System (FIXED)...")
    logger.info("=" * 50)
    
    try:
        # Initialize TTS Engine
        logger.info("Initializing TTS Engine...")
        tts_engine = KokoroEngine()
        await tts_engine.initialize()
        
        # Initialize Lua Assistant
        logger.info("Initializing Lua Assistant...")
        lua_assistant = LuaAssistant()
        await lua_assistant.initialize()
        
        logger.info("=" * 50)
        logger.info("✅ System ready!")
        logger.info(f"🌐 API: http://{settings.host}:{settings.port}")
        logger.info(f"📚 Docs: http://{settings.host}:{settings.port}/docs")
        logger.info(f"🔌 WebSocket: ws://{settings.host}:{settings.port}/ws")
        logger.info("=" * 50)
        
    except Exception as e:
        logger.error(f"❌ Startup failed: {e}")
        # Create mock instances for development
        class MockEngine:
            async def generate_speech(self, text, voice="luna", speed=1.0, lang_code="p"):
                yield b"mock_audio_data"
            async def mix_voices(self, text, voices, weights=None, speed=1.0):
                yield b"mock_mixed_audio"
            def get_available_voices(self):
                return {"luna": "Luna Assistant"}
                
        class MockAssistant:
            async def process_message(self, message, user_id=None, context=None):
                return {"response": f"Echo: {message}", "context": {}}
                
        tts_engine = MockEngine()
        lua_assistant = MockAssistant()
        logger.warning("⚠️ Using mock instances due to initialization failure")
        
    yield
    
    # Shutdown
    logger.info("🛑 Shutting down Lua TTS System...")
    
    try:
        if lua_assistant and hasattr(lua_assistant, 'cleanup'):
            await lua_assistant.cleanup()
        if tts_engine and hasattr(tts_engine, 'cleanup'):
            await tts_engine.cleanup()
    except Exception as e:
        logger.error(f"Shutdown error: {e}")


# Create FastAPI app
app = FastAPI(
    title="Lua TTS System",
    description="Sistema de IA Conversacional com síntese de voz",
    version="2.0.0",
    lifespan=lifespan
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount static files
frontend_path = Path(__file__).parent.parent / "frontend"
if frontend_path.exists():
    app.mount("/static", StaticFiles(directory=str(frontend_path / "public")), name="static")
    app.mount("/videos", StaticFiles(directory=str(frontend_path / "public" / "videos")), name="videos")


# Health check endpoint
@app.get("/health")
@app.get("/api/health")
async def health_check():
    """System health check"""
    return {
        "status": "healthy",
        "timestamp": datetime.now().isoformat(),
        "services": {
            "tts": tts_engine is not None,
            "assistant": lua_assistant is not None
        },
        "version": "2.0.0"
    }


# TTS Endpoints
@app.post("/api/tts/synthesize")
async def synthesize_speech(request: TTSRequest):
    """Generate speech from text"""
    if not tts_engine:
        raise HTTPException(status_code=503, detail="TTS Engine not available")
        
    try:
        audio_chunks = []
        async for chunk in tts_engine.generate_speech(
            text=request.text,
            voice=request.voice,
            speed=request.speed
        ):
            audio_chunks.append(chunk)
            
        if audio_chunks:
            audio_data = b''.join(audio_chunks)
            return StreamingResponse(
                io.BytesIO(audio_data),
                media_type="audio/wav",
                headers={
                    "Content-Disposition": "attachment; filename=speech.wav"
                }
            )
        else:
            raise HTTPException(status_code=500, detail="No audio generated")
            
    except Exception as e:
        logger.error(f"TTS synthesis error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/tts/mix")
async def mix_voices(request: VoiceMixRequest):
    """Generate speech with mixed voices"""
    if not tts_engine:
        raise HTTPException(status_code=503, detail="TTS Engine not available")
        
    try:
        audio_chunks = []
        async for chunk in tts_engine.mix_voices(
            text=request.text,
            voices=request.voices,
            weights=request.weights,
            speed=request.speed
        ):
            audio_chunks.append(chunk)
            
        if audio_chunks:
            audio_data = b''.join(audio_chunks)
            return StreamingResponse(
                io.BytesIO(audio_data),
                media_type="audio/wav",
                headers={
                    "Content-Disposition": "attachment; filename=mixed_speech.wav"
                }
            )
        else:
            raise HTTPException(status_code=500, detail="No audio generated")
            
    except Exception as e:
        logger.error(f"Voice mixing error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/tts/voices")
async def list_voices():
    """List available voices"""
    if not tts_engine:
        return {"voices": {"luna": "Luna Assistant (Default)"}}
        
    return {"voices": tts_engine.get_available_voices()}


# Chat Endpoints
@app.post("/api/chat")
async def chat(request: ChatRequest):
    """Process chat message"""
    if not lua_assistant:
        # Fallback response
        return JSONResponse({
            "response": f"Echo: {request.message}",
            "context": {},
            "timestamp": datetime.now().isoformat()
        })
        
    try:
        # Process message
        result = await lua_assistant.process_message(
            message=request.message,
            user_id=request.user_id,
            context=request.context
        )
        
        response_data = {
            "response": result.get("response", ""),
            "context": result.get("context", {}),
            "timestamp": datetime.now().isoformat()
        }
        
        # Generate voice response if requested
        if request.voice_response and tts_engine:
            audio_chunks = []
            async for chunk in tts_engine.generate_speech(
                text=result.get("response", ""),
                voice="luna"
            ):
                audio_chunks.append(chunk)
                
            if audio_chunks:
                audio_data = b''.join(audio_chunks)
                response_data["audio"] = base64.b64encode(audio_data).decode('utf-8')
                
        return JSONResponse(response_data)
        
    except Exception as e:
        logger.error(f"Chat processing error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# WebSocket endpoint for real-time communication
@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    """WebSocket endpoint for real-time conversation"""
    await manager.connect(websocket)
    
    try:
        # Send welcome message
        await manager.send_personal_message(json.dumps({
            "type": "connection",
            "status": "connected",
            "message": "Olá! Eu sou a Lua. Como posso ajudá-lo?"
        }), websocket)
        
        while True:
            # Receive message from client
            data = await websocket.receive_text()
            message_data = json.loads(data)
            
            if message_data.get("type") == "chat":
                # Process chat message
                user_message = message_data.get("message", "")
                
                # Get text response
                if lua_assistant:
                    result = await lua_assistant.process_message(
                        message=user_message,
                        user_id=message_data.get("user_id"),
                        context=message_data.get("context")
                    )
                    response_text = result.get("response", "")
                else:
                    response_text = f"Echo: {user_message}"
                
                # Send text response
                await manager.send_personal_message(json.dumps({
                    "type": "text",
                    "message": response_text,
                    "timestamp": datetime.now().isoformat()
                }), websocket)
                
                # Generate and send audio response
                if tts_engine and message_data.get("audio", True):
                    audio_chunks = []
                    async for chunk in tts_engine.generate_speech(
                        text=response_text,
                        voice="luna"
                    ):
                        audio_chunks.append(chunk)
                        
                    if audio_chunks:
                        audio_data = b''.join(audio_chunks)
                        await manager.send_personal_message(json.dumps({
                            "type": "audio",
                            "data": base64.b64encode(audio_data).decode('utf-8'),
                            "format": "wav",
                            "timestamp": datetime.now().isoformat()
                        }), websocket)
                        
            elif message_data.get("type") == "audio":
                # Handle audio input (STT)
                audio_data = base64.b64decode(message_data.get("data", ""))
                # TODO: Implement Speech-to-Text processing
                await manager.send_personal_message(json.dumps({
                    "type": "status",
                    "message": "Audio received, STT processing not yet implemented"
                }), websocket)
                
            elif message_data.get("type") == "ping":
                # Handle ping
                await manager.send_personal_message(json.dumps({
                    "type": "pong",
                    "timestamp": datetime.now().isoformat()
                }), websocket)
                
    except WebSocketDisconnect:
        manager.disconnect(websocket)
        logger.info("WebSocket client disconnected")
    except Exception as e:
        logger.error(f"WebSocket error: {e}")
        manager.disconnect(websocket)
        

# Serve frontend (for development)
@app.get("/")
async def serve_frontend():
    """Serve frontend HTML"""
    frontend_file = Path(__file__).parent.parent / "frontend" / "public" / "index.html"
    if frontend_file.exists():
        return FileResponse(frontend_file)
    else:
        return {"message": "Lua TTS System API", "docs": "/docs"}


if __name__ == "__main__":
    import io
    uvicorn.run(
        "backend.main_fixed:app",
        host=settings.host,
        port=settings.port,
        reload=True,
        log_level=settings.log_level.lower()
    )
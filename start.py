#!/usr/bin/env python3
"""
Startup script for Lua TTS System
"""
import os
import sys
import subprocess
import platform
from pathlib import Path

def check_requirements():
    """Check if all requirements are installed"""
    print("🔍 Checking system requirements...")
    
    # Check Python version
    if sys.version_info < (3, 11):
        print("❌ Python 3.11+ is required")
        return False
    print("✅ Python version OK")
    
    # Check if FFmpeg is installed
    try:
        subprocess.run(["ffmpeg", "-version"], capture_output=True, check=True)
        print("✅ FFmpeg installed")
    except:
        print("⚠️  FFmpeg not found (audio processing may not work)")
    
    return True

def install_dependencies():
    """Install Python dependencies"""
    print("\n📦 Installing dependencies...")
    try:
        subprocess.run([sys.executable, "-m", "pip", "install", "-r", "requirements.txt"], check=True)
        print("✅ Dependencies installed")
        return True
    except:
        print("❌ Failed to install dependencies")
        return False

def start_backend():
    """Start the backend server"""
    print("\n🚀 Starting Lua TTS System...")
    os.chdir("backend")
    
    try:
        import uvicorn
        from main import app
        
        print("=" * 50)
        print("   Lua TTS System")
        print("   http://localhost:8000")
        print("   Docs: http://localhost:8000/docs")
        print("=" * 50)
        
        uvicorn.run(app, host="0.0.0.0", port=8000)
    except ImportError as e:
        print(f"❌ Import error: {e}")
        print("Please install dependencies first")
    except Exception as e:
        print(f"❌ Failed to start: {e}")

def main():
    """Main entry point"""
    print("🌙 Lua TTS System Launcher")
    print("=" * 50)
    
    # Check system
    if not check_requirements():
        return 1
    
    # Install deps if needed
    try:
        import kokoro
        import fastapi
        print("✅ Dependencies already installed")
    except ImportError:
        if not install_dependencies():
            return 1
    
    # Start backend
    start_backend()
    return 0

if __name__ == "__main__":
    sys.exit(main())
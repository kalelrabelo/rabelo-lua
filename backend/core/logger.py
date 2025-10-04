"""
Logger configuration for Lua TTS System
"""
import sys
from loguru import logger
from .config import settings

# Remove default logger
logger.remove()

# Configure logger with custom formatting
logger.add(
    sys.stdout,
    format="<fg #2E8B57>{time:HH:mm:ss}</fg #2E8B57> | "
           "<level>{level: <8}</level> | "
           "<fg #4169E1>{module}:{line}</fg #4169E1> | "
           "{message}",
    level=settings.log_level,
    colorize=True
)

# Add file logging
logger.add(
    settings.base_dir / "logs" / "lua_{time}.log",
    rotation="1 day",
    retention="7 days",
    level="DEBUG"
)

__all__ = ["logger"]
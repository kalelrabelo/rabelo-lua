@echo off
echo ======================================
echo  Lua TTS System - Fixed Version
echo ======================================

REM Check if Docker is running
docker info >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Docker nao esta rodando. Por favor, inicie o Docker Desktop.
    pause
    exit /b 1
)

REM Clean up existing containers
echo [INFO] Limpando containers antigos...
docker-compose down 2>nul
docker rm -f lua-backend lua-redis 2>nul

REM Build the Docker image
echo [INFO] Construindo imagem Docker...
docker build -t lua-tts-fixed -f Dockerfile .

if %errorlevel% neq 0 (
    echo [ERROR] Erro ao construir imagem Docker
    pause
    exit /b 1
)

REM Start services
echo [INFO] Iniciando servicos...
docker-compose up -d

if %errorlevel% neq 0 (
    echo [ERROR] Erro ao iniciar servicos
    pause
    exit /b 1
)

REM Wait for services
echo [INFO] Aguardando servicos iniciarem...
timeout /t 10 /nobreak >nul

REM Check status
echo [INFO] Verificando status dos servicos...
docker ps | findstr lua-

REM Test API
echo [INFO] Testando API...
curl -s http://localhost:8000/health

echo.
echo ======================================
echo  Sistema iniciado com sucesso!
echo ======================================
echo.
echo Acesse:
echo   - Frontend: http://localhost:8000
echo   - API Docs: http://localhost:8000/docs
echo   - WebSocket: ws://localhost:8000/ws
echo.
echo Para iniciar o modo conversa:
echo   Diga: "Lua, iniciar modo conversa"
echo.
echo Para parar o sistema:
echo   docker-compose down
echo.
echo Para ver logs:
echo   docker-compose logs -f
echo.
pause
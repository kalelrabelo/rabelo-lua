# Script PowerShell para iniciar o sistema de joalheria
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host "   ERP JOALHERIA ANTONIO RABELO - INICIANDO SISTEMA" -ForegroundColor Yellow
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host ""

# Verificar se Python está instalado
try {
    $pythonVersion = python --version 2>&1
    Write-Host "✓ Python encontrado: $pythonVersion" -ForegroundColor Green
}
catch {
    Write-Host "[ERRO] Python não está instalado ou não está no PATH." -ForegroundColor Red
    Write-Host "Por favor, instale Python 3.8+ de https://python.org" -ForegroundColor Yellow
    Read-Host "Pressione Enter para sair"
    exit 1
}

# Criar pasta data se não existir
if (!(Test-Path "data")) {
    Write-Host "Criando pasta data..." -ForegroundColor Yellow
    New-Item -ItemType Directory -Path "data" | Out-Null
}

# Instalar dependências
Write-Host "Verificando dependências..." -ForegroundColor Yellow
pip install -q -r requirements.txt
if ($LASTEXITCODE -ne 0) {
    Write-Host "[ERRO] Falha ao instalar dependências." -ForegroundColor Red
    Read-Host "Pressione Enter para sair"
    exit 1
}

Write-Host ""
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host "   SISTEMA PRONTO! INICIANDO SERVIDOR..." -ForegroundColor Green
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Acesse o sistema em: " -NoNewline
Write-Host "http://localhost:5000" -ForegroundColor Yellow
Write-Host ""
Write-Host "Login administrador:" -ForegroundColor Cyan
Write-Host "  Usuario: " -NoNewline
Write-Host "admin" -ForegroundColor Yellow
Write-Host "  Senha: " -NoNewline
Write-Host "admin123" -ForegroundColor Yellow
Write-Host ""
Write-Host "Login funcionario:" -ForegroundColor Cyan
Write-Host "  Usuario: " -NoNewline
Write-Host "funcionario" -ForegroundColor Yellow
Write-Host "  Senha: " -NoNewline
Write-Host "func123" -ForegroundColor Yellow
Write-Host ""
Write-Host "Pressione Ctrl+C para parar o servidor" -ForegroundColor Red
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host ""

# Iniciar servidor
python main.py
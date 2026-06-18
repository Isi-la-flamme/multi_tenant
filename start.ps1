# start.ps1
Write-Host "🚀 Démarrage de Tenant SaaS..." -ForegroundColor Cyan

# 1. Démarrer Docker (PostgreSQL + Redis)
Write-Host "📦 Démarrage de PostgreSQL et Redis..." -ForegroundColor Yellow
docker-compose up -d

# 2. Démarrer le Backend
Write-Host "🔄 Démarrage du Backend..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd C:\Users\hackf\CODEBASE\Tenant\backend; npm run dev"

# 3. Démarrer le Frontend
Write-Host "🔄 Démarrage du Frontend..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd C:\Users\hackf\CODEBASE\Tenant\frontend; npm run dev"

Write-Host ""
Write-Host "✅ Application démarrée !" -ForegroundColor Green
Write-Host "📱 Frontend : http://localhost:3001" -ForegroundColor Cyan
Write-Host "📱 Backend  : http://localhost:3000" -ForegroundColor Cyan
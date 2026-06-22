# test-api.ps1
Write-Host "🔍 Test de l'API" -ForegroundColor Cyan
Write-Host "=================" -ForegroundColor Cyan
Write-Host ""

$API_URL = "http://localhost:3000/api"

# 1. Connexion
Write-Host "1️⃣ Connexion..." -ForegroundColor Yellow
$loginBody = @{
    email = "test@example.com"
    password = "Test123!"
} | ConvertTo-Json

try {
    $loginResponse = Invoke-RestMethod -Uri "$API_URL/auth/login" `
        -Method Post `
        -Body $loginBody `
        -ContentType "application/json" `
        -ErrorAction Stop
    
    $token = $loginResponse.data.accessToken
    Write-Host "✅ Token obtenu !" -ForegroundColor Green
} catch {
    Write-Host "❌ Erreur de connexion : $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}
Write-Host ""

# 2. Tester POS
Write-Host "2️⃣ Test POS..." -ForegroundColor Yellow
$headers = @{
    "x-tenant-subdomain" = "demo"
    "Authorization" = "Bearer $token"
}

try {
    $posResponse = Invoke-RestMethod -Uri "$API_URL/pos/test" `
        -Method Get `
        -Headers $headers `
        -ErrorAction Stop
    
    Write-Host "✅ POS accessible !" -ForegroundColor Green
    $posResponse | ConvertTo-Json -Depth 3
} catch {
    Write-Host "❌ Erreur POS : $($_.Exception.Message)" -ForegroundColor Red
}
Write-Host ""

# 3. Tester Wallet
Write-Host "3️⃣ Test Wallet..." -ForegroundColor Yellow
try {
    $walletResponse = Invoke-RestMethod -Uri "$API_URL/wallet/balance" `
        -Method Get `
        -Headers $headers `
        -ErrorAction Stop
    
    Write-Host "✅ Wallet accessible !" -ForegroundColor Green
    $walletResponse | ConvertTo-Json -Depth 3
} catch {
    Write-Host "❌ Erreur Wallet : $($_.Exception.Message)" -ForegroundColor Red
}
Write-Host ""

# 4. Tester Dashboard
Write-Host "4️⃣ Test Dashboard..." -ForegroundColor Yellow
try {
    $dashboardResponse = Invoke-RestMethod -Uri "$API_URL/dashboard/stats" `
        -Method Get `
        -Headers $headers `
        -ErrorAction Stop
    
    Write-Host "✅ Dashboard accessible !" -ForegroundColor Green
    $dashboardResponse | ConvertTo-Json -Depth 3
} catch {
    Write-Host "❌ Erreur Dashboard : $($_.Exception.Message)" -ForegroundColor Red
}
Write-Host ""

Write-Host "=================" -ForegroundColor Cyan
Write-Host "🎉 Test terminé !" -ForegroundColor Green
Read-Host "Appuyez sur Entrée pour fermer"
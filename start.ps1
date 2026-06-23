# Créer le fichier avec le bon encodage
$content = @'
# test-pos.ps1
Write-Host "TEST DE L'API POS" -ForegroundColor Cyan
Write-Host "=================" -ForegroundColor Cyan
Write-Host ""

$API_URL = "http://localhost:3000/api"

# 1. Connexion
Write-Host "1) Connexion..." -ForegroundColor Yellow
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
    Write-Host "OK - Token obtenu !" -ForegroundColor Green
    Write-Host "   Token : $($token.Substring(0, 30))..." -ForegroundColor Gray
} catch {
    Write-Host "ERREUR de connexion : $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}
Write-Host ""

# 2. Headers
$headers = @{
    "x-tenant-subdomain" = "demo"
    "Authorization" = "Bearer $token"
}

# 3. Test POS Products
Write-Host "2) Test POS Products..." -ForegroundColor Yellow
try {
    $products = Invoke-RestMethod -Uri "$API_URL/pos/products" `
        -Method Get `
        -Headers $headers `
        -ErrorAction Stop
    
    Write-Host "OK - Produits recuperes !" -ForegroundColor Green
    Write-Host "   Nombre : $($products.data.Count)" -ForegroundColor White
    $products.data | ForEach-Object {
        Write-Host "   - $($_.name) : $($_.price) EUR (stock: $($_.stock))" -ForegroundColor Gray
    }
} catch {
    Write-Host "ERREUR : $($_.Exception.Message)" -ForegroundColor Red
}
Write-Host ""

# 4. Test POS Stats
Write-Host "3) Test POS Stats..." -ForegroundColor Yellow
try {
    $stats = Invoke-RestMethod -Uri "$API_URL/pos/stats" `
        -Method Get `
        -Headers $headers `
        -ErrorAction Stop
    
    Write-Host "OK - Statistiques recuperees !" -ForegroundColor Green
    Write-Host "   Ventes du jour : $($stats.data.totalSales)" -ForegroundColor White
    Write-Host "   CA : $($stats.data.totalRevenue) EUR" -ForegroundColor White
    Write-Host "   Articles vendus : $($stats.data.totalItemsSold)" -ForegroundColor White
    Write-Host "   Panier moyen : $($stats.data.averageTicket) EUR" -ForegroundColor White
} catch {
    Write-Host "ERREUR : $($_.Exception.Message)" -ForegroundColor Red
}
Write-Host ""

# 5. Test POS Test Route
Write-Host "4) Test POS Test Route..." -ForegroundColor Yellow
try {
    $test = Invoke-RestMethod -Uri "$API_URL/pos/test" `
        -Method Get `
        -Headers $headers `
        -ErrorAction Stop
    
    Write-Host "OK - Route test OK !" -ForegroundColor Green
    Write-Host "   Message : $($test.message)" -ForegroundColor White
} catch {
    Write-Host "ERREUR : $($_.Exception.Message)" -ForegroundColor Red
}
Write-Host ""

Write-Host "=================" -ForegroundColor Cyan
Write-Host "Test termine !" -ForegroundColor Green
Read-Host "Appuyez sur Entree pour fermer"
'@

$content | Out-File -FilePath "test-pos.ps1" -Encoding ASCII
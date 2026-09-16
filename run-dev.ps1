Write-Host "=======================================" -ForegroundColor Cyan
Write-Host " Starting FatiHomes in DEV stage... " -ForegroundColor Yellow
Write-Host " URL: http://localhost:5047" -ForegroundColor Green
Write-Host " Swagger: http://localhost:5047/swagger" -ForegroundColor Green
Write-Host "=======================================" -ForegroundColor Cyan
dotnet run --launch-profile dev

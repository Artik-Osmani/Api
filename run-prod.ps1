Write-Host "=======================================" -ForegroundColor Cyan
Write-Host " Starting FatiHomes in PROD stage... " -ForegroundColor Magenta
Write-Host " URL: http://localhost:5000" -ForegroundColor Green
Write-Host " Swagger: http://localhost:5000/swagger" -ForegroundColor Green
Write-Host "=======================================" -ForegroundColor Cyan
dotnet run --launch-profile prod

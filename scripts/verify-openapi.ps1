# Compares the paths and operations in docs/openapi.yaml with the running API's Swagger document.
# Exit code 1 when the repository spec has drifted from the code.
param(
    [string]$BaseUrl = 'http://localhost:5047',
    [string]$Spec = 'docs/openapi.yaml'
)

$ErrorActionPreference = 'Stop'

if (-not (Test-Path $Spec)) {
    Write-Error "Spec not found: $Spec"
    exit 1
}

try {
    $runtime = Invoke-RestMethod "$BaseUrl/swagger/v1/swagger.json" -TimeoutSec 20
}
catch {
    Write-Error "Could not read $BaseUrl/swagger/v1/swagger.json. Start the app with dotnet run first."
    exit 1
}

$runtimePaths = @($runtime.paths.PSObject.Properties.Name | Sort-Object -Unique)
$specText = Get-Content $Spec -Raw
$specPaths = @(
    [regex]::Matches($specText, '(?m)^  "?(/v1/[^\s:"]+)"?:') |
        ForEach-Object { $_.Groups[1].Value } |
        Sort-Object -Unique
)

$methods = 'get|post|put|patch|delete|head|options'
$runtimeOperations = 0
foreach ($path in $runtime.paths.PSObject.Properties) {
    $runtimeOperations += @($path.Value.PSObject.Properties.Name | Where-Object { $_ -match "^($methods)$" }).Count
}
$specOperations = ([regex]::Matches($specText, "(?m)^    ($methods):")).Count

$missing = @($runtimePaths | Where-Object { $specPaths -notcontains $_ })
$extra = @($specPaths | Where-Object { $runtimePaths -notcontains $_ })

Write-Output "Runtime: $($runtimePaths.Count) paths, $runtimeOperations operations"
Write-Output "Spec:    $($specPaths.Count) paths, $specOperations operations"

if ($missing.Count -gt 0) {
    Write-Output 'Missing from the spec:'
    $missing | ForEach-Object { Write-Output "  $_" }
}

if ($extra.Count -gt 0) {
    Write-Output 'Extra in the spec:'
    $extra | ForEach-Object { Write-Output "  $_" }
}

if ($missing.Count -gt 0 -or $extra.Count -gt 0 -or $runtimeOperations -ne $specOperations) {
    Write-Output 'FAIL: docs/openapi.yaml does not match the running API.'
    exit 1
}

Write-Output 'PASS: the spec matches the running API.'
exit 0

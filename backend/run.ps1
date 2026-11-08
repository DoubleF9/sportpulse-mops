$ErrorActionPreference = 'Stop'
$envFile = Join-Path $PSScriptRoot '.env'

if (-not (Test-Path $envFile)) {
  throw "Nu exista backend/.env. Copiaza backend/.env.example in backend/.env si completeaza credențialele."
}

$envContent = Get-Content $envFile -Raw
foreach ($key in @('MONGODB_URI', 'API_SPORTS_KEY')) {
  if ($envContent -notmatch "(?m)^\s*$key=(?!\s*$).+") {
    throw "Valoarea pentru $key lipseste din backend/.env."
  }
}

Push-Location $PSScriptRoot
try {
  & .\mvnw.cmd spring-boot:run
  if ($LASTEXITCODE -ne 0) {
    exit $LASTEXITCODE
  }
}
finally {
  Pop-Location
}

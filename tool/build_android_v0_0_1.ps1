$ErrorActionPreference = 'Stop'
Push-Location (Join-Path $PSScriptRoot '..')
try {
    flutter pub get
    if ($LASTEXITCODE -ne 0) { throw 'Installation des dépendances échouée.' }
    flutter analyze lib test
    if ($LASTEXITCODE -ne 0) { throw 'Analyse du code échouée.' }
    flutter test
    if ($LASTEXITCODE -ne 0) { throw 'Tests échoués.' }
    flutter build apk --profile --split-per-abi --target-platform android-arm64
    if ($LASTEXITCODE -ne 0) { throw 'Compilation Android échouée.' }
    Write-Host 'APK de test : build/app/outputs/flutter-apk/app-arm64-v8a-profile.apk'
    Write-Host 'Google : configurer les identifiants OAuth mobiles du projet Firebase avant validation sur téléphone.'
} finally {
    Pop-Location
}

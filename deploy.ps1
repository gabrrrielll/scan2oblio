# Script de deploy pentru Scan2Oblio (PowerShell)
# Generează build-ul React și trimite doar fișierele necesare în repository

$ErrorActionPreference = "Stop"

Write-Host "🚀 Starting deployment process..." -ForegroundColor Blue

# Step 1: Build React app
Write-Host "📦 Building React application..." -ForegroundColor Cyan
npm run build

if (-Not (Test-Path "dist")) {
    Write-Host "❌ Error: dist folder not found after build" -ForegroundColor Red
    exit 1
}

Write-Host "✅ Build completed successfully" -ForegroundColor Green

# Step 2: Create deploy directory
Write-Host "📁 Preparing deployment files..." -ForegroundColor Cyan
if (Test-Path "deploy") {
    Remove-Item -Recurse -Force "deploy"
}
New-Item -ItemType Directory -Path "deploy" | Out-Null

# Copy necessary files for production
Copy-Item -Recurse -Path "dist\*" -Destination "deploy\"
Copy-Item -Path "api.php" -Destination "deploy\"
if (Test-Path ".htaccess") {
    Copy-Item -Path ".htaccess" -Destination "deploy\"
} else {
    Write-Host "⚠️  .htaccess not found (optional)" -ForegroundColor Yellow
}

# Create a simple README for the server
@"
# Scan2Oblio - Production Files

Aceste fișiere sunt generate automat de scriptul de deploy.

## Structura:
- \`index.html\` - Entry point aplicație React
- \`assets/\` - Fișiere JavaScript și CSS compilate
- \`api.php\` - Backend PHP pentru proxy Oblio API
- \`.htaccess\` - Configurare Apache (opțional)

## Deployment:
Aceste fișiere trebuie copiate în folderul \`/scan\` de pe serverul ai24stiri.ro
"@ | Out-File -FilePath "deploy\README.md" -Encoding UTF8

Write-Host "✅ Deployment files prepared" -ForegroundColor Green

# Step 3: Check git status
if (-Not (Test-Path ".git")) {
    Write-Host "⚠️  Git repository not initialized. Initializing..." -ForegroundColor Yellow
    git init
    $remoteExists = git remote get-url origin 2>$null
    if (-Not $remoteExists) {
        git remote add origin https://github.com/gabrrrielll/scan2oblio.git
    } else {
        Write-Host "Remote already exists" -ForegroundColor Yellow
    }
}

# Step 4: Add and commit deploy files
Write-Host "📝 Committing deployment files..." -ForegroundColor Cyan

# Force add deploy folder (even if in .gitignore)
git add -f deploy/

# Check if there are changes
$status = git status --porcelain deploy/ 2>$null
if ($status) {
    $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    git commit -m "Deploy: Update production files $timestamp"
    Write-Host "✅ Changes committed" -ForegroundColor Green
} else {
    Write-Host "⚠️  No changes to commit" -ForegroundColor Yellow
}

# Step 5: Push to repository
Write-Host "⬆️  Pushing to repository..." -ForegroundColor Cyan
try {
    git push origin main
} catch {
    try {
        git push origin master
    } catch {
        Write-Host "⚠️  Push failed. You may need to set upstream:" -ForegroundColor Yellow
        Write-Host "   git push -u origin main" -ForegroundColor Yellow
    }
}

Write-Host "✅ Deployment completed successfully!" -ForegroundColor Green
Write-Host "📋 Next steps:" -ForegroundColor Blue
Write-Host "   1. Connect repository to server at ai24stiri.ro/scan"
Write-Host "   2. Set up auto-deploy or manual pull on server"
Write-Host "   3. Ensure PHP and required extensions are enabled"


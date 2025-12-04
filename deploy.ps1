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

# Step 2: Prepare production files in root (for direct server deployment)
Write-Host "📁 Preparing production files in repository root..." -ForegroundColor Cyan

# Copy necessary files for production directly to root
Copy-Item -Recurse -Path "dist\*" -Destination "." -Force
Copy-Item -Path "api.php" -Destination "api.php" -Force
if (Test-Path ".htaccess") {
    Copy-Item -Path ".htaccess" -Destination ".htaccess" -Force
}
else {
    Write-Host "⚠️  .htaccess not found (optional)" -ForegroundColor Yellow
}

Write-Host "✅ Production files prepared in repository root" -ForegroundColor Green

# Step 3: Check git status
if (-Not (Test-Path ".git")) {
    Write-Host "⚠️  Git repository not initialized. Initializing..." -ForegroundColor Yellow
    git init
    $remoteExists = git remote get-url origin 2>$null
    if (-Not $remoteExists) {
        git remote add origin https://github.com/gabrrrielll/scan2oblio.git
    }
    else {
        Write-Host "Remote already exists" -ForegroundColor Yellow
    }
}

# Step 4: Add and commit production files
Write-Host "📝 Committing production files..." -ForegroundColor Cyan

# Add production files (index.html, assets/, api.php, .htaccess)
git add index.html assets/ api.php .htaccess 2>$null
if ($LASTEXITCODE -ne 0) {
    git add index.html assets/ api.php
}

# Check if there are changes
$status = git status --porcelain 2>$null
if ($status) {
    $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    git commit -m "Deploy: Update production files $timestamp"
    Write-Host "✅ Changes committed" -ForegroundColor Green
}
else {
    Write-Host "⚠️  No changes to commit" -ForegroundColor Yellow
}

# Step 5: Push to repository
Write-Host "⬆️  Pushing to repository..." -ForegroundColor Cyan

# Get current branch name
try {
    $currentBranch = git branch --show-current 2>$null
    if (-Not $currentBranch) {
        $currentBranch = "master"
    }
    
    Write-Host "📌 Pushing to branch: $currentBranch" -ForegroundColor Cyan
    
    git push origin $currentBranch
    Write-Host "✅ Push successful" -ForegroundColor Green
}
catch {
    Write-Host "⚠️  Push failed. You may need to set upstream:" -ForegroundColor Yellow
    $branch = git branch --show-current 2>$null
    if (-Not $branch) { $branch = "master" }
    Write-Host "   git push -u origin $branch" -ForegroundColor Yellow
}

Write-Host "✅ Deployment completed successfully!" -ForegroundColor Green
Write-Host "📋 Next steps:" -ForegroundColor Blue
Write-Host "   1. On server: git clone https://github.com/gabrrrielll/scan2oblio.git scan"
Write-Host "   2. Access: https://ai24stiri.ro/scan (should work immediately!)"
Write-Host "   3. For updates: cd scan && git pull origin master"
Write-Host "   4. Ensure PHP and required extensions are enabled on server"


#!/bin/bash

# Script de deploy pentru Scan2Oblio
# Generează build-ul React și trimite doar fișierele necesare în repository

set -e  # Exit on error

echo "🚀 Starting deployment process..."

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Step 1: Build React app
echo -e "${BLUE}📦 Building React application...${NC}"
npm run build

if [ ! -d "dist" ]; then
    echo -e "${YELLOW}❌ Error: dist folder not found after build${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Build completed successfully${NC}"

# Step 2: Prepare production files in root (for direct server deployment)
echo -e "${BLUE}📁 Preparing production files in repository root...${NC}"

# Copy necessary files for production directly to root
cp -r dist/* .
cp api.php api.php
cp .htaccess .htaccess 2>/dev/null || echo "⚠️  .htaccess not found (optional)"

echo -e "${GREEN}✅ Production files prepared in repository root${NC}"

# Step 3: Check git status
if ! git rev-parse --git-dir > /dev/null 2>&1; then
    echo -e "${YELLOW}⚠️  Git repository not initialized. Initializing...${NC}"
    git init
    git remote add origin https://github.com/gabrrrielll/scan2oblio.git 2>/dev/null || echo "Remote already exists"
fi

# Step 4: Add and commit production files
echo -e "${BLUE}📝 Committing production files...${NC}"

# Add production files (index.html, assets/, api.php, .htaccess)
git add index.html assets/ api.php .htaccess 2>/dev/null || git add index.html assets/ api.php

# Check if there are changes
if git diff --cached --quiet; then
    echo -e "${YELLOW}⚠️  No changes to commit${NC}"
else
    git commit -m "Deploy: Update production files $(date +'%Y-%m-%d %H:%M:%S')"
    echo -e "${GREEN}✅ Changes committed${NC}"
fi

# Step 5: Push to repository
echo -e "${BLUE}⬆️  Pushing to repository...${NC}"
git push origin main || git push origin master || {
    echo -e "${YELLOW}⚠️  Push failed. You may need to set upstream:${NC}"
    echo "   git push -u origin main"
}

echo -e "${GREEN}✅ Deployment completed successfully!${NC}"
echo -e "${BLUE}📋 Next steps:${NC}"
echo "   1. On server: git clone https://github.com/gabrrrielll/scan2oblio.git scan"
echo "   2. Access: https://ai24stiri.ro/scan (should work immediately!)"
echo "   3. For updates: cd scan && git pull origin main"
echo "   4. Ensure PHP and required extensions are enabled on server"


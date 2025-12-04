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

# Step 2: Create deploy directory
echo -e "${BLUE}📁 Preparing deployment files...${NC}"
rm -rf deploy
mkdir -p deploy

# Copy necessary files for production
cp -r dist/* deploy/
cp api.php deploy/
cp .htaccess deploy/ 2>/dev/null || echo "⚠️  .htaccess not found (optional)"

# Create a simple README for the server
cat > deploy/README.md << EOF
# Scan2Oblio - Production Files

Aceste fișiere sunt generate automat de scriptul de deploy.

## Structura:
- \`index.html\` - Entry point aplicație React
- \`assets/\` - Fișiere JavaScript și CSS compilate
- \`api.php\` - Backend PHP pentru proxy Oblio API
- \`.htaccess\` - Configurare Apache (opțional)

## Deployment:
Aceste fișiere trebuie copiate în folderul \`/scan\` de pe serverul ai24stiri.ro
EOF

echo -e "${GREEN}✅ Deployment files prepared${NC}"

# Step 3: Check git status
if ! git rev-parse --git-dir > /dev/null 2>&1; then
    echo -e "${YELLOW}⚠️  Git repository not initialized. Initializing...${NC}"
    git init
    git remote add origin https://github.com/gabrrrielll/scan2oblio.git 2>/dev/null || echo "Remote already exists"
fi

# Step 4: Add and commit deploy files
echo -e "${BLUE}📝 Committing deployment files...${NC}"

# Force add deploy folder (even if in .gitignore)
git add -f deploy/

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
echo "   1. Connect repository to server at ai24stiri.ro/scan"
echo "   2. Set up auto-deploy or manual pull on server"
echo "   3. Ensure PHP and required extensions are enabled"


#!/usr/bin/env node

/**
 * Script de deploy pentru Scan2Oblio
 * Generează build-ul React și trimite doar fișierele necesare în repository
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  blue: '\x1b[34m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m',
  red: '\x1b[31m'
};

function log(message, color = colors.reset) {
  console.log(`${color}${message}${colors.reset}`);
}

function exec(command, options = {}) {
  try {
    return execSync(command, { 
      stdio: 'inherit', 
      encoding: 'utf8',
      ...options 
    });
  } catch (error) {
    log(`❌ Error executing: ${command}`, colors.red);
    process.exit(1);
  }
}

function exists(path) {
  return fs.existsSync(path);
}

log('🚀 Starting deployment process...', colors.blue);

// Step 1: Build React app
log('📦 Building React application...', colors.cyan);
exec('npm run build');

if (!exists('dist')) {
  log('❌ Error: dist folder not found after build', colors.red);
  process.exit(1);
}

log('✅ Build completed successfully', colors.green);

// Step 2: Create deploy directory
log('📁 Preparing deployment files...', colors.cyan);

if (exists('deploy')) {
  fs.rmSync('deploy', { recursive: true, force: true });
}
fs.mkdirSync('deploy', { recursive: true });

// Copy necessary files for production
function copyRecursive(src, dest) {
  const stat = fs.statSync(src);
  if (stat.isDirectory()) {
    fs.mkdirSync(dest, { recursive: true });
    fs.readdirSync(src).forEach(file => {
      copyRecursive(path.join(src, file), path.join(dest, file));
    });
  } else {
    fs.copyFileSync(src, dest);
  }
}

copyRecursive('dist', 'deploy');
fs.copyFileSync('api.php', 'deploy/api.php');
if (exists('.htaccess')) {
  fs.copyFileSync('.htaccess', 'deploy/.htaccess');
} else {
  log('⚠️  .htaccess not found (optional)', colors.yellow);
}

// Create README for server
const readmeContent = `# Scan2Oblio - Production Files

Aceste fișiere sunt generate automat de scriptul de deploy.

## Structura:
- \`index.html\` - Entry point aplicație React
- \`assets/\` - Fișiere JavaScript și CSS compilate
- \`api.php\` - Backend PHP pentru proxy Oblio API
- \`.htaccess\` - Configurare Apache (opțional)

## Deployment:
Aceste fișiere trebuie copiate în folderul \`/scan\` de pe serverul ai24stiri.ro
`;

fs.writeFileSync('deploy/README.md', readmeContent, 'utf8');

log('✅ Deployment files prepared', colors.green);

// Step 3: Check git status
if (!exists('.git')) {
  log('⚠️  Git repository not initialized. Initializing...', colors.yellow);
  exec('git init');
  try {
    exec('git remote get-url origin', { stdio: 'pipe' });
  } catch {
    exec('git remote add origin https://github.com/gabrrrielll/scan2oblio.git');
  }
}

// Step 4: Add and commit deploy files
log('📝 Committing deployment files...', colors.cyan);

try {
  // Force add deploy folder (even if in .gitignore)
  exec('git add -f deploy/');
  const status = execSync('git status --porcelain deploy/', { encoding: 'utf8' });
  if (status.trim()) {
    const timestamp = new Date().toISOString().replace('T', ' ').substring(0, 19);
    exec(`git commit -m "Deploy: Update production files ${timestamp}"`);
    log('✅ Changes committed', colors.green);
  } else {
    log('⚠️  No changes to commit', colors.yellow);
  }
} catch (error) {
  // No changes or not a git repo
  log('⚠️  No changes to commit', colors.yellow);
}

// Step 5: Push to repository
log('⬆️  Pushing to repository...', colors.cyan);

try {
  exec('git push origin main');
} catch {
  try {
    exec('git push origin master');
  } catch {
    log('⚠️  Push failed. You may need to set upstream:', colors.yellow);
    log('   git push -u origin main', colors.yellow);
  }
}

log('✅ Deployment completed successfully!', colors.green);
log('📋 Next steps:', colors.blue);
log('   1. Connect repository to server at ai24stiri.ro/scan');
log('   2. Set up auto-deploy or manual pull on server');
log('   3. Ensure PHP and required extensions are enabled');


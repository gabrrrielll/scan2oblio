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

// Step 2: Prepare production files in root (for direct server deployment)
log('📁 Preparing production files in repository root...', colors.cyan);

// List of source files to keep (not overwritten by production files)
const sourceFilesToKeep = [
  '.git',
  '.gitignore',
  'package.json',
  'package-lock.json',
  'tsconfig.json',
  'vite.config.ts',
  'README.md',
  'DEPLOY.md',
  'QUICK_START.md',
  'App.tsx',
  'index.tsx',
  'index.html', // Will be overwritten by dist/index.html
  'components',
  'services',
  'types.ts',
  'constants.ts',
  'metadata.json',
  'deploy.js',
  'deploy.sh',
  'deploy.ps1',
  'node_modules',
  'dist', // Source build folder
  'api.php' // Will be overwritten
];

// Copy necessary files for production directly to root
function copyRecursive(src, dest) {
  const stat = fs.statSync(src);
  if (stat.isDirectory()) {
    if (!exists(dest)) {
      fs.mkdirSync(dest, { recursive: true });
    }
    fs.readdirSync(src).forEach(file => {
      copyRecursive(path.join(src, file), path.join(dest, file));
    });
  } else {
    fs.copyFileSync(src, dest);
  }
}

// Copy dist files to root (overwrites existing index.html)
copyRecursive('dist', '.');

// Copy api.php to root
fs.copyFileSync('api.php', 'api.php');

// Copy .htaccess to root if exists
if (exists('.htaccess')) {
  fs.copyFileSync('.htaccess', '.htaccess');
} else {
  log('⚠️  .htaccess not found (optional)', colors.yellow);
}

log('✅ Production files prepared in repository root', colors.green);

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

// Step 4: Add and commit production files
log('📝 Committing production files...', colors.cyan);

try {
  // Add production files (index.html, assets/, api.php, .htaccess)
  // Exclude source files from this commit
  exec('git add index.html assets/ api.php .htaccess 2>/dev/null || git add index.html assets/ api.php');
  
  const status = execSync('git status --porcelain', { encoding: 'utf8' });
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
log('   1. On server: git clone https://github.com/gabrrrielll/scan2oblio.git scan');
log('   2. Access: https://ai24stiri.ro/scan (should work immediately!)');
log('   3. For updates: cd scan && git pull origin main');
log('   4. Ensure PHP and required extensions are enabled on server');


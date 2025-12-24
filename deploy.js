#!/usr/bin/env node

/**
 * Script de deploy pentru Scan2Oblio
 * Generează build-ul React și trimite doar fișierele necesare în repository
 */

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

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

function cleanup() {
  if (exists('index.html.development')) {
    log('🔄 Restoring development index.html (cleanup)...', colors.yellow);
    try {
      fs.copyFileSync('index.html.development', 'index.html');
      fs.unlinkSync('index.html.development');
    } catch (e) {
      log('❌ Failed to restore index.html during cleanup', colors.red);
    }
  }
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
    cleanup();
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

// Backup index.html before overwriting
log('💾 Backing up development index.html...', colors.cyan);
try {
  fs.copyFileSync('index.html', 'index.html.development');
} catch (e) {
  log('⚠️  Could not backup index.html (it might not exist)', colors.yellow);
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
// ... (Git init logic remains same, skipping for brevity in this replace block if not changing) ...
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
  try {
    // Add all files (source code + production artifacts)
    exec('git add .', { stdio: 'pipe' });
  } catch (e) {
    // Ignore error if nothing to add
  }

  const staged = execSync('git diff --name-only --cached', { encoding: 'utf8', stdio: 'pipe' });
  if (staged.trim()) {
    const timestamp = new Date().toISOString().replace('T', ' ').substring(0, 19);
    exec(`git commit -m "Deploy: Update production files ${timestamp}"`);
    log('✅ Changes committed', colors.green);
  } else {
    log('⚠️  No changes to commit (build artifacts unchanged)', colors.yellow);
  }
} catch (error) {
  // No changes or not a git repo
  log('⚠️  No changes to commit', colors.yellow);
}

// Step 5: Push to repository
log('⬆️  Pushing to repository...', colors.cyan);

try {
  // Get current branch name
  const currentBranch = execSync('git branch --show-current', { encoding: 'utf8' }).trim();

  if (!currentBranch) {
    // Fallback: try to get branch from git status
    const statusOutput = execSync('git status -b --porcelain', { encoding: 'utf8' });
    const branchMatch = statusOutput.match(/## (.+?)(?:\.\.\.|$)/);
    const branch = branchMatch ? branchMatch[1] : 'master';

    log(`📌 Detected branch: ${branch}`, colors.cyan);
    exec(`git push origin ${branch}`);
  } else {
    log(`📌 Pushing to branch: ${currentBranch}`, colors.cyan);
    exec(`git push origin ${currentBranch}`);
  }
} catch (error) {
  // Try master as fallback
  try {
    log('📌 Trying master branch...', colors.cyan);
    exec('git push origin master');
  } catch {
    log('⚠️  Push failed. You may need to set upstream:', colors.yellow);
    const currentBranch = execSync('git branch --show-current', { encoding: 'utf8' }).trim() || 'master';
    log(`   git push -u origin ${currentBranch}`, colors.yellow);
  }
}

// Step 6: Restore development index.html
log('🔄 Restoring development index.html...', colors.cyan);
if (exists('index.html.development')) {
  try {
    fs.copyFileSync('index.html.development', 'index.html');
    fs.unlinkSync('index.html.development'); // Remove backup
    log('✅ Development index.html restored', colors.green);
  } catch (e) {
    log('❌ Failed to restore index.html', colors.red);
  }
}

log('✅ Deployment completed successfully!', colors.green);
log('📋 Next steps:', colors.blue);
log('   1. On server: git clone https://github.com/gabrrrielll/scan2oblio.git scan');
log('   2. Access: https://ai24stiri.ro/scan (should work immediately!)');
log('   3. For updates: cd scan && git pull origin master');
log('   4. Ensure PHP and required extensions are enabled on server');


# Quick Start - Deployment

## Pași Rapizi

### 1. Prima dată - Setup Repository

```bash
# Repository-ul este deja inițializat și configurat
# Remote: https://github.com/gabrrrielll/scan2oblio.git
```

### 2. Deploy pe Repository

```bash
npm run deploy
```

Acest script va:
- ✅ Genera build-ul React
- ✅ Copia fișierele în `deploy/`
- ✅ Face commit și push în repository

### 3. Pe Server (ai24stiri.ro)

```bash
# Clonează repository-ul
cd /path/to/webroot
git clone https://github.com/gabrrrielll/scan2oblio.git scan

# Copiază fișierele de producție
cd scan
cp -r deploy/* /path/to/webroot/scan/

# Sau configurează symlink
ln -s /path/to/scan/deploy/* /path/to/webroot/scan/
```

### 4. Update Automat (Opțional)

Adaugă în crontab:
```bash
# Update la fiecare oră
0 * * * * cd /path/to/scan && git pull origin main && cp -r deploy/* /path/to/webroot/scan/
```

## Structura Repository

```
scan2oblio/
├── deploy/              # ← Fișierele de producție (generat de script)
│   ├── index.html
│   ├── assets/
│   ├── api.php
│   └── .htaccess
├── src/                 # Cod sursă React
├── api.php              # Backend PHP (copiat în deploy/)
├── deploy.js            # Script deploy (Node.js)
├── deploy.sh            # Script deploy (Bash)
└── deploy.ps1           # Script deploy (PowerShell)
```

## Comenzi Utile

```bash
# Build manual
npm run build

# Deploy (build + commit + push)
npm run deploy

# Verifică status git
git status

# Verifică remote
git remote -v
```


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
# Clonează repository-ul direct în folderul scan
cd /path/to/webroot
git clone https://github.com/gabrrrielll/scan2oblio.git scan

# ✅ GATA! Aplicația funcționează imediat la ai24stiri.ro/scan
# Fișierele de producție (index.html, assets/, api.php) sunt deja în root!
```

### 4. Update Automat (Opțional)

Adaugă în crontab:
```bash
# Update la fiecare oră
0 * * * * cd /path/to/scan && git pull origin main
```

**Notă:** Nu este nevoie de copiere manuală - fișierele sunt deja în root!

## Structura Repository

```
scan2oblio/
├── index.html           # ← Aplicația React (generat de script)
├── assets/              # ← JS și CSS compilate (generat de script)
├── api.php              # ← Backend PHP (ready to use!)
├── .htaccess            # ← Configurare Apache
├── components/          # Cod sursă React
├── services/            # Cod sursă services
├── package.json         # Dependencies
├── deploy.js            # Script deploy (Node.js)
└── ...
```

**✅ Când se clonează repository-ul, aplicația funcționează imediat!**

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


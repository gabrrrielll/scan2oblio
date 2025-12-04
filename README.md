# Scan2Oblio - Scanner de Coduri de Produse

Aplicație React pentru scanarea codurilor de produse și integrare cu Oblio API prin backend PHP.

## Caracteristici

- 📱 Scanare coduri de bare cu camera
- 📦 Afișare stoc din Oblio
- 🧾 Creare facturi în Oblio
- 🔒 Backend PHP pentru rezolvarea problemelor CORS

## Structura Proiectului

- `api.php` - Backend PHP care face proxy pentru apelurile către Oblio API
- `dist/` - Build static React (generat cu `npm run build`)
- Frontend React - Interfață utilizator pentru scanare și gestionare produse

## Instalare și Deployment

### Deployment Rapid cu Script

Cel mai simplu mod de a face deploy este folosind scriptul automatizat:

```bash
npm run deploy
```

Sau pe Windows PowerShell:
```powershell
npm run deploy:ps1
```

Sau direct bash:
```bash
npm run deploy:bash
```

Scriptul va:
1. ✅ Genera build-ul React (`npm run build`)
2. ✅ Copia fișierele necesare în folderul `deploy/`
3. ✅ Face commit și push în repository

### Deployment Manual

### 1. Build Frontend React

```bash
npm install
npm run build
```

Aceasta va genera un folder `dist/` cu toate fișierele statice.

### 2. Deployment pe Server PHP

**Opțiunea 1: Deploy automat prin Git (Recomandat)**

1. **Pe server (ai24stiri.ro), clonează repository-ul:**
   ```bash
   cd /path/to/webroot
   git clone https://github.com/gabrrrielll/scan2oblio.git scan
   cd scan
   ```

2. **Configurează auto-update (opțional):**
   ```bash
   # Adaugă în crontab pentru update automat
   0 * * * * cd /path/to/scan && git pull origin main
   ```

3. **Structura pe server:**
   ```
   /path/to/scan/
   ├── deploy/
   │   ├── index.html
   │   ├── assets/
   │   │   ├── index-[hash].js
   │   │   └── index-[hash].css
   │   ├── api.php
   │   └── .htaccess
   └── (alte fișiere sursă)
   ```

   **Notă:** Pe server, copiază conținutul din `deploy/` în folderul web:
   ```bash
   cp -r deploy/* /path/to/webroot/scan/
   ```

**Opțiunea 2: Deploy manual**

1. **Încărcați fișierele pe server:**
   - Copiați conținutul folderului `deploy/` (generat de script) în directorul web
   - Sau copiați manual: `dist/*`, `api.php`, `.htaccess`

3. **Configurare Server:**
   - Asigurați-vă că PHP este activat (versiunea 7.4 sau mai nouă)
   - Verificați că extensia `curl` este activată în PHP
   - Asigurați-vă că serverul permite apeluri către `https://www.oblio.eu`

### 3. Configurare Apache (.htaccess)

Dacă folosiți Apache, creați un fișier `.htaccess` în directorul root:

```apache
# Enable rewrite engine
RewriteEngine On

# Redirect all requests to index.html except for api.php and existing files
RewriteCond %{REQUEST_FILENAME} !-f
RewriteCond %{REQUEST_FILENAME} !-d
RewriteCond %{REQUEST_URI} !^/api\.php
RewriteRule ^ index.html [L]

# Set proper MIME types
<IfModule mod_mime.c>
    AddType application/javascript js
    AddType text/css css
</IfModule>

# Enable CORS for API (dacă este necesar)
<IfModule mod_headers.c>
    Header set Access-Control-Allow-Origin "*"
    Header set Access-Control-Allow-Methods "GET, POST, OPTIONS"
    Header set Access-Control-Allow-Headers "Content-Type"
</IfModule>
```

### 4. Configurare Nginx

Dacă folosiți Nginx, adăugați următoarea configurare:

```nginx
server {
    listen 80;
    server_name your-domain.com;
    root /path/to/dist;
    index index.html;

    # API endpoint
    location /api.php {
        try_files $uri =404;
        fastcgi_pass unix:/var/run/php/php7.4-fpm.sock;
        fastcgi_index index.php;
        include fastcgi_params;
        fastcgi_param SCRIPT_FILENAME $document_root$fastcgi_script_name;
    }

    # React app - serve static files
    location / {
        try_files $uri $uri/ /index.html;
    }

    # Cache static assets
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
```

## Dezvoltare Locală

Pentru dezvoltare locală:

```bash
npm install
npm run dev
```

Aplicația va rula pe `http://localhost:3000`

**Notă:** Pentru testare locală cu backend PHP, veți avea nevoie de un server PHP local (XAMPP, WAMP, sau PHP built-in server):

```bash
# Într-un terminal, rulați serverul PHP
php -S localhost:8000

# În alt terminal, rulați frontend-ul React
npm run dev
```

Apoi actualizați `PHP_BACKEND_URL` în `services/oblioService.ts` pentru a indica către `http://localhost:8000/api.php`

## Securitate

⚠️ **IMPORTANT:** În producție, considerați:

1. **Restricționarea CORS:** Modificați `Access-Control-Allow-Origin` în `api.php` pentru a permite doar domeniul dvs.
2. **Validare input:** Adăugați validare suplimentară pentru datele primite
3. **Rate limiting:** Implementați limitare de rate pentru a preveni abuzurile
4. **HTTPS:** Folosiți HTTPS pentru toate conexiunile
5. **Cache token:** În producție, folosiți Redis sau alt sistem de cache persistent pentru token-uri

## Funcționalități

- ✅ Scanare coduri de bare cu camera
- ✅ Căutare manuală după cod sau nume
- ✅ Afișare inventar din Oblio
- ✅ Creare facturi în Oblio
- ✅ Gestionare stoc și cantități
- ✅ Backend PHP pentru rezolvarea CORS

## Tehnologii

- **Frontend:** React 19, TypeScript, Vite
- **Scanare:** react-zxing
- **UI:** Tailwind CSS (via CDN)
- **Backend:** PHP 7.4+
- **API:** Oblio API

## Licență

Privat - pentru uz intern.

# Ghid de Deployment

## Structura Repository

Repository-ul conține doar fișierele necesare pentru producție în folderul `deploy/`:
- `index.html` - Entry point aplicație React
- `assets/` - Fișiere JavaScript și CSS compilate
- `api.php` - Backend PHP pentru proxy Oblio API
- `.htaccess` - Configurare Apache

## Deployment pe Server

### Opțiunea 1: Deploy Manual

1. **Rulează scriptul de deploy:**
   ```bash
   npm run deploy
   ```
   sau pe Windows:
   ```powershell
   npm run deploy:ps1
   ```

2. **Pe server (ai24stiri.ro):**
   ```bash
   cd /path/to/scan
   git pull origin main
   ```

### Opțiunea 2: Auto-Deploy cu Webhook

1. **Configurează webhook pe GitHub:**
   - Settings > Webhooks > Add webhook
   - Payload URL: `https://ai24stiri.ro/webhook/scan2oblio`
   - Content type: `application/json`
   - Events: `Just the push event`

2. **Pe server, creează script webhook:**
   ```php
   <?php
   // webhook.php
   $repo_dir = '/path/to/scan';
   $output = shell_exec("cd $repo_dir && git pull origin main 2>&1");
   echo $output;
   ?>
   ```

### Opțiunea 3: Cron Job

Adaugă în crontab pentru update automat:
```bash
# Update every hour
0 * * * * cd /path/to/scan && git pull origin main
```

## Structura pe Server

```
/path/to/scan/
├── index.html
├── assets/
│   ├── index-[hash].js
│   └── index-[hash].css
├── api.php
├── .htaccess
└── README.md
```

## Verificare Deployment

1. Verifică că fișierele sunt actualizate:
   ```bash
   ls -la /path/to/scan/
   ```

2. Testează aplicația:
   - Accesează: `https://ai24stiri.ro/scan`
   - Verifică că API-ul funcționează: `https://ai24stiri.ro/scan/api.php?action=products&...`

3. Verifică logurile PHP pentru erori:
   ```bash
   tail -f /var/log/php/error.log
   ```

## Troubleshooting

### Eroare: "Cannot find module"
- Verifică că toate fișierele din `dist/` au fost copiate
- Rulează din nou `npm run build`

### Eroare: "CORS policy"
- Verifică că `api.php` este accesibil
- Verifică headerele CORS în `api.php`

### Eroare: "404 Not Found"
- Verifică configurarea `.htaccess`
- Verifică că mod_rewrite este activat în Apache


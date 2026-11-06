# gt-ko – GameTeam web

React (Vite) stránka s 3D prvkami (Three.js) a PHP API (SQLite) pre účty, skiny a admin panel.

## Spustenie lokálne (XAMPP)

```bash
npm install
npm run deploy      # zbuilduje a skopíruje do C:\xampp\htdocs\gameteam
```

Potom otvor http://localhost/gameteam/ (Apache musí bežať).

Prvý majiteľ sa vytvorí na http://localhost/gameteam/api/setup.php (len z localhostu).
Databáza je mimo webu: `C:\xampp\gameteam-data\`.

## Štruktúra

- `src/` – React komponenty a štýly
- `public/api/` – PHP API (prihlásenie, bany, hráči, skiny)
- `deploy.mjs` – kopírovanie buildu do XAMPP htdocs

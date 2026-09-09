# Maison Néra — Backend + Atelier Dashboard

A full CRUD backend collects Node.js + Express with the storefront (via a plain JSON file — no database, exactly like the **"Building a Web CRUD Based Inventory Dashboard"** workbook teaches).

## What you get

- **Storefront API** — `GET/POST/PUT/DELETE /api/products` with data persisted into `backend/data/products.json`
- **Admin dashboard** — `http://localhost:3000/admin` — add, edit, search, filter and delete fragrances, with inventory stats, stock badges, toasts, confirm dialogs, loading/empty states
- **Live storefront** — `index.html` / `shop.html` now load the catalogue from the API, so admin changes appear on the shop instantly (and fall back to the built-in list when the server is off)

## Folder structure

```text
perfume/
├── index.html              storefront (home)
├── shop.html               storefront (collection
├── css/ js/                storefront assets
├── admin/
│   ├── index.html          Atelier Dashboard (admin)
│   ├── admin.css           dashboard styles
│   └── admin.js            dashboard logic (CRUD + auth gate)
├── backend/
│   ├── server.js           Express API + static server
│   ├── package.json
│   └── data/
│       └── products.json   the "database" — JSON file storage
├── README.md
└── .gitignore
```

## Run it

```bash
cd backend
npm install       # first time only
npm start         # starts the server
```

Then open:

| URL | What |
| --- | --- |
| `http://localhost:3000` | Storefront (index.html) |
| `http://localhost:3000/shop.html` | Shop page |
| `http://localhost:3000/admin` | Atelier Dashboard (admin) |
| `http://localhost:3000/api/products` | API — all products (JSON) |
| `http://localhost:3000/api` | API info card |

> Tip: `npm run dev` starts the server with auto-restart on file changes (Node's built-in `--watch`).

## Admin login

Dashboard is protected by a simple password gate (**client-side, demo-grade** — the e-book keeps the stack "no auth", this just keeps casual visitors out):

- Default password: `admin123`
- Change it in `admin/admin.js` → `ADMIN_PASSWORD` constant.

## API reference

All routes return/accept JSON. Prices are in USD.

| Method | Route | Description | Body (JSON) |
| --- | --- | --- | --- |
| GET | `/api/products` | List all fragrances | — |
| GET | `/api/products/:id` | Get one fragrance | — |
| POST | `/api/products` | Add a fragrance | `{ name, price, stock, family, gender, img, desc, top, heart, base, code }` |
| PUT | `/api/products/:id` | Update a fragrance | any of the fields above |
| DELETE | `/api/products/:id` | Delete a fragrance | — |

Fields: `id` (auto-slug), `code` (auto `N° 09`), `name`*, `price`* (≥0,, `stock`* (≥0,, `family`, `gender`, `img` (Unsplash photo ID,, `desc`, `top`, `heart`, `base`. `*` = required (POST).

Example:

```bash
curl -X POST http://localhost:3000/api/products \
  -H "Content-Type: application/json" \
  -d "{\"name\":\"Cuir Sauvage\",\"price\":230,\"stock\":14,\"family\":\"Woody\",\"gender\":\"Unisex\"}"
```

## Product data shape

```json
{
  "id": "nuit-doree",
  "code": "N° 01",
  "name": "Nuit Dorée",
  "family": "Oriental",
  "gender": "For Her",
  "price":235,
  "stock":12,
  "img": "1541643600914-78b084683601",
  "desc": "…",
  "top": "Saffron · Calabrian Bergamot",
  "heart": "Dark Amber · Orris Butter",
  "base": "Smoked Vanilla · Cashmere Woods"
}
```

## Deployment (per the workbook, Steps  ̄8–10)

1. Commit everything (the `.gitignore` keeps `node_modules/` out — see Step 9)
2. Host the `backend/` folder anywhere Node.js runs (Render/Vercel/Railway…
   - Render: root directory = `backend`, build command = *(none)*, start command = `node server.js`
   - The API + static storefront + admin dashboard all ship together on one server — nothing extra to configure.
3. In production, set `PORT` via the platform's environment variable (the server already reads `process.env.PORT`; default 3000.

## Notes / ideas

- No database — data lives in `backend/data/products.json`, easy to back up, edit by hand, or dump to Git.
- Stock badge logic: `<10` → Low stock, `<0` → Out of stock.
- The storefront keeps a small built-in catalogue as an offline fallback (when the API isn't reachable).
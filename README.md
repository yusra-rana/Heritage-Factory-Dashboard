# Heritage Factory Dashboard — with real backend

This version has a working Node/Express backend instead of fake hardcoded
data. Login is real (checked against a hashed password), the sidebar
actually navigates between sections, and Orders supports full
Add / Edit / Delete that's saved to disk.

## How to run it

1. Install [Node.js](https://nodejs.org) (v18 or newer) if you don't have it.
2. Open a terminal in this folder and run:

   ```
   npm install
   npm start
   ```

3. Open **http://localhost:4000** in your browser.

## Login

- Username: `admin`
- Password: `admin123`

Change this in `db.js` before deploying anywhere real — right now it's
seeded on first run only. Also change `JWT_SECRET` in `server.js` (or set
it as an environment variable) before putting this online.

## What's real now

- **Auth**: `/api/auth/login` checks a bcrypt-hashed password and issues a
  JWT. The frontend won't load any data without a valid token.
- **Orders**: full CRUD — `GET/POST/PUT/DELETE /api/orders`. Add, edit, and
  delete all persist to `data.json`.
- **Dashboard, Production, Inventory, Employees, Suppliers**: all read
  from the same data store via the API, not hardcoded JS arrays.
- **Sidebar navigation**: each item is a real view (hash-based routing),
  not a dead `#` link.

## What's still a placeholder

- **Customers** and **Reports** pages are intentionally left as
  "coming soon" — no fake data pretending to be real.
- **Inventory / Employees / Suppliers** are read-only for now (no add/edit
  forms yet) — Orders was built out fully as the template to copy for
  the others.
- **Data storage** is a single `data.json` file, fine for a demo or small
  internal tool, but swap in a real database (Postgres/MySQL/Mongo) before
  this handles real business data or multiple concurrent users.

## Project structure

```
server.js       — Express app & API routes
db.js           — data storage + seeding
data.json       — created automatically on first run
public/
  index.html    — dashboard shell (all views)
  login.html
  css/
  js/
    api.js      — fetch wrapper (auth headers, error handling)
    script.js   — dashboard logic, routing, orders CRUD
    login.js
```

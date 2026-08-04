const express = require("express");
const cors = require("cors");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const path = require("path");
const store = require("./db");

const app = express();
const PORT = process.env.PORT || 4000;

// NOTE: for a real deployment, set this via an environment variable instead.
const JWT_SECRET = process.env.JWT_SECRET || "heritage-dev-secret-change-me";

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

// ---------- Auth middleware ----------

function requireAuth(req, res, next) {
    const header = req.headers.authorization || "";
    const token = header.startsWith("Bearer ") ? header.slice(7) : null;

    if (!token) return res.status(401).json({ error: "Not authenticated." });

    try {
        req.user = jwt.verify(token, JWT_SECRET);
        next();
    } catch {
        return res.status(401).json({ error: "Session expired. Please log in again." });
    }
}

// ---------- Auth routes ----------

app.post("/api/auth/login", (req, res) => {
    const { username, password } = req.body || {};
    const db = store.get();

    const user = db.users.find(u => u.username === username);

    if (!user || !bcrypt.compareSync(password || "", user.passwordHash)) {
        return res.status(401).json({ error: "Invalid username or password." });
    }

    const token = jwt.sign(
        { id: user.id, username: user.username, name: user.name, role: user.role },
        JWT_SECRET,
        { expiresIn: "8h" }
    );

    res.json({ token, user: { name: user.name, role: user.role, username: user.username } });
});

// ---------- Dashboard summary ----------

app.get("/api/dashboard/summary", requireAuth, (req, res) => {
    const db = store.get();

    res.json({
        totalEmployees: db.employees.length,
        todayProduction: db.stats.todayProduction,
        inventory: db.inventory.reduce((sum, i) => sum + i.quantity, 0),
        monthlySales: db.stats.monthlySales,
        machines: db.machines,
        productionSummary: db.inventory.map(i => ({ item: i.item, quantity: i.quantity })),
        productionChart: db.productionChart,
        salesChart: db.salesChart,
        notifications: db.notifications,
        suppliers: db.suppliers.map(s => s.name)
    });
});

// ---------- Orders CRUD ----------

app.get("/api/orders", requireAuth, (req, res) => {
    res.json(store.get().orders);
});

app.post("/api/orders", requireAuth, (req, res) => {
    const { customer, product, quantity, status } = req.body || {};

    if (!customer || !product || !quantity || !status) {
        return res.status(400).json({ error: "customer, product, quantity and status are all required." });
    }

    const db = store.get();
    const order = { id: db.nextOrderId++, customer, product, quantity: Number(quantity), status };
    db.orders.unshift(order);
    store.save();

    res.status(201).json(order);
});

app.put("/api/orders/:id", requireAuth, (req, res) => {
    const db = store.get();
    const id = Number(req.params.id);
    const order = db.orders.find(o => o.id === id);

    if (!order) return res.status(404).json({ error: "Order not found." });

    const { customer, product, quantity, status } = req.body || {};
    if (customer) order.customer = customer;
    if (product) order.product = product;
    if (quantity) order.quantity = Number(quantity);
    if (status) order.status = status;

    store.save();
    res.json(order);
});

app.delete("/api/orders/:id", requireAuth, (req, res) => {
    const db = store.get();
    const id = Number(req.params.id);
    const before = db.orders.length;
    db.orders = db.orders.filter(o => o.id !== id);

    if (db.orders.length === before) return res.status(404).json({ error: "Order not found." });

    store.save();
    res.status(204).end();
});

// ---------- Read-only reference data ----------

app.get("/api/employees", requireAuth, (req, res) => res.json(store.get().employees));
app.get("/api/inventory", requireAuth, (req, res) => res.json(store.get().inventory));
app.get("/api/suppliers", requireAuth, (req, res) => res.json(store.get().suppliers));

// Fallback to the app for any non-API route (simple SPA-style serving)
app.get(/^\/(?!api\/).*/, (req, res) => {
    res.sendFile(path.join(__dirname, "public", "index.html"));
});

app.listen(PORT, () => {
    console.log(`Heritage Factory Dashboard server running at http://localhost:${PORT}`);
});

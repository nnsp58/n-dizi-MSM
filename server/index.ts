import express from "express";
import cors from "cors";
import bodyParser from "body-parser";
import jwt from "jsonwebtoken";
import sqlite3 from "sqlite3";
import { open } from "sqlite";

const app = express();
app.use(cors());
app.use(bodyParser.json());

const SECRET_KEY = "n_dizi_secret_key_2025";

// 🧠 Connect SQLite
let db: any;
(async () => {
  db = await open({
    filename: "./store.db",
    driver: sqlite3.Database,
  });
  await db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT UNIQUE,
      password TEXT
    )
  `);
})();

// 🧩 Signup
app.post("/api/auth/signup", async (req, res) => {
  const { email, password } = req.body;
  try {
    await db.run("INSERT INTO users (email, password) VALUES (?, ?)", [email, password]);
    res.json({ success: true, message: "User registered successfully" });
  } catch (err) {
    res.status(400).json({ success: false, message: "User already exists" });
  }
});

// 🔐 Login
app.post("/api/auth/login", async (req, res) => {
  const { email, password } = req.body;
  const user = await db.get("SELECT * FROM users WHERE email=? AND password=?", [email, password]);
  if (user) {
    const token = jwt.sign({ id: user.id, email: user.email }, SECRET_KEY, { expiresIn: "2h" });
    res.json({ success: true, token });
  } else {
    res.status(401).json({ success: false, message: "Invalid credentials" });
  }
});

// 🔎 Verify token
app.get("/api/auth/verify", (req, res) => {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) return res.status(403).json({ success: false, message: "No token provided" });
  try {
    const decoded = jwt.verify(token, SECRET_KEY);
    res.json({ success: true, user: decoded });
  } catch {
    res.status(401).json({ success: false, message: "Invalid token" });
  }
});

app.listen(3000, () => console.log("✅ Server running on http://localhost:3000"));

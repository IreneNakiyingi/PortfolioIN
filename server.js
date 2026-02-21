const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const session = require('express-session');
const nodemailer = require('nodemailer');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// --- 1. CONFIGURATION ---
const ADMIN_PASSWORD = "Treasure12"; // CHANGE THIS!
const MY_EMAIL = "iryntracy@gmail.com"; 
const SENDER_EMAIL = "iryntracy@gmail.com"; // Your Gmail
const SENDER_PASS = "your-app-password";    // Your Google App Password

// --- 2. MIDDLEWARE ---
app.use(express.static('public')); 
app.use(express.json()); 
app.use(express.urlencoded({ extended: true }));

app.use(session({
    secret: 'portfolio-secret-key-12345', 
    resave: false,
    saveUninitialized: true,
    cookie: { maxAge: 3600000 } // 1 hour session
}));

// Auth Guard Middleware
const checkAuth = (req, res, next) => {
    if (req.session.isAdmin) return next();
    res.status(403).json({ error: "Access Denied" });
};

// --- 3. DATABASE SETUP ---
const db = new sqlite3.Database('./portfolio.db', (err) => {
    if (err) console.error(err.message);
    console.log('Connected to the portfolio database.');
});

db.serialize(() => {
  // This creates the table with all necessary columns for your professional sections
    db.run(`CREATE TABLE IF NOT EXISTS projects (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        category TEXT,        /* Health, Tech, or Research */
        subcategory TEXT,     /* e.g., Mental Health, Data Science */
        title TEXT,           /* Project Name */
        role TEXT,            /* Your specific contribution */
        description TEXT,     /* Detailed summary */
        tools TEXT,           /* e.g., Python, SQL, AWS */
        link TEXT,            /* URL to live project or GitHub */
        image TEXT            /* URL to project thumbnail */
    )`);
});

// --- 4. ROUTES ---

// Admin Login
app.post('/api/login', (req, res) => {
    const { password } = req.body;
    if (password === ADMIN_PASSWORD) {
        req.session.isAdmin = true;
        res.json({ success: true });
    } else {
        res.status(401).json({ success: false, message: "Unauthorized" });
    }
});

// Fetch All Projects (Public)
app.get('/api/projects', (req, res) => {
    db.all("SELECT * FROM projects", [], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

// Add Project (Protected - requires login)
app.post('/api/projects', checkAuth, (req, res) => {
    const { category, subcategory, title, role, description, tools, link, image } = req.body;
    const sql = `INSERT INTO projects (category, subcategory, title, role, description, tools, link, image) VALUES (?,?,?,?,?,?,?,?)`;
    db.run(sql, [category, subcategory, title, role, description, tools, link, image], function(err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ id: this.lastID, message: "Project added!" });
    });
});
// DELETE a project (Protected)
app.delete('/api/projects/:id', checkAuth, (req, res) => {
    const id = req.params.id;
    db.run("DELETE FROM projects WHERE id = ?", id, function(err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ message: "Deleted successfully" });
    });
});

// UPDATE an existing project (Protected)
app.put('/api/projects/:id', checkAuth, (req, res) => {
    const id = req.params.id;
    const { category, subcategory, title, description, tools, link, image } = req.body;
    
    const sql = `UPDATE projects SET 
                 category = ?, subcategory = ?, title = ?, 
                 description = ?, tools = ?, link = ?, image = ? 
                 WHERE id = ?`;

    db.run(sql, [category, subcategory, title, description, tools, link, image, id], function(err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ message: "Updated successfully", changes: this.changes });
    });
});

// Contact Form (Nodemailer)
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: { user: SENDER_EMAIL, pass: SENDER_PASS }
});

app.post('/api/contact', (req, res) => {
    const { name, email, message } = req.body;
    const mailOptions = {
        from: email,
        to: MY_EMAIL,
        subject: `New Portfolio Message from ${name}`,
        text: `From: ${name} (${email})\n\nMessage: ${message}`
    };

    transporter.sendMail(mailOptions, (error, info) => {
        if (error) return res.status(500).send(error.toString());
        res.status(200).json({ success: true, message: "Email Sent!" });
    });
});

// --- 5. START SERVER ---
app.listen(PORT, () => console.log(`🚀 Server running on http://localhost:${PORT}`));
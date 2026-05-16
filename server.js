// server.js
const express = require('express');
const mysql = require('mysql2');
const session = require('express-session');

const app = express();
app.use(session({ secret: 'secret', resave: false, saveUninitialized: true }));

// DB connection
const db = mysql.createConnection({
  host: process.env.DB_HOST,   // set in Render env vars
  user: process.env.DB_USER,
  password: process.env.DB_PASS,
  database: process.env.DB_NAME,
  port: 3306
});

// Endpoint to get current username
app.get('/api/username', (req, res) => {
  if (!req.session.userId) return res.json({ username: 'Guest' });
  db.query('SELECT username FROM users WHERE id=?', [req.session.userId], (err, results) => {
    if (err || results.length === 0) return res.json({ username: 'Guest' });
    res.json({ username: results[0].username });
  });
});

app.listen(3000, () => console.log('API running on port 3000'));

const express = require('express');
const mysql = require('mysql2');
const session = require('express-session');
const WebSocket = require('ws');

const app = express();
app.use(session({ secret: 'secret', resave: false, saveUninitialized: true }));

// DB connection (use environment variables from Render dashboard)
const db = mysql.createConnection({
  host: process.env.DB_HOST,   // e.g. mydb.onrender.com
  user: process.env.DB_USER,
  password: process.env.DB_PASS,
  database: process.env.DB_NAME,
  port: 3306
});

// Simple API to get current username
app.get('/api/username', (req, res) => {
  if (!req.session.userId) return res.json({ username: 'Guest' });
  db.query('SELECT username FROM users WHERE id=?', [req.session.userId], (err, results) => {
    if (err || results.length === 0) return res.json({ username: 'Guest' });
    res.json({ username: results[0].username });
  });
});

// Serve static files (your HTML/CSS/JS)
app.use(express.static('public'));

// WebSocket server for chat
const wss = new WebSocket.Server({ port: 8080 });
wss.on('connection', (ws) => {
  ws.on('message', (raw) => {
    const data = JSON.parse(raw.toString());

    if (data.type === "register") {
      ws.username = data.username;
      return;
    }

    if (data.type === "global") {
      wss.clients.forEach(client => {
        if (client.readyState === WebSocket.OPEN) {
          client.send(JSON.stringify({
            type: "global",
            text: data.from + ": " + data.text
          }));
        }
      });
    }
  });
});

app.listen(3000, () => console.log('API running on port 3000'));

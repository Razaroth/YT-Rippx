const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

const dbPath = path.join(process.env.APPDATA || process.env.HOME, '.ytrippx', 'history.db');

// Ensure directory exists
const dir = path.dirname(dbPath);
if (!fs.existsSync(dir)) {
  fs.mkdirSync(dir, { recursive: true });
}

const db = new sqlite3.Database(dbPath);

// Initialize database
db.serialize(() => {
  db.run(`
    CREATE TABLE IF NOT EXISTS downloads (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      url TEXT NOT NULL,
      format TEXT NOT NULL,
      quality TEXT,
      filename TEXT,
      timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);
});

async function getDownloadHistory() {
  return new Promise((resolve, reject) => {
    db.all('SELECT * FROM downloads ORDER BY timestamp DESC LIMIT 100', (err, rows) => {
      if (err) reject(err);
      else resolve(rows || []);
    });
  });
}

async function addToHistory(download) {
  return new Promise((resolve, reject) => {
    const { url, format, quality, filename, timestamp } = download;
    db.run(
      'INSERT INTO downloads (url, format, quality, filename, timestamp) VALUES (?, ?, ?, ?, ?)',
      [url, format, quality, filename, timestamp],
      function (err) {
        if (err) reject(err);
        else resolve({ id: this.lastID });
      }
    );
  });
}

async function clearHistory() {
  return new Promise((resolve, reject) => {
    db.run('DELETE FROM downloads', (err) => {
      if (err) reject(err);
      else resolve();
    });
  });
}

module.exports = {
  getDownloadHistory,
  addToHistory,
  clearHistory,
};

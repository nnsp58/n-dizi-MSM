const express = require('express');
const { createServer } = require('http');

// Import the built app
let app;
try {
  const appModule = require('../dist/index.js');
  app = appModule.default || appModule;
} catch (err) {
  console.error('Failed to load app:', err);
  app = express();
  app.get('*', (req, res) => {
    res.status(500).json({ error: 'Server initialization failed', message: err.message });
  });
}

module.exports = app;

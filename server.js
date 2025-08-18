const express = require('express');
const helmet = require('helmet');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const path = require('path');

const app = express();

// Security middleware (unchanged)
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com", "data:"],
      scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
      scriptSrcAttr: ["'unsafe-inline'"],
      imgSrc: ["'self'", "data:"],
      connectSrc: [
        "'self'",
        "http://localhost:3000", // keep if you need local dev
        "https://takzir-backend-5915076344.europe-west4.run.app"
      ],
    },
  },
}));

app.use(compression());

const limiter = rateLimit({
  windowMs: 15*60*1000,
  max: 200,
  message: 'יותר מדי בקשות'
});
app.use(limiter);

// Serve static from dist
app.use(express.static(path.join(__dirname, 'dist'), {
  maxAge: '1d',
  etag: true
}));

// Page routes (MPA)
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'login.html'));
});
app.get('/login', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'login.html'));
});
app.get('/dashboard', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'dashboard.html'));
});
app.get('/tickets', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'tickets.html'));
});
app.get('/users', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'users.html'));
});
app.get('/import', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'import.html'));
});
app.get('/tickets/new', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'tickets.html'));
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).sendFile(path.join(__dirname, 'dist', '404.html'));
});

const PORT = process.env.FRONTEND_PORT || 3001;
app.listen(PORT, () => {
  console.log(`🎨 Frontend server running on port ${PORT}`);
  console.log(`🌐 Application URL: http://localhost:${PORT}`);
});

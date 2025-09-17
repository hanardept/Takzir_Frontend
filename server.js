const express = require('express');
const helmet = require('helmet');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const path = require('path');

const app = express();

// Security middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com", "data:"],
      scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
      scriptSrcAttr: ["'unsafe-inline'"], // This is the key fix - allows inline event handlers
      imgSrc: ["'self'", "data:"],
      connectSrc: ["'self'", "http://localhost:3000"],
    },
  },
}));


// Compression middleware
app.use(compression());

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  message: 'יותר מדי בקשות'
});

app.use(limiter);

// Serve static files
app.use(express.static(path.join(__dirname, 'public'), {
  maxAge: '1d',
  etag: true
}));

// Routes
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get('/login', (req, res) => {
  res.sendFile(path.join(__dirname, 'views', 'login.html'));
});

app.get('/dashboard', (req, res) => {
  res.sendFile(path.join(__dirname, 'views', 'dashboard.html'));
});

app.get('/tickets', (req, res) => {
  res.sendFile(path.join(__dirname, 'views', 'tickets.html'));
});

app.get('/users', (req, res) => {
  res.sendFile(path.join(__dirname, 'views', 'users.html'));
});

app.get('/import', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'import.html'));
});

// Both routes for new ticket creation
app.get('/new-ticket', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'new-ticket.html'));
});

app.get('/tickets/new', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'new-ticket.html'));
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).sendFile(path.join(__dirname, 'public', '404.html'));
});

const PORT = process.env.FRONTEND_PORT || 3001;

app.listen(PORT, () => {
  console.log(`🎨 Frontend server running on port ${PORT}`);
  console.log(`🌐 Application URL: http://localhost:${PORT}`);
  console.log('📍 Available routes:');
  console.log('   - /dashboard');
  console.log('   - /tickets');
  console.log('   - /new-ticket');
  console.log('   - /tickets/new');
  console.log('   - /users');
  console.log('   - /import');
});

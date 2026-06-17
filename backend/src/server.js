require('dotenv').config();
const express = require('express');
const bootstrap = require('./elastic/bootstrap');
const logRoutes = require('./routes/log');
const searchRoutes = require('./routes/search');
const metaRoutes = require('./routes/meta');
const statsRoutes = require('./routes/stats');
const client = require('./elastic/client');
const db = require('./mysql');

const app = express();
const PORT = process.env.PORT || 3000;
const allowedOrigins = (process.env.CORS_ORIGIN || '')
  .split(',')
  .map(origin => origin.trim())
  .filter(Boolean);

app.disable('x-powered-by');
if (process.env.TRUST_PROXY === 'true') {
  app.set('trust proxy', 1);
}

// Middleware
app.use(express.json({ limit: process.env.JSON_BODY_LIMIT || '1mb' }));

app.use((req, res, next) => {
  const origin = req.headers.origin;
  if (allowedOrigins.length === 0 || (origin && allowedOrigins.includes(origin))) {
    res.header('Access-Control-Allow-Origin', origin || '*');
  }
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, x-telemetry-key');
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});

// Routes
app.use('/', logRoutes);
app.use('/', searchRoutes);
app.use('/', metaRoutes);
app.use('/', statsRoutes);

app.get("/health", (req, res) => {
  res.json({ message: "Server is running", status: "active" });
});

app.get('/ready', async (req, res) => {
  try {
    await Promise.all([
      client.ping(),
      db.query('SELECT 1')
    ]);
    res.json({ status: 'ready' });
  } catch (error) {
    res.status(503).json({ status: 'not_ready', error: error.message });
  }
});

app.use((error, req, res, next) => {
  if (error?.type === 'entity.too.large') {
    return res.status(413).json({ error: 'Request body too large' });
  }
  if (error instanceof SyntaxError && 'body' in error) {
    return res.status(400).json({ error: 'Invalid JSON body' });
  }
  next(error);
});

function validateConfig() {
  if (process.env.REQUIRE_INTERNAL_API_KEY !== 'false' && !process.env.INTERNAL_API_KEY) {
    throw new Error('INTERNAL_API_KEY is required when REQUIRE_INTERNAL_API_KEY is enabled');
  }
}

// Start server
async function startServer() {
  validateConfig();
  await bootstrap();
  
  const server = app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
  });

  const shutdown = async (signal) => {
    console.log(`${signal} received, shutting down...`);
    server.close(async () => {
      await Promise.allSettled([
        client.close(),
        db.end()
      ]);
      process.exit(0);
    });
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
}

startServer();

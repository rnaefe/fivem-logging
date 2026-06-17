const express = require('express');
const rateLimit = require('express-rate-limit');
const { z } = require('zod');
const client = require('../elastic/client');
const db = require('../mysql');

const router = express.Router();
const INDEX_NAME = process.env.ELASTICSEARCH_INDEX || 'runtime-logs';
const REQUIRE_INGEST_API_KEY = process.env.REQUIRE_INGEST_API_KEY !== 'false';

const logLimiter = rateLimit({
  windowMs: parseInt(process.env.LOG_RATE_LIMIT_WINDOW_MS || '60000', 10),
  max: parseInt(process.env.LOG_RATE_LIMIT_MAX || '1000', 10),
  standardHeaders: true,
  legacyHeaders: false
});

const logSchema = z.object({
  event_type: z.string().min(1).optional(),
  eventType: z.string().min(1).optional(),
  type: z.string().min(1).optional(),
  event: z.string().min(1).optional(),
  category: z.string().min(1).optional(),
  server: z.object({
    id: z.string().min(1),
    name: z.string().optional()
  }),
  payload: z.record(z.string(), z.any()).optional().default({})
}).passthrough();

function getApiKey(req) {
  const bearer = req.get('authorization')?.match(/^Bearer\s+(.+)$/i)?.[1];
  return req.get('x-telemetry-key') || bearer;
}

async function verifyApiKey(apiKey, serverId) {
  if (!REQUIRE_INGEST_API_KEY) return true;
  if (!apiKey) return false;

  const [rows] = await db.execute(
    'SELECT identifier FROM servers WHERE api_key = ? AND is_active = TRUE LIMIT 1',
    [apiKey]
  );
  const server = rows[0];
  return Boolean(server && server.identifier === serverId);
}

router.post('/log', logLimiter, async (req, res) => {
  try {
    const parsed = logSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: 'Invalid log payload', details: parsed.error.flatten() });
    }

    const logEntry = parsed.data;

    // Normalize event_type from common variants
    const normalizedEventType =
      logEntry.event_type ||
      logEntry.eventType ||
      logEntry.type ||
      logEntry.event ||
      (logEntry.payload && (logEntry.payload.event_type || logEntry.payload.eventType));

    if (!normalizedEventType) {
      return res.status(400).json({ error: 'Missing event_type' });
    }

    const authorized = await verifyApiKey(getApiKey(req), logEntry.server.id);
    if (!authorized) {
      return res.status(401).json({ error: 'Invalid telemetry API key' });
    }

    // Ensure canonical field is set
    logEntry.event_type = normalizedEventType;

    // Ensure @timestamp exists
    if (!logEntry['@timestamp']) {
      logEntry['@timestamp'] = new Date().toISOString();
    }

    // Index the document
    const response = await client.index({
      index: INDEX_NAME,
      document: logEntry
    });

    res.status(201).json({
      ok: true,
      id: response._id
    });

  } catch (error) {
    console.error('Error indexing log:', error);
    res.status(500).json({ error: 'Internal Server Error', details: error.message });
  }
});

module.exports = router;

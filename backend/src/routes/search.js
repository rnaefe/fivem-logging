const express = require('express');
const { z } = require('zod');
const client = require('../elastic/client');
const requireInternalKey = require('../internalAuth');

const router = express.Router();
const INDEX_NAME = process.env.ELASTICSEARCH_INDEX || 'runtime-logs';

const querySchema = z.object({
  license: z.string().max(128).optional(),
  event_type: z.string().max(128).optional(),
  event_types: z.string().max(1000).optional(),
  category: z.string().max(128).optional(),
  categories: z.string().max(1000).optional(),
  q: z.string().max(256).optional(),
  player_name: z.string().max(128).optional(),
  server_name: z.string().max(128).optional(),
  server_id: z.string().min(1).max(128),
  isDevServer: z.enum(['true', 'false']).optional(),
  date_from: z.string().max(64).refine(value => !Number.isNaN(Date.parse(value)), 'Invalid date_from').optional(),
  date_to: z.string().max(64).refine(value => !Number.isNaN(Date.parse(value)), 'Invalid date_to').optional(),
  page: z.coerce.number().int().min(1).max(10000).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(50)
});

router.get('/search', requireInternalKey, async (req, res) => {
  try {
    const parsed = querySchema.safeParse(req.query);
    if (!parsed.success) {
      return res.status(400).json({ error: 'Invalid search query', details: parsed.error.flatten() });
    }

    const {
      license,
      event_type,
      event_types,
      category,
      categories,
      q,
      player_name,
      server_name,
      server_id,
      isDevServer,
      date_from,
      date_to,
      page,
      limit
    } = parsed.data;

    const from = (page - 1) * limit;
    const size = limit;

    const must = [];

    // Exact term filters
    if (license) {
      must.push({ term: { "player.identifiers.license": license } });
    }
    if (event_type) {
      must.push({ term: { event_type: event_type } });
    } else if (event_types) {
      const evList = event_types
        .split(',')
        .map(e => e.trim())
        .filter(Boolean);
      if (evList.length > 0) {
        must.push({
          bool: {
            should: evList.map(e => ({ term: { event_type: e } })),
            minimum_should_match: 1
          }
        });
      }
    }
    if (category) {
      must.push({ term: { category: category } });
    } else if (categories) {
      const categoryList = categories
        .split(',')
        .map(c => c.trim())
        .filter(Boolean);
      if (categoryList.length > 0) {
        must.push({
          bool: {
            should: categoryList.map(c => ({ term: { category: c } })),
            minimum_should_match: 1
          }
        });
      }
    }

    // Player name search (partial match with multiple strategies)
    if (player_name) {
      // Use bool with should to match multiple ways
      must.push({
        bool: {
          should: [
            // Exact prefix match
            {
              match_phrase_prefix: {
                "player.name": {
                  query: player_name,
                  max_expansions: 50
                }
              }
            },
            // Fuzzy match
            {
              match: {
                "player.name": {
                  query: player_name,
                  fuzziness: "AUTO",
                  operator: "and"
                }
              }
            },
            // Contains (n-gram simulation with match)
            {
              match: {
                "player.name": {
                  query: player_name,
                  operator: "or"
                }
              }
            }
          ],
          minimum_should_match: 1
        }
      });
    }

    // Server ID filter (exact)
    if (server_id) {
      must.push({
        bool: {
          should: [
            { term: { "server.id": server_id } },
            { term: { "server.id.keyword": server_id } },
            { match_phrase: { "server.id": server_id } }
          ],
          minimum_should_match: 1
        }
      });
    }

    // Server name search (keyword field, use wildcard for partial match)
    if (server_name) {
      must.push({
        wildcard: {
          "server.name": {
            value: `*${server_name}*`,
            case_insensitive: true
          }
        }
      });
    }

    // Dev server filter
    if (isDevServer !== undefined && isDevServer !== '') {
      must.push({ term: { isDevServer: isDevServer === 'true' } });
    }

    // Date range filter
    if (date_from || date_to) {
      const rangeQuery = { "@timestamp": {} };
      if (date_from) {
        rangeQuery["@timestamp"].gte = new Date(date_from).toISOString();
      }
      if (date_to) {
        rangeQuery["@timestamp"].lte = new Date(date_to).toISOString();
      }
      must.push({ range: rangeQuery });
    }

    // Full-text search across multiple fields with fuzziness
    if (q) {
      must.push({
        multi_match: {
          query: q,
          fields: [
            "player.name",
            "server.name",
            "event_type",
            "payload.message",
            "payload.reason",
            "payload.action",
            "payload.resourceName"
          ],
          type: "best_fields",
          operator: "or",
          fuzziness: "AUTO"
        }
      });
    }

    const query = must.length > 0 ? { bool: { must } } : { match_all: {} };

    const result = await client.search({
      index: INDEX_NAME,
      query: query,
      sort: [
        { "@timestamp": { order: "desc" } }
      ],
      from: from,
      size: size
    });

    const hits = result.hits.hits.map(hit => ({
      _id: hit._id,
      _source: hit._source
    }));

    res.json({
      items: hits,
      total: result.hits.total.value,
      page,
      limit
    });

  } catch (error) {
    console.error('Error searching logs:', error);
    res.status(500).json({ error: 'Internal Server Error', details: error.message });
  }
});

module.exports = router;

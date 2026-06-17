const express = require('express');
const { z } = require('zod');
const client = require('../elastic/client');
const requireInternalKey = require('../internalAuth');

const router = express.Router();
const INDEX_NAME = process.env.ELASTICSEARCH_INDEX || 'runtime-logs';

const statsQuerySchema = z.object({
  days: z.coerce.number().int().min(1).max(365).default(7),
  limit: z.coerce.number().int().min(1).max(100).default(10),
  server_id: z.string().min(1).max(128)
});

function parseStatsQuery(req, res) {
  const parsed = statsQuerySchema.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({ error: 'Invalid stats query', details: parsed.error.flatten() });
    return null;
  }
  return parsed.data;
}

// Get top weapons (aggregation on combat events)
router.get('/stats/weapons', requireInternalKey, async (req, res) => {
  try {
    const parsed = parseStatsQuery(req, res);
    if (!parsed) return;
    const { days, limit, server_id } = parsed;

    const must = [
      { term: { 'category.keyword': 'combat' } },
      {
        bool: {
          should: [
            { term: { 'server.id.keyword': server_id } },
            { term: { 'server.id': server_id } },
            { match_phrase: { 'server.id': server_id } }
          ],
          minimum_should_match: 1
        }
      },
      {
        range: {
          '@timestamp': {
            gte: `now-${days}d/d`,
            lte: 'now/d'
          }
        }
      }
    ];

    const result = await client.search({
      index: INDEX_NAME,
      size: 0, // We only want aggregations
      query: {
        bool: { must }
      },
      aggs: {
        top_weapons: {
          terms: {
            field: 'payload.weaponName.keyword',
            size: limit,
            order: { _count: 'desc' }
          },
          aggs: {
            kills: {
              filter: {
                term: { 'event_type.keyword': 'player_killed' }
              }
            },
            deaths: {
              filter: {
                term: { 'event_type.keyword': 'player_died' }
              }
            }
          }
        },
        total_combat_events: {
          value_count: {
            field: 'event_type.keyword'
          }
        }
      }
    });

    const weapons = result.aggregations.top_weapons.buckets.map(bucket => ({
      name: bucket.key,
      total: bucket.doc_count,
      kills: bucket.kills.doc_count,
      deaths: bucket.deaths.doc_count
    }));

    res.json({
      weapons,
      total: result.aggregations.total_combat_events.value,
      period: `${days} days`
    });

  } catch (error) {
    console.error('Error fetching weapon stats:', error);
    res.status(500).json({ error: 'Internal Server Error', details: error.message });
  }
});

// Get top vehicles (aggregation on vehicle events)
router.get('/stats/vehicles', requireInternalKey, async (req, res) => {
  try {
    const parsed = parseStatsQuery(req, res);
    if (!parsed) return;
    const { days, limit, server_id } = parsed;

    const must = [
      { term: { 'category.keyword': 'vehicle' } },
      {
        bool: {
          should: [
            { term: { 'server.id.keyword': server_id } },
            { term: { 'server.id': server_id } },
            { match_phrase: { 'server.id': server_id } }
          ],
          minimum_should_match: 1
        }
      },
      {
        range: {
          '@timestamp': {
            gte: `now-${days}d/d`,
            lte: 'now/d'
          }
        }
      }
    ];

    const result = await client.search({
      index: INDEX_NAME,
      size: 0,
      query: {
        bool: { must }
      },
      aggs: {
        top_vehicles: {
          terms: {
            field: 'payload.vehicleName.keyword',
            size: limit,
            order: { _count: 'desc' }
          }
        },
        total_vehicle_events: {
          value_count: {
            field: 'event_type.keyword'
          }
        }
      }
    });

    const vehicles = result.aggregations.top_vehicles.buckets.map(bucket => ({
      name: bucket.key,
      count: bucket.doc_count
    }));

    res.json({
      vehicles,
      total: result.aggregations.total_vehicle_events.value,
      period: `${days} days`
    });

  } catch (error) {
    console.error('Error fetching vehicle stats:', error);
    res.status(500).json({ error: 'Internal Server Error', details: error.message });
  }
});

// General stats endpoint
router.get('/stats', requireInternalKey, async (req, res) => {
  try {
    const parsed = parseStatsQuery(req, res);
    if (!parsed) return;
    const { days, server_id } = parsed;

    const must = [
      {
        bool: {
          should: [
            { term: { 'server.id.keyword': server_id } },
            { term: { 'server.id': server_id } },
            { match_phrase: { 'server.id': server_id } }
          ],
          minimum_should_match: 1
        }
      },
      {
        range: {
          '@timestamp': {
            gte: `now-${days}d/d`,
            lte: 'now/d'
          }
        }
      }
    ];

    const result = await client.search({
      index: INDEX_NAME,
      size: 0,
      query: {
        bool: { must }
      },
      aggs: {
        total_logs: {
          value_count: { field: '@timestamp' }
        },
        by_category: {
          terms: { field: 'category.keyword', size: 20 }
        },
        by_event_type: {
          // event_type is a keyword field; use it directly
          terms: { field: 'event_type', size: 50 }
        },
        logs_per_day: {
          date_histogram: {
            field: '@timestamp',
            calendar_interval: 'day'
          }
        },
        unique_players: {
          cardinality: {
            field: 'player.identifiers.license'
          }
        }
      }
    });

    // Today's logs count (with server filter)
    const todayMust = [
      {
        bool: {
          should: [
            { term: { 'server.id.keyword': server_id } },
            { term: { 'server.id': server_id } },
            { match_phrase: { 'server.id': server_id } }
          ],
          minimum_should_match: 1
        }
      },
      {
        range: {
          '@timestamp': {
            gte: 'now/d',
            lte: 'now'
          }
        }
      }
    ];

    const todayResult = await client.count({
      index: INDEX_NAME,
      query: {
        bool: { must: todayMust }
      }
    });

    res.json({
      total: result.aggregations.total_logs.value,
      today: todayResult.count,
      uniquePlayers: result.aggregations.unique_players.value,
      byCategory: result.aggregations.by_category.buckets.map(b => ({
        category: b.key,
        count: b.doc_count
      })),
      byEventType: result.aggregations.by_event_type.buckets.map(b => ({
        eventType: b.key,
        count: b.doc_count
      })),
      dailyTrend: result.aggregations.logs_per_day.buckets.map(b => ({
        date: b.key_as_string,
        count: b.doc_count
      })),
      period: `${days} days`
    });

  } catch (error) {
    console.error('Error fetching stats:', error);
    res.status(500).json({ error: 'Internal Server Error', details: error.message });
  }
});

module.exports = router;

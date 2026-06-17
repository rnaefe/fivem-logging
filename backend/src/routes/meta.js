const express = require('express');
const { z } = require('zod');
const client = require('../elastic/client');
const requireInternalKey = require('../internalAuth');

const router = express.Router();
const INDEX_NAME = process.env.ELASTICSEARCH_INDEX || 'runtime-logs';

const metaQuerySchema = z.object({
  size: z.coerce.number().int().min(1).max(1000).default(200)
});

// Return distinct categories and event_types from ES
router.get('/meta/terms', requireInternalKey, async (req, res) => {
  try {
    const parsed = metaQuerySchema.safeParse(req.query);
    if (!parsed.success) {
      return res.status(400).json({ error: 'Invalid meta query', details: parsed.error.flatten() });
    }
    const aggSize = parsed.data.size;

    const result = await client.search({
      index: INDEX_NAME,
      size: 0,
      aggs: {
        categories: {
          terms: { field: 'category.keyword', size: aggSize }
        },
        event_types: {
          // Primary aggregation on event_type (keyword field)
          terms: { field: 'event_type', size: aggSize }
        },
        event_types_keyword: {
          // Fallback if index was created before mapping change and event_type.keyword exists
          terms: { field: 'event_type.keyword', size: aggSize, missing: '__missing__' }
        }
      }
    });

    const categories = (result.aggregations?.categories?.buckets || []).map(b => b.key);
    const eventTypesPrimary = (result.aggregations?.event_types?.buckets || []).map(b => b.key);
    const eventTypesFallback = (result.aggregations?.event_types_keyword?.buckets || [])
      .map(b => b.key)
      .filter(k => k && k !== '__missing__');

    // Merge unique event types from both aggs
    const eventTypesSet = new Set([...eventTypesPrimary, ...eventTypesFallback]);
    const eventTypes = Array.from(eventTypesSet);

    res.json({ categories, eventTypes });
  } catch (error) {
    console.error('Error fetching meta terms:', error);
    res.status(500).json({ error: 'Internal Server Error', details: error.message });
  }
});

module.exports = router;

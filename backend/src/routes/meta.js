const express = require('express');
const client = require('../elastic/client');

const router = express.Router();
const INDEX_NAME = 'fivem-logs';

// Return distinct categories and event_types from ES
router.get('/meta/terms', async (req, res) => {
  try {
    const { size = 200 } = req.query;
    const aggSize = parseInt(size) || 200;

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


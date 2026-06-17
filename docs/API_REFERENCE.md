# API Reference

The backend API is intentionally small. It accepts JSON events, exposes searchable history, and asks Elasticsearch to do the heavy analytical work.

Default index: `runtime-logs`, configurable with `ELASTICSEARCH_INDEX`.

## Ingest

### `POST /log`

Indexes a telemetry event.

The route accepts dynamic JSON, but it requires an event type. It normalizes common variants into the canonical `event_type` field:

- `event_type`
- `eventType`
- `type`
- `event`
- `payload.event_type`
- `payload.eventType`

If `@timestamp` is missing, the backend adds the current server timestamp.

```http
POST /log
Content-Type: application/json
x-telemetry-key: telemetry_...
```

```json
{
  "event_type": "job_completed",
  "category": "worker",
  "environment": "production",
  "server": {
    "name": "Payments Worker",
    "id": "payments-worker-1"
  },
  "payload": {
    "duration_ms": 84,
    "queue": "billing"
  }
}
```

The key can also be sent as `Authorization: Bearer telemetry_...`. The backend checks the key against active MySQL `servers` records and rejects logs where the key does not belong to the emitted `server.id`.

Success:

```json
{
  "ok": true,
  "id": "elastic_document_id"
}
```

Errors:

- `400` when the payload is malformed
- `400` when no event type can be resolved
- `401` when the telemetry API key is missing or invalid
- `429` when the `/log` rate limit is exceeded
- `500` when Elasticsearch indexing fails

## Search

### `GET /search`

Returns paginated log documents sorted newest first.

This is a backend-internal endpoint. Production callers should go through dashboard API routes, which enforce MySQL access checks and attach `x-internal-key`.

The backend builds Elasticsearch Query DSL from request parameters. Exact filters stay exact, player-name search gets prefix/fuzzy matching, and broad text search is limited to known useful fields instead of running an unbounded query over everything.

Parameters:

| Name | Type | Notes |
| --- | --- | --- |
| `server_id` | string | Matches `server.id`; dashboard proxy forces this from MySQL server identity. |
| `page` | integer | Defaults to `1`. |
| `limit` | integer | Defaults to `50`. |
| `license` | string | Exact player license filter. |
| `event_type` | string | Exact single event type. |
| `event_types` | string | Comma-separated event types. |
| `category` | string | Exact single category. |
| `categories` | string | Comma-separated categories. |
| `q` | string | Full-text search across selected player, server, event, and payload fields. |
| `player_name` | string | Prefix/fuzzy player-name search. |
| `server_name` | string | Case-insensitive wildcard match. |
| `isDevServer` | boolean | `true` or `false`. |
| `date_from` | date/string | Converted to ISO and used as `gte`. |
| `date_to` | date/string | Converted to ISO and used as `lte`. |

Example:

```http
GET /search?server_id=payments-worker-1&page=1&limit=25&categories=worker&q=billing
```

Response:

```json
{
  "items": [
    {
      "_id": "elastic_document_id",
      "_source": {
        "@timestamp": "2026-01-01T12:00:00.000Z",
        "event_type": "job_completed",
        "category": "worker"
      }
    }
  ],
  "total": 1,
  "page": 1,
  "limit": 25
}
```

## Stats

Stats endpoints require `server_id` and `x-internal-key`. They run Elasticsearch aggregations with `size: 0` where possible, so the app server receives summaries instead of raw log pages.

### `GET /stats`

General activity summary.

Parameters:

| Name | Type | Notes |
| --- | --- | --- |
| `server_id` | string | Required. |
| `days` | integer | Defaults to `7`. |

Returns:

- total logs
- today's log count
- unique players by license cardinality
- counts by category
- counts by event type
- daily trend buckets

### `GET /stats/weapons`

Combat weapon aggregation.

Parameters:

| Name | Type | Notes |
| --- | --- | --- |
| `server_id` | string | Required. |
| `days` | integer | Defaults to `7`. |
| `limit` | integer | Defaults to `10`. |

Returns top `payload.weaponName.keyword` buckets, with nested kill/death filters for `player_killed` and `player_died`.

### `GET /stats/vehicles`

Vehicle aggregation.

Parameters:

| Name | Type | Notes |
| --- | --- | --- |
| `server_id` | string | Required. |
| `days` | integer | Defaults to `7`. |
| `limit` | integer | Defaults to `10`. |

Returns top `payload.vehicleName.keyword` buckets.

## Metadata

### `GET /meta/terms`

Returns distinct categories and event types discovered from indexed logs.

This endpoint requires `x-internal-key` and is normally called by the dashboard metadata sync route.

Parameters:

| Name | Type | Notes |
| --- | --- | --- |
| `size` | integer | Aggregation bucket size, defaults to `200`. |

Response:

```json
{
  "categories": ["inventory", "player", "txadmin"],
  "eventTypes": ["item_swapped", "player_joining", "tx_banned"]
}
```

The route merges primary `event_type` aggregation results with an `event_type.keyword` fallback for older mappings.

## Health

### `GET /health`

Liveness check for the Node service.

```json
{
  "message": "Server is running",
  "status": "active"
}
```

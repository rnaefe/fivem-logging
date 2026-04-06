# API Reference

The backend exposes a lightweight REST API mapping to Elasticsearch indices. 

The provided Lua wrapper script (`fivem-logging.lua`) interacts with the `/log` endpoint natively. Next.js proxies traffic to `/search`.

---

## Ingest Endpoints

### 1. Ingest Log

**Endpoint:** `POST /log`

Submits a new log entry. The backend will automatically add a `@timestamp` field if one is not provided.

**Content-Type:** `application/json`

**Request Body Example:**

```json
{
  "event_type": "item_swapped",
  "category": "inventory",
  "isDevServer": false,
  "server": {
    "name": "My FiveM Server",
    "id": "sv_123"
  },
  "payload": {
    "action": "move",
    "source": 1,
    "count": 5
  },
  "player": {
    "id": 1,
    "name": "PlayerName",
    "identifiers": {
      "license": "license:abc123def"
    }
  }
}
```

**Success Response:**
`HTTP 201 Created`

```json
{
  "ok": true,
  "id": "elastic_document_id"
}
```

---

## Query Endpoints

### 1. Search Time-Series Logs

**Endpoint:** `GET /search`

Queries historical logs formatted for the dashboard. The dashboard automatically appends required parameters based on user permissions.

**Parameters:**
- `server_id` (String, required): The core server identifier.
- `page` (Int, optional): Pagination index, default `1`.
- `limit` (Int, optional): Elements per query, default `50`.
- `query` (String, optional): Full-text search string.
- `categories` (String, optional): Comma-separated list of log categories to filter.
- `event_types` (String, optional): Comma-separated list of exact events to filter.

**Example Request:**
```http
GET /search?server_id=sv_123&page=1&limit=25&categories=combat
```

### 2. Analytical Stat Aggregation

**Endpoint:** `GET /stats/weapons` and `GET /stats/vehicles`

Leverages Elasticsearch's bucket aggregations to count common terms across the entire historical dataset matching the server.

**Parameters:**
- `server_id` (String, required)
- `timeRange` (String, optional): Example `24h`, `7d`, `30d`.

**Response (Weapons Example):**

```json
{
  "data": [
    { "key": "WEAPON_PISTOL", "doc_count": 142 },
    { "key": "WEAPON_CARBINERIFLE", "doc_count": 35 }
  ]
}
```

---

## System Endpoints

### 1. Metadata Fields

**Endpoint:** `GET /meta/list`

Returns a list of all distinct `categories` and `event_types` currently existing in the Elasticsearch database, allowing the Dashboard to dynamically populate dropdowns.

### 2. Health

**Endpoint:** `GET /health`

Quick ping to check if the Node service is alive.

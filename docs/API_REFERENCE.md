# API Reference

The backend exposes a highly optimized RESTful Application Programming Interface (API) to read and write logs. 

While the provided Lua wrapper script (`fivem-logging.lua`) interacts with these endpoints natively, server administrators can write custom integrations using the endpoints documented below.

---

## Authentication

Both major ingestion endpoints and proxied query endpoints require the `Authorization` header utilizing a Bearer Token setup. The token used is the `api_key` assigned to the specific server inside the MySQL `servers` table.

```http
Authorization: Bearer <API_KEY>
```

---

## Ingest Endpoints

### 1. Ingest Log Batch

**Endpoint:** `POST /log/batch`

Use this endpoint to submit an array of logs in one singular network transaction. This is the optimal route to eliminate network jitter causing queue bottlenecks.

**Request Body:**

```json
{
  "server_id": "rp_server_1",
  "logs": [
    {
      "event_type": "player_killed",
      "category": "combat",
      "message": "Player A shot Player B",
      "player_id": 12,
      "player_name": "Player A",
      "identifier": "license:abc123def",
      "metadata": {
        "weapon": "WEAPON_PISTOL",
        "distance": 1.2
      }
    }
  ]
}
```

**Success Response:**
`HTTP 200 OK`

```json
{
  "success": true,
  "count": 1
}
```

### 2. Ingest Single Log

**Endpoint:** `POST /log`

A legacy wrapper around the batching logic for immediate ingestion of critical single events. Use sparsely compared to the `batch` endpoint.

**Request Body:**
Expects the exact inner block of the `logs` array object detailed in `POST /log/batch`.

---

## Query Endpoints

### 1. Search Time-Series Logs

**Endpoint:** `GET /search`

Facilitates the retrieval of historical logs indexed in Elasticsearch. This is generally interfaced by the Next.js Dashboard.

**Parameters:**
- `server_id` (String, required): The internal identifier.
- `page` (Int, optional): Pagination index, default `1`.
- `limit` (Int, optional): Elements per query, default `50`.
- `query` (String, optional): Full-text search term targeting message / metadata strings.
- `categories` (String, optional): Comma-separated list of log categories.
- `event_types` (String, optional): Comma-separated list of event identifiers.

**Example Request:**
```http
GET /search?server_id=rp_server_1&page=1&limit=25&categories=combat
Authorization: Bearer <API_KEY>
```

### 2. Analytical Stat Aggregation

**Endpoint:** `POST /stats/weapons` (or `/stats/vehicles`)

Leverages Elasticsearch's internal bucket aggregation mechanics to crunch thousands of past variables without pulling exact documents into Node.js.

**Request Body:**

```json
{
  "server_id": "rp_server_1",
  "timeRange": "24h" 
}
```

**Response:**

```json
{
  "data": [
    { "key": "WEAPON_PISTOL", "doc_count": 142 },
    { "key": "WEAPON_CARBINERIFLE", "doc_count": 35 }
  ]
}
```

---

## Status Codes

The API operates utilizing standard REST HTTP Response codes:

- `200 OK`: Request succeeded.
- `400 Bad Request`: General payload formatting error or missing core parameters.
- `401 Unauthorized`: API key is invalid, missing, or missing standard Bearer declaration.
- `500 Server Error`: Internal Elasticsearch ingestion refusal or MySQL failure.

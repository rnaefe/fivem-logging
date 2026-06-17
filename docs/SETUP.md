# Setup

This stack is small enough to run on one VPS, but it is not pretending to be one process. Elasticsearch stores logs, MySQL stores control-plane state, the backend handles ingest/search, and the dashboard handles operators.

## Requirements

- Node.js `22+`
- MySQL `8+` or compatible MariaDB
- Elasticsearch `9.x`
- Discord Developer Application for OAuth login
- PM2, systemd, Docker, or another process manager for production

## 1. Start Elasticsearch

Install Elasticsearch for your host, start it, then verify the node:

```bash
curl http://localhost:9200/
```

The backend creates the configured Elasticsearch index on startup when it is missing. The documents are generic runtime events. The mapping pins the fields the dashboard relies on and leaves `payload` dynamic for event-specific data.

## 2. Create MySQL State

From the repository root:

```bash
mysql -u root -p < backend/database/schema.sql
```

The schema creates the default database plus tables for sources, Discord users, sessions, log channels, user-source access, admins, and optional stat rollups.

## 3. Configure The Backend

```bash
cd backend
npm install
cp env.example .env
```

Set the Elasticsearch target:

```text
PORT=3000
ELASTICSEARCH_NODE=http://localhost:9200
ELASTICSEARCH_INDEX=runtime-logs
```

Run it:

```bash
npm start
```

Production should run this under a process manager and keep the ingest port private unless you add an explicit public auth layer.

## 4. Create A Discord OAuth App

In the Discord Developer Portal:

1. Create an application.
2. Open OAuth2 settings.
3. Add the dashboard callback URL.

Development callback:

```text
http://localhost:3001/api/auth/callback
```

Production callback:

```text
https://logs.example.com/api/auth/callback
```

Required scopes are requested by the app code:

- `identify`
- `email`
- `guilds`
- `guilds.members.read`

## 5. Configure The Dashboard

```bash
cd dashboard
npm install
cp env.example .env.local
```

Set the dashboard environment:

```text
MYSQL_HOST=localhost
MYSQL_USER=your_user
MYSQL_PASSWORD=your_pass
MYSQL_DATABASE=elastic_telemetry

JWT_SECRET=replace_with_openssl_rand_hex_32

DISCORD_CLIENT_ID=your_discord_client_id
DISCORD_CLIENT_SECRET=your_discord_client_secret
DISCORD_REDIRECT_URI=http://localhost:3001/api/auth/callback

NEXT_PUBLIC_API_URL=http://localhost:3000
```

Build and run:

```bash
npm run build
npm start -- -p 3001
```

## 6. Register A Source

The dashboard and proxy routes resolve telemetry sources from MySQL. Create one that matches the `server.id` or source ID emitted in log documents:

```sql
INSERT INTO servers (identifier, name, discord_guild_id, api_key)
VALUES (
  'payments-worker-1',
  'Payments Worker',
  '123456789012345678',
  'telemetry_3d31edce-c1a9-4ba1-837c-f905232c4a1e'
);
```

Grant your dashboard user access:

```sql
INSERT INTO user_server_access (user_id, server_id)
VALUES (1, 1);
```

Or make yourself a global admin:

```sql
UPDATE users SET is_admin = TRUE WHERE discord_id = 'your_discord_user_id';
```

## 7. Send Runtime Events

Any runtime that can send HTTP JSON can emit logs:

```bash
curl -X POST http://your-backend-host:3000/log \
  -H 'Content-Type: application/json' \
  -d '{
    "event_type": "job_completed",
    "category": "worker",
    "server": { "id": "payments-worker-1", "name": "Payments Worker" },
    "payload": { "duration_ms": 84, "queue": "billing" }
  }'
```

Make sure the emitted `server.id` matches the MySQL `servers.identifier`, because the dashboard forces searches through that identifier.

## Production Notes

- Keep Elasticsearch off the public internet.
- Keep backend ingest private or protected by firewall/reverse-proxy rules.
- The schema has `servers.api_key`, but current `/log` handling does not enforce it yet.
- Use HTTPS for the dashboard and OAuth callback.
- Rotate `JWT_SECRET` carefully; existing sessions become invalid.
- Put backend and dashboard under PM2, systemd, Docker, or another supervisor.

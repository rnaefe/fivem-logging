# Database Setup

MySQL is the control-plane database. Logs do not live here; Elasticsearch handles the high-volume event stream. MySQL stores the things that need relational guarantees: users, sessions, registered servers, channel configuration, and access mappings.

## Quick Setup

From the repository root:

```bash
mysql -u root -p < backend/database/schema.sql
```

Or manually:

```sql
CREATE DATABASE elastic_telemetry;
USE elastic_telemetry;
SOURCE backend/database/schema.sql;
```

## Tables

| Table | Purpose |
| --- | --- |
| `servers` | Registered telemetry sources. `identifier` should match the emitter's server ID, and `discord_guild_id` is used for access sync. |
| `users` | Discord-authenticated dashboard users. |
| `sessions` | JWT session records plus Discord access/refresh token storage. |
| `log_channels` | Dashboard channel definitions, including event-type groups, colors, and icons. |
| `user_server_access` | Cached user-to-server access. |
| `server_admins` | Per-server admin/moderator/viewer assignments by Discord ID. |
| `weapon_stats` | Optional daily weapon rollups. Runtime stats currently come from Elasticsearch aggregations. |
| `vehicle_stats` | Optional daily vehicle rollups. Runtime stats currently come from Elasticsearch aggregations. |

## Server Registration

Create a server row before expecting dashboard search to line up cleanly with logs:

```sql
INSERT INTO servers (name, identifier, discord_guild_id, api_key)
VALUES ('Payments Worker', 'payments-worker-1', '123456789012345678', 'telemetry_3d31edce-c1a9-4ba1-837c-f905232c4a1e');
```

The `identifier` should match the `server.id` or source ID emitted in log documents.

## Access

Grant a user access to a server:

```sql
INSERT INTO user_server_access (user_id, server_id)
VALUES (1, 1)
ON DUPLICATE KEY UPDATE last_verified = NOW();
```

Grant server-level admin rights:

```sql
INSERT INTO server_admins (server_id, discord_id, permission_level)
VALUES (1, '123456789012345678', 'admin');
```

Make a global dashboard admin:

```sql
UPDATE users
SET is_admin = TRUE
WHERE discord_id = '123456789012345678';
```

## Ingest API Keys

`POST /log` validates `x-telemetry-key` or `Authorization: Bearer ...` against `servers.api_key` and requires the key to belong to the emitted `server.id`. Keep the ingest service private anyway; the key is an application gate, not a substitute for network controls.

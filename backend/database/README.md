# Database Setup

## Requirements

- MySQL 8.0+ or MariaDB 10.5+

## Quick Setup

1. Create the database and run the schema:

```bash
mysql -u root -p < schema.sql
```

2. Or manually:

```sql
CREATE DATABASE fivem_logs;
USE fivem_logs;
-- Then copy/paste contents of schema.sql
```

## Tables Overview

### `servers`
FiveM servers registered in the system. Each server has:
- Unique identifier
- Discord Guild ID (for role-based access)
- API key for authentication

### `users`
Discord-authenticated users with:
- Discord ID, username, avatar
- Admin flag

### `sessions`
JWT session tokens for authenticated users.

### `log_channels`
Categories/channels for organizing logs:
- Name and slug
- Event types that belong to this channel
- Color and icon for UI

### `role_permissions`
Discord role-based access control:
- Which roles can view which channels
- Permissions: view, search, export

### `user_server_access`
Cache of user's Discord roles per server.

### `server_admins`
Users who can manage server settings (admin/moderator/viewer levels).

### `weapon_stats` & `vehicle_stats`
Aggregated stats for dashboard:
- Daily counts per weapon/vehicle
- Kill counts for weapons

## Sample Data

The schema includes sample data for testing:
- 1 test server
- 5 default log channels (Player Activity, Chat, Inventory, Admin Actions, Resources)

## Discord Setup

1. Create a Discord Application at https://discord.com/developers/applications
2. Add OAuth2 redirect URL: `http://localhost:3001/api/auth/callback`
3. Enable required scopes: `identify`, `email`, `guilds`, `guilds.members.read`
4. Copy Client ID and Client Secret to `.env`

## Role-based Access

To restrict a channel to specific roles:

```sql
-- Allow only role ID 123456789 to view Admin Actions channel
INSERT INTO role_permissions (server_id, discord_role_id, channel_id, can_view, can_search)
SELECT 1, '123456789', id, TRUE, TRUE FROM log_channels WHERE slug = 'admin-actions';
```

If no permissions are set for a channel, it's visible to all authenticated users.


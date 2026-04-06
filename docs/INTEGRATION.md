# FiveM Integration Guide

This document explains how to properly embed the Logging System's resource file into your FiveM server stack. This is the mechanism responsible for intercepting game events, capturing localized metadata, and streaming it securely to your backend ingestion service.

---

## 1. Resource Placement

The main ingestion script for the physical FiveM Game Server is located at `backend/fivem-logging.lua`.

1. Locate the `fivem-logging.lua` script.
2. In your main FiveM server directory, create a new folder under `resources/` named `fivem-logger` (or whichever name you prefer).
3. Move `fivem-logging.lua` into this new directory.
4. Create an `fxmanifest.lua` file inside the `fivem-logger` directory to register it as a server script:

```lua
fx_version 'cerulean'
game 'gta5'

author 'FiveM Log Management System'
description 'Native asynchronous logging event transmitter'

server_script 'fivem-logging.lua'
```

---

## 2. Server Configuration parameters

The logger reads directly from global FiveM Convars to maintain isolation from specific MySQL iterations.

1. Open your `server.cfg` file.
2. Insert the following lines near the top, making sure you replace the placeholders with your actual configured variables:

```cfg
# FiveM Logging System Endpoint
set logs_api_url "http://<YOUR_BACKEND_IP>:3000"

# Secret Key matching the backend `servers` database table
set logs_api_key "SECURE_RANDOM_KEY_HERE"

# Identifier matching the backend `servers` database table
set logs_server_id "rp_server_1"
```

3. Ensure the resource starts automatically when the server boots:

```cfg
ensure fivem-logger
```

---

## 3. Creating Custom Log Implementations

The provided script hooks natively into basic events such as player joining, dropping, and chat messaging. However, you will likely need to embed exports into arbitrary business logic (such as completing drug runs, transferring cash, or purchasing properties).

You can dispatch logs natively from any other FiveM resource using standard Lua `exports`.

### The Core Export

**`exports['fivem-logger']:sendLog(event_type, category, message, metadata)`**

- `event_type` (String): A strict, snake_case descriptor of the action (e.g. `robbery_started`, `vehicle_bought`).
- `category` (String): The master categorization used for filtering in the dashboard (e.g. `economy`, `criminal`).
- `message` (String): Human-readable sentence explaining the event.
- `metadata` (Table): Optional. Any serialized JSON data that adds context (Coordinates, weapon hashes, target identifiers).

### Implementation Examples

**Example A: Logging an Economy Transaction (eX_Core)**

```lua
-- Runs inside your server-side cash handler
RegisterNetEvent('core:TransferMoney', function(targetId, amount)
    local src = source
    local senderName = GetPlayerName(src)
    local receiverName = GetPlayerName(targetId)

    -- Deduct money logic here ...

    exports['fivem-logger']:sendLog(
        "cash_transfer",
        "economy",
        string.format("%s transferred $%d to %s", senderName, amount, receiverName),
        {
            sender_id = src,
            receiver_id = targetId,
            amount_transferred = amount
        }
    )
end)
```

**Example B: Logging a Staff Action (TxAdmin)**

The core script already comes packaged with TxAdmin native hooks, but if you have a custom `/ban` command written in Lua, you can catch it easily:

```lua
RegisterCommand('customban', function(source, args, rawCommand)
    local target = tonumber(args[1])
    local reason = table.concat(args, " ", 2)

    -- Ban Logic ...

    exports['fivem-logger']:sendLog(
        "player_banned",
        "staff",
        string.format("%s banned %s completely. Reason: %s", GetPlayerName(source), GetPlayerName(target), reason),
        {
            admin_id = source,
            punished_target = target,
            ban_duration = "permanent",
            reason = reason
        }
    )
end, true)
```

---

## 4. Troubleshooting Network Jitter

The script implements batch buffering. It queues logs inside memory and fires them dynamically in arrays over HTTP to ensure a locked `PerformHttpRequest` thread doesn't stutter other callbacks. 

If you notice logs arriving at the dashboard in heavy, delayed spikes:
1. Ensure your Node.js ingest backend is physically located close to the FiveM game server VPS (ideally the exact same machine or datacenter).
2. Check the `fivem-logging.lua` logic for the flush timer loop and consider lowering the queue threshold if necessary.

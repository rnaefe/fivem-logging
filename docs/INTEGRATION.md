# FiveM Integration Guide

This document explains how to properly embed the `fivem-logging.lua` resource file into your FiveM server stack. This is the mechanism responsible for intercepting game events, capturing localized metadata, and streaming it securely to your backend ingestion service.

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

Open `fivem-logging.lua` and evaluate the variables at the top of the file:

```lua
-- Backend Configuration
local BACKEND_URL = "http://localhost:3000/log"
local IS_DEV_SERVER = GetConvar('isDevServer', 'false') == 'true'
local SERVER_NAME = GetConvar("sv_hostname", "unknown")
local SERVER_ID = GetConvar("sv_projectName", "unknown")

local apikey = "fivem_3d31edce-c1a9-4ba1-837c-f905232c4a1e"
```

1. Change `BACKEND_URL` to point to the IP and port where your Node.js ingest backend is listening. If running on the same machine, `http://localhost:3000/log` is correct.
2. Ensure you have `sv_hostname` and `sv_projectName` set in your `server.cfg` as these are used to stamp incoming logs with your server's identity.

Ensure the resource starts automatically when the server boots:

```cfg
ensure fivem-logger
```

---

## 3. Creating Custom Log Implementations

The provided script hooks natively into basic events such as player joining, dropping, and txAdmin messaging. It also includes ox_inventory transaction hooks.

You can dispatch logs natively from any other FiveM resource using standard Lua `exports`. Ensure that the export target points to the literal name of the resource folder if you renamed it (e. g., `exports['fivem-logger']:...`), but the default examples below assume the folder name is `fivem-logging` to match standard syntax. Note: if you placed `fivem-logging.lua` in a folder named `fivem-logger`, the export array key is `fivem-logger`.

### Legacy Messaging Export

**`exports['fivem-logger']:sendLogThroughApi(channelId, message)`**

Use this to funnel simple text strings.

### Weapon and Vehicle Logging Exports

The lua file directly exposes automated handling for vehicles and weapons so that you don't need to craft custom payloads for standard features.

**`exports['fivem-logger']:logWeaponUsage(weaponName, isKill)`**
```lua
AddEventHandler('weapons:onPlayerFired', function(weaponName)
    exports['fivem-logger']:logWeaponUsage(weaponName, false)
end)
```

**`exports['fivem-logger']:logVehicleSpawn(vehicleName)`**
```lua
AddEventHandler('esx:spawnVehicle', function(model, coords, heading)
    exports['fivem-logger']:logVehicleSpawn(model)
end)
```

### Adding New Custom Implementations

To add completely custom events (like drug sales or banking), simply define a new `AddEventHandler` anywhere inside `fivem-logging.lua` or duplicate the `sendLogToBackend` helper inside other resources directly to post arbitrary JSON to your backend.

Example hooking inside `fivem-logging.lua`:
```lua
RegisterNetEvent('core:TransferMoney', function(targetId, amount)
    local src = source
    local senderInfo = getPlayerInfo(src)
    local receiverInfo = getPlayerInfo(targetId)

    sendLogToBackend("cash_transfer", "economy", {
        amount_transferred = amount,
        sender = senderInfo,
        receiver = receiverInfo
    }, { player = senderInfo })
end)
```

---

## 4. Troubleshooting Network Jitter

The script utilizes standard `PerformHttpRequest`. The function is natively asynchronous under the hood of FiveM so it shouldn't stutter the main thread. However, under intense load (1000s of players), if your backend is physically distanced from the game server, TCP delays can mount.

Make sure your backend Node.js server sits in the same datacenter to keep latency sub 10ms.

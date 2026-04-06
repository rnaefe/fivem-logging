-- FiveM Logs Dashboard - MySQL Schema
-- Run this to set up your database

CREATE DATABASE IF NOT EXISTS fivem_logs;
USE fivem_logs;

-- Servers table
CREATE TABLE IF NOT EXISTS servers (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    identifier VARCHAR(100) UNIQUE NOT NULL,
    discord_guild_id VARCHAR(100) NOT NULL,
    api_key VARCHAR(255) UNIQUE NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Users table (Discord authenticated)
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    discord_id VARCHAR(100) UNIQUE NOT NULL,
    discord_username VARCHAR(255) NOT NULL,
    discord_avatar VARCHAR(255),
    discord_email VARCHAR(255),
    is_admin BOOLEAN DEFAULT FALSE,
    last_login TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- User sessions
CREATE TABLE IF NOT EXISTS sessions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    token VARCHAR(255) UNIQUE NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    discord_access_token TEXT,
    discord_refresh_token TEXT,
    discord_expires_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Log channels (categories for organizing logs)
CREATE TABLE IF NOT EXISTS log_channels (
    id INT AUTO_INCREMENT PRIMARY KEY,
    server_id INT NOT NULL,
    name VARCHAR(100) NOT NULL,
    slug VARCHAR(100) NOT NULL,
    description TEXT,
    event_types JSON NOT NULL, -- Array of event_types that go to this channel
    color VARCHAR(7) DEFAULT '#6366f1', -- Hex color
    icon VARCHAR(50) DEFAULT 'file-text', -- Lucide icon name
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (server_id) REFERENCES servers(id) ON DELETE CASCADE,
    UNIQUE KEY unique_channel_per_server (server_id, slug)
);


-- User server access (cache of which servers user has access to)
CREATE TABLE IF NOT EXISTS user_server_access (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    server_id INT NOT NULL,

    last_verified TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (server_id) REFERENCES servers(id) ON DELETE CASCADE,
    UNIQUE KEY unique_user_server (user_id, server_id)
);

-- Server admins (Discord IDs that can manage a server)
CREATE TABLE IF NOT EXISTS server_admins (
    id INT AUTO_INCREMENT PRIMARY KEY,
    server_id INT NOT NULL,
    discord_id VARCHAR(100) NOT NULL,
    permission_level ENUM('admin', 'moderator', 'viewer') DEFAULT 'viewer',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (server_id) REFERENCES servers(id) ON DELETE CASCADE,
    UNIQUE KEY unique_server_admin (server_id, discord_id)
);

-- Weapon usage stats (populated from logs)
CREATE TABLE IF NOT EXISTS weapon_stats (
    id INT AUTO_INCREMENT PRIMARY KEY,
    server_id INT NOT NULL,
    weapon_name VARCHAR(100) NOT NULL,
    usage_count INT DEFAULT 0,
    kill_count INT DEFAULT 0,
    last_used TIMESTAMP,
    date DATE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (server_id) REFERENCES servers(id) ON DELETE CASCADE,
    UNIQUE KEY unique_weapon_date (server_id, weapon_name, date)
);

-- Vehicle usage stats (populated from logs)
CREATE TABLE IF NOT EXISTS vehicle_stats (
    id INT AUTO_INCREMENT PRIMARY KEY,
    server_id INT NOT NULL,
    vehicle_name VARCHAR(100) NOT NULL,
    spawn_count INT DEFAULT 0,
    last_used TIMESTAMP,
    date DATE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (server_id) REFERENCES servers(id) ON DELETE CASCADE,
    UNIQUE KEY unique_vehicle_date (server_id, vehicle_name, date)
);

-- Indexes for better performance
CREATE INDEX idx_sessions_token ON sessions(token);
CREATE INDEX idx_sessions_expires ON sessions(expires_at);
CREATE INDEX idx_user_server_access_user ON user_server_access(user_id);

CREATE INDEX idx_log_channels_server ON log_channels(server_id);
CREATE INDEX idx_weapon_stats_server_date ON weapon_stats(server_id, date);
CREATE INDEX idx_vehicle_stats_server_date ON vehicle_stats(server_id, date);

-- Insert default data for testing
INSERT INTO servers (name, identifier, discord_guild_id, api_key) VALUES
('Test Server', 'test-server-1', '123456789012345678', 'test-api-key-12345');

-- Insert default log channels
INSERT INTO log_channels (server_id, name, slug, description, event_types, color, icon) VALUES
(1, 'Player Activity', 'player-activity', 'Player join/leave and general activity', '["player_joining", "player_dropped"]', '#22c55e', 'users'),
(1, 'Chat Logs', 'chat-logs', 'All chat messages', '["chat_message"]', '#3b82f6', 'message-square'),
(1, 'Inventory', 'inventory', 'Item transfers and purchases', '["item_swapped", "item_bought", "diamonds_swapped"]', '#f59e0b', 'package'),
(1, 'Admin Actions', 'admin-actions', 'TxAdmin and moderator actions', '["tx_kicked", "tx_banned", "tx_warned", "tx_healed", "tx_dm", "tx_spectate_start", "tx_action_revoked", "tx_announcement"]', '#ef4444', 'shield'),
(1, 'Resources', 'resources', 'Server resource start/stop events', '["resource_start", "resource_stop"]', '#8b5cf6', 'server');


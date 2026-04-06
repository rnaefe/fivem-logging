<div align="center">
  <img src="https://raw.githubusercontent.com/tandpfun/skill-icons/main/icons/NextJS-Dark.svg" width="60" alt="NextJS"/>
  <img src="https://raw.githubusercontent.com/tandpfun/skill-icons/main/icons/NodeJS-Dark.svg" width="60" alt="NodeJS"/>
  <img src="https://raw.githubusercontent.com/tandpfun/skill-icons/main/icons/ElasticSearch.svg" width="60" alt="ElasticSearch"/>
  <img src="https://raw.githubusercontent.com/tandpfun/skill-icons/main/icons/MySQL-Dark.svg" width="60" alt="MySQL"/>

  <br/>
  <br/>

  <h1>FiveM Log Management System</h1>
  <p>
    An enterprise-grade, highly scalable distributed logging system designed specifically for high-traffic FiveM servers.
  </p>

  <p>
    <a href="#features">Features</a> •
    <a href="#architecture">Architecture</a> •
    <a href="#getting-started">Getting Started</a> •
    <a href="#documentation">Documentation</a> •
    <a href="CONTRIBUTING.md">Contributing</a>
  </p>

  <p>
    <img src="https://img.shields.io/badge/version-1.0.0-blue.svg?style=for-the-badge" alt="Version"/>
    <img src="https://img.shields.io/badge/license-MIT-green.svg?style=for-the-badge" alt="License"/>
    <img src="https://img.shields.io/badge/PRs-welcome-brightgreen.svg?style=for-the-badge" alt="PRs Welcome"/>
  </p>
</div>

<hr/>

## Overview

The **FiveM Log Management System** provides administrators, developers, and server staff with deep, real-time insights into server events. Built to endure the high-throughput nature of heavily populated FiveM Roleplay and Freeroam servers, it leverages **Elasticsearch** for lightning-fast querying and **Next.js** for an elegantly crafted, dark-mode accessible admin dashboard.

Stop relying on slow, unsearchable Discord webhook logs. Take control of your server's data with advanced filtering, weapon/vehicle statistics aggregations, and secure Discord OAuth2 staff authentication.

## Key Features

- **High-Throughput Ingestion:** Custom Node.js backend handles thousands of events per second via optimized async bulk processing.
- **Elasticsearch Powered:** Full-text search, pagination, and millisecond-level aggregations over millions of rows.
- **Secure OAuth2 Auth:** Seamless staff login using Discord. Automated server-access resolution via Discord Guild membership.
- **Rich Analytics:** Automated statistical tracking of weapons used, vehicles spawned, and economic transactions.
- **Modern Dashboard:** Next.js App Router, `shadcn/ui`, and Tailwind CSS combined for a flawless, snappy user experience.
- **Plug & Play Lua:** A lightweight, non-blocking FiveM resource utilizing standard `exports` to drop straight into your existing frameworks (QBCore, ESX, or Custom).

## Repository Structure

```text
fivem-log-system/
├── backend/               # Node.js Ingest REST API & Elasticsearch mapping
├── dashboard/             # Next.js 14 Web Application (UI & Auth)
├── docs/                  # Extensive technical documentation
├── ARCHITECTURE.md        # Deep dive into distributed architecture
└── CONTRIBUTING.md        # Guidelines for pull requests and community
```

## Getting Started

Getting your logging infrastructure up and running involves three main components: the database, the ingest backend, and the dashboard. 

For the most comprehensive guide, please refer to our **[Full Setup Guide](docs/SETUP.md)**.

### Quick Start Summary

#### 1. Requirements
Ensure you have installed: **Node.js 22+**, **MySQL 8.0+**, and **Elasticsearch 9.0+**. You will also need a registered Discord Developer App for OAuth2.

#### 2. Backend & Ingest Server
```bash
cd backend
npm install
cp env.example .env

# Edit .env with your configuration
npm run dev
```

#### 3. Frontend Dashboard
```bash
cd dashboard
npm install
cp env.example .env.local

# Edit .env.local (Discord IDs, etc)
npm run dev
```

### 4. Lua Integration
Move the `fivem-logging.lua` into your FiveM Server's resource folder and add the appropriate API keys to your `server.cfg`. Read the [Integration Docs](docs/INTEGRATION.md) for details.

## Documentation

We believe in making powerful tools easy to use through exceptional documentation. Dive deeper into the specific areas of the exact systems you wish to explore:

- **[Architecture Overview](ARCHITECTURE.md):** Understand the flow of data from game server to Elasticsearch.
- **[Installation & Setup](docs/SETUP.md):** Step-by-step instructions from a blank VPS to a production-ready application.
- **[API Reference](docs/API_REFERENCE.md):** Connect external tools or write your own custom log ingesters using the REST API.
- **[FiveM Integration](docs/INTEGRATION.md):** Implement Lua exports directly into your existing scripts.

## Contributing

This project is built by the community, for the community. Contributions, issues, and feature requests are always welcome! 

Please read our [Contributing Guidelines](CONTRIBUTING.md) to learn how to open a PR, report issues, and follow our code structuring standards.

## License

This project is open-sourced under the **[MIT License](LICENSE)**. You are free to modify, distribute, and utilize this software commercially.

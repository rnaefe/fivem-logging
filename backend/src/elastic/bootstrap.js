const client = require('./client');

const INDEX_NAME = 'fivem-logs';

async function bootstrap() {
  try {
    const exists = await client.indices.exists({ index: INDEX_NAME });

    if (!exists) {
      console.log(`Index '${INDEX_NAME}' does not exist. Creating...`);
      await client.indices.create({
        index: INDEX_NAME,
        mappings: {
          properties: {
            "@timestamp": { type: "date" },
            event_type: { type: "keyword" },
            category: { type: "keyword" },
            isDevServer: { type: "boolean" },
            server: {
              properties: {
                name: { type: "keyword" },
                id: { type: "keyword" }
              }
            },
            player: {
              properties: {
                id: { type: "integer" },
                name: { 
                  type: "text",
                  fields: {
                    keyword: { type: "keyword" }
                  }
                },
                identifiers: {
                  properties: {
                    steam: { type: "keyword" },
                    license: { type: "keyword" },
                    discord: { type: "keyword" },
                    live: { type: "keyword" },
                    fivem: { type: "keyword" }
                  }
                }
              }
            },
            payload: {
              type: "object",
              dynamic: true,
              properties: {
                weaponName: { type: "keyword" },
                vehicleName: { type: "keyword" },
                resourceName: { type: "keyword" },
                message: { type: "text" },
                reason: { type: "text" },
                action: { type: "keyword" }
              }
            }
          }
        }
      });
      console.log(`Index '${INDEX_NAME}' created successfully.`);
    } else {
      console.log(`Index '${INDEX_NAME}' already exists.`);
    }
  } catch (error) {
    console.error('Error bootstrapping Elasticsearch:', error);
    process.exit(1);
  }
}

module.exports = bootstrap;

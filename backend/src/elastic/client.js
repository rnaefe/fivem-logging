const { Client } = require('@elastic/elasticsearch');

const config = {
  node: process.env.ELASTICSEARCH_NODE || 'http://localhost:9200'
};

// Add authentication if provided
if (process.env.ELASTICSEARCH_USERNAME && process.env.ELASTICSEARCH_PASSWORD) {
  config.auth = {
    username: process.env.ELASTICSEARCH_USERNAME,
    password: process.env.ELASTICSEARCH_PASSWORD
  };
}

const client = new Client(config);

module.exports = client;

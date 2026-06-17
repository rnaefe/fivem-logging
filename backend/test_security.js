const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

require('./src/routes/log');

const searchRoute = fs.readFileSync(
  path.join(__dirname, '../dashboard/src/app/api/servers/[serverId]/search/route.js'),
  'utf8'
);

assert.match(searchRoute, /paramsOut\.set\('server_id', serverIdentifier\)/);
assert.doesNotMatch(searchRoute, /paramsOut\.set\('server_id',\s*paramsOut\.get/);

console.log('security checks ok');

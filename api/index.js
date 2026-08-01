require("reflect-metadata");

const {
  connectDatabase,
} = require("../dist/infrastructure/database/data-source");
const { createApp } = require("../dist/infrastructure/http/create-app");

const app = createApp();

let ready = null;

function ensureReady() {
  if (!ready) {
    ready = connectDatabase();
  }
  return ready;
}

module.exports = async function handler(req, res) {
  await ensureReady();
  return app(req, res);
};

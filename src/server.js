const express = require("express");
const http = require("http");
const app = express();
const port = process.env.PORT;
const server = http.createServer(app);

app.set("port", port);

process.on("uncaughtException", (err) => {
  console.error(`there was an uncaught error: ${err}`);
  process.exit;
});

module.exports = { app, server };

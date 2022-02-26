const http = require("http");
require("dotenv").config();

const {mongoConnect} = require("./services/mongo");
const {loadLaunchesData} = require("./models/launches.model");
const {loadPlanetData} = require("./models/plantes.model");
// console
const app = require("./app");

const PORT = process.env.PORT || 8000;

const server = http.createServer(app);

async function startServer() {
  await mongoConnect();
  await loadPlanetData();
  await loadLaunchesData();

  server.listen(PORT, () => {
    console.log(`Listening on port ${PORT}...`);
  });
}
startServer();

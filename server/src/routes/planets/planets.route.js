const express = require("express");
const {httpGetAllPlanets} = require("./planets.controller");

const planetRoutes = express.Router();

planetRoutes.get("/", httpGetAllPlanets);
module.exports = planetRoutes;

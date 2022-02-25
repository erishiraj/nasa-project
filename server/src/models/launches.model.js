const launchesDatabase = require("./launches.mongo");
const planetesDatabase = require("./planets.mongo");
const axios = require("axios");

const DEFAULT_FLIGHT_NUMBER = 100;

const SPACEX_API_URL = "https://api.spacexdata.com/v4/launches/query";

async function populateLaunch() {
  console.log("Downloading launch data...");
  const responce = await axios.post(SPACEX_API_URL, {
    query: {},
    options: {
      pagination: false,
      populate: [
        {
          path: "rocket",
          select: {
            name: 1,
          },
        },
        {
          path: "payloads",
          select: {
            customers: 1,
          },
        },
      ],
    },
  });
  const launchDocs = responce.data.docs;
  for (const launchDoc of launchDocs) {
    const payloads = launchDoc["payloads"];
    const customers = payloads.flatMap((payload) => {
      return payload["customers"];
    });
    const launch = {
      flightNumber: launchDoc["flight_number"],
      mission: launchDoc["name"],
      rocket: launchDoc["rocket"]["name"],
      launchDate: launchDoc["date_local"],
      success: launchDoc["success"],
      upcoming: launchDoc["upcoming"],
      customers,
    };
    saveLaunch(launch);
    console.log(`${launch.flightNumber}:- ${launch.mission}`);
  }
}
async function loadLaunchesData() {
  const firstLaunch = await findLaunch({
    flightNumber: 1,
    rocket: "Falcon 1",
    mission: "FalconSat",
  });

  if (firstLaunch) {
    console.log("Launch data already loaded");
  } else {
    populateLaunch();
  }
}

async function findLaunch(filter) {
  return await launchesDatabase.findOne(filter);
}
async function existsLaunchWithId(launchId) {
  return await findLaunch({flightNumber: launchId});
}
async function saveLaunch(launch) {
  try {
    await launchesDatabase.findOneAndUpdate(
      {
        flightNumber: launch.flightNumber,
      },
      launch,
      {
        upsert: true,
      }
    );
  } catch (error) {
    throw error;
  }
}

async function getLatestFlightNumber() {
  const latestFlight = await launchesDatabase.findOne().sort("-flightNumber");
  if (!latestFlight) {
    return DEFAULT_FLIGHT_NUMBER;
  }
  return latestFlight.flightNumber;
}

async function getAllLaunches(skip, limit) {
  return await launchesDatabase
    .find({}, {_id: 0, __v: 0})
    .sort({flightNumber: 1})
    .skip(skip)
    .limit(limit);
}

async function addNewLaunch(launch) {
  try {
    const planet = await planetesDatabase.findOneAndUpdate({
      keplerName: launch.target,
    });
    if (!planet) {
      throw new Error("No matching planet found!");
    }
    const newFlight = (await getLatestFlightNumber()) + 1;
    const newLaunch = Object.assign(launch, {
      success: true,
      upcoming: true,
      customers: ["Zero to master", "NASA"],
      flightNumber: newFlight,
    });
    await saveLaunch(newLaunch);
  } catch (error) {
    throw error;
  }
}

async function abortLaunch(launchId) {
  const aborted = await launchesDatabase.updateOne(
    {
      flightNumber: launchId,
    },
    {
      upcoming: false,
      success: false,
    }
  );
  return aborted.modifiedCount === 1;
}

module.exports = {
  getAllLaunches,
  addNewLaunch,
  abortLaunch,
  existsLaunchWithId,
  loadLaunchesData,
};

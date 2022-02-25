const {
  getAllLaunches,
  addNewLaunch,
  abortLaunch,
  existsLaunchWithId,
} = require("../../models/launches.model");

const {getPagination} = require("../../services/query");

async function httpGetAllLaunches(req, res) {
  const {skip, limit} = getPagination(req.query);
  console.log(skip, limit);
  return res.status(200).json(await getAllLaunches(skip, limit));
}

async function httpAddNewLaunch(req, res) {
  try {
    const launch = req.body;
    if (
      !launch.mission ||
      !launch.launchDate ||
      !launch.rocket ||
      !launch.target
    ) {
      return res.status(400).json({
        error: "Missing required launch property",
      });
    }
    launch.launchDate = new Date(launch.launchDate);
    if (isNaN(launch.launchDate)) {
      return res.status(400).json({
        error: "Invalid date",
      });
    }
    await addNewLaunch(launch);
    return res.status(201).json(launch);
  } catch (error) {
    return res.status(400).json({error});
  }
}

async function httpAbortLaunch(req, res) {
  const launchId = Number(req.params.id);
  const existsLaunch = await existsLaunchWithId(launchId);
  if (!existsLaunch) {
    return res.status(401).json({
      error: "Launch not Found",
    });
  }
  const aborted = await abortLaunch(launchId);
  if (!aborted) {
    return res.status(400).json({
      error: "Launch not aborted",
    });
  }
  return res.status(200).json({
    ok: true,
  });
}

module.exports = {httpGetAllLaunches, httpAddNewLaunch, httpAbortLaunch};

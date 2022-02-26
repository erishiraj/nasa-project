const request = require("supertest");
const app = require("../../app");
const {mongoConnect, mongoDisconnect} = require("../../services/mongo");
const {loadPlanetData} = require("../../models/plantes.model");

describe("Launch API", () => {
  beforeAll(async () => {
    await mongoConnect();
    await loadPlanetData();
  });
  afterAll(async () => {
    await mongoDisconnect();
  });

  describe("Test GET /Launches", () => {
    test("It should be response 200 success", async () => {
      const response = await request(app)
        .get("/v1/launches")
        .expect("Content-Type", /json/)
        .expect(200);
    });
  });

  const completLaunchData = {
    mission: "USS Enterprise",
    rocket: "NCC 1701-D",
    target: "Kepler-186 f",
    launchDate: "January 3 2028",
  };

  const completLaunchWithoutDate = {
    mission: "USS Enterprise",
    rocket: "NCC 1701-D",
    target: "Kepler-186 f",
  };

  const invalidDate = {
    mission: "USS Enterprise",
    rocket: "NCC 1701-D",
    target: "Kepler-186 f",
    launchDate: "Neo",
  };

  describe("Test POST /launches", () => {
    test("It should be response 201 success", async () => {
      const responseData = await request(app)
        .post("/v1/launches")
        .send(completLaunchData)
        .expect("Content-Type", /json/)
        .expect(201);

      const requiestDate = new Date(completLaunchData.launchDate).valueOf();
      const responseDate = new Date(responseData.body.launchDate).valueOf();
      expect(responseDate).toBe(requiestDate);
      expect(responseData.body).toMatchObject(completLaunchWithoutDate);
    });

    test("It should catch missing required property", async () => {
      const response = await request(app)
        .post("/v1/launches")
        .send(completLaunchWithoutDate)
        .expect("Content-Type", /json/)
        .expect(400);

      expect(response.body).toStrictEqual({
        error: "Missing required launch property",
      });
    });
    test("It should  catch invalid date", async () => {
      const response = await request(app)
        .post("/v1/launches")
        .send(invalidDate)
        .expect("Content-Type", /json/)
        .expect(400);

      expect(response.body).toStrictEqual({
        error: "Invalid date",
      });
    });
  });
});

const request = require("supertest");
const app = require("../server");
const sequelize = require("../config/database");
const user = require("../db/models/user");

let token = "";
let videoRecordId = "";
let videoIds = [];

beforeAll(async () => {
  await sequelize.sync();
});

afterAll(async () => {
  await user.destroy({ truncate: true });
  await sequelize.close();
});

const userData = {
  name: "Jhon Doe",
  email: "jhondoe@gmail.com",
  password: "jhonDoe@123",
};

describe("POST /user/register", () => {
  describe("Given a name, email-id and password", () => {
    test("should respond with a 200 status code", async () => {
      const response = await request(app).post("/api/user/register").send({
        name: userData.name,
        email: userData.email,
        password: userData.password,
      });

      expect(response.statusCode).toBe(200);
    });
  });

  describe("Given existing  email-id ", () => {
    test("should respond with a 400 status code", async () => {
      const response = await request(app).post("/api/user/register").send({
        name: userData.name,
        email: userData.email,
        password: userData.password,
      });

      expect(response.statusCode).toBe(400);
    });
  });

  describe("when name, email-id and password is missing", () => {
    test("should respond with a 400 status code", async () => {
      const response = await request(app).post("/api/user/register").send({
        name: "",
        email: "",
        password: "",
      });

      expect(response.statusCode).toBe(400);
    });
  });
});

describe("POST /user/signin", () => {
  describe("Given email-id and password ", () => {
    test("should respond with a 200 status code", async () => {
      const response = await request(app).post("/api/user/signin").send({
        email: userData.email,
        password: userData.password,
      });
      token = response.body.token;
      expect(response.statusCode).toBe(200);
    });
  });
});

// Video Tests

console.log(token);
describe("POST /video/upload", () => {
  describe("Given name and video file - 1", () => {
    test("should respond with a 200 status code", async () => {
      const filePath = `${__dirname}/videoSamples/sampleVideo1.mp4`;

      console.log(filePath);
      const response = await request(app)
        .post("/api/video/upload")
        .set("Authorization", `Bearer ${token}`)
        .field("name", "sample video 1")
        .attach("video", filePath);

      expect(response.statusCode).toBe(200);
      expect(response.body).toHaveProperty("id");
      expect(response.body).toHaveProperty("videoId");
      expect(response.body).toHaveProperty("url");

      videoIds.push(response.body.videoId);
      videoRecordId = response.body.id;
    });
  });

  describe("Given name and video file - 2 ", () => {
    test("should respond with a 200 status code", async () => {
      const filePath = `${__dirname}/videoSamples/sampleVideo2.mp4`;

      console.log(filePath);
      const response = await request(app)
        .post("/api/video/upload")
        .set("Authorization", `Bearer ${token}`)
        .field("name", "sample video 1")
        .attach("video", filePath);

      expect(response.statusCode).toBe(200);
      expect(response.body).toHaveProperty("id");
      expect(response.body).toHaveProperty("videoId");
      expect(response.body).toHaveProperty("url");
      videoIds.push(response.body.videoId);
    });
  });
});

describe("PUT /video/concat", () => {
  jest.setTimeout(10000); // Set timeout to 10 seconds

  describe("Given videoIds array and name for newly concatenated video", () => {
    test("should respond with a 200 status code", async () => {
      console.log(videoIds);
      const response = await request(app)
        .put("/api/video/concat")
        .set("Authorization", `Bearer ${token}`)
        .send({
          // Note - video resolutions of all videos need to be the same.
          nameForConcatVideo: "VR Demo",
          videoIds: videoIds,
        });

      expect(response.statusCode).toBe(200);
      expect(response.body).toHaveProperty("id");
      expect(response.body).toHaveProperty("videoId");
      expect(response.body).toHaveProperty("url");
    });
  });
});

describe("PATCH /video/trim", () => {
  describe("Given video record id, trimFrom and trimDureation", () => {
    test("should respond with a 200 status code", async () => {
      const response = await request(app)
        .patch("/api/video/trim")
        .set("Authorization", `Bearer ${token}`)
        .send({
          id: videoRecordId,
          // trimFrom is the time from which the video is to be trimed. fromat - hh:mm:ss
          trimFrom: "00:00:00",
          // trimDuration is time in seconds, it will trim the video for given value, starting from trimFrom value.
          trimDuration: "10",
        });

      expect(response.statusCode).toBe(200);
      expect(response.body).toHaveProperty("message", "video trim successfull!");
      expect(response.body).toHaveProperty("url");
    });
  });
});

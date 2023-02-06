const app = require("../app")
const request = require("supertest");

const express = require('express');
const { param } = require("../app");

const apps = express()
// apps.use(express.json())

test("GET healthz endpoint", async () => {
  await request(app).get("/healthz").expect(400);
});
test("GET random not found endpoint", async () => {
  await request(app).get("/randomendpoint").expect(404);
});

describe("POST /users", () => {
  describe("given a username and password", () => {

    
    test("should specify json in the content type header", async () => {
      const response = await request(app).post("/users").send({
        username: "username",
        password: "password"
      })
      expect(response.headers['content-type']).toEqual(expect.stringContaining("json"))
    })
  })
  describe("when the username and password is missing", () => {
    test("should respond with a status code of 400", async () => {
      const bodyData = [
        {username: "username"},
        {password: "password"},
        {}
      ]
      for (const body of bodyData) {
        const response = await request(app).post("/users").send(body)
        expect(response.statusCode).toBe(400)
      }
    })
  })
})


// describe('GET /users/:id', () => {
//   it('Should reach the endpoint and return a status code of 200', async () => {
//     const userId = param.id
//     const req = await request(app)

//       .get(`/users/${userId}`)
//       .expect(500);

//       const res = await request(app)
//       const id = res.body;
//       expect(id).toBe(userId);
  
//   });
// });

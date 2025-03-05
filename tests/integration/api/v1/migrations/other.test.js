import orchestrator from "tests/orchestrator.js";

beforeAll(async () => {
  await orchestrator.waitForAllServices();
  await orchestrator.clearDatabase();
});

describe("API /api/v1/migrations", () => {
  describe("Anonymous user", () => {
    const url = "http://localhost:3000/api/v1/migrations";

    describe("Use DELETE method", () => {
      test("should return 405", async () => {
        const response = await fetch(url, { method: "DELETE" });
        expect(response.status).toBe(405);
      });
    });

    describe("Use PUT method", () => {
      test("should return 405", async () => {
        const response = await fetch(url, { method: "PUT" });
        expect(response.status).toBe(405);
      });
    });

    describe("Use HEAD method", () => {
      test("should return 405", async () => {
        const response = await fetch(url, { method: "HEAD" });
        expect(response.status).toBe(405);
      });
    });

    describe("Use OPTIONS method", () => {
      test("should return 405", async () => {
        const response = await fetch(url, { method: "OPTIONS" });
        expect(response.status).toBe(405);
      });
    });

    describe("Use PATCH method", () => {
      test("should return 405", async () => {
        const response = await fetch(url, { method: "PATCH" });
        expect(response.status).toBe(405);
      });
    });
  });
});

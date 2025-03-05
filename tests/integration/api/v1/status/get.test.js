import orchestrator from "tests/orchestrator.js";

beforeAll(async () => {
  await orchestrator.waitForAllServices();
});

describe("GET /api/v1/status", () => {
  describe("Anonymous user", () => {
    test("Retrieving current system status", async () => {
      const response = await fetch("http://localhost:3000/api/v1/status");

      expect(response.status).toBe(200);

      const responseBody = await response.json();
      expect(responseBody.updated_at).toBeDefined();

      const parseUpdated_at = new Date(responseBody.updated_at).toISOString();
      expect(responseBody.updated_at).toEqual(parseUpdated_at);

      expect(responseBody.dependencies.database.version).toBeDefined();
      expect(responseBody.dependencies.database.version).toBe("16.6");

      expect(responseBody.dependencies.database.max_connections).toBeDefined();
      expect(typeof responseBody.dependencies.database.max_connections).toBe(
        "number",
      );
      // expect(responseBody.dependencies.database.max_connections).toEqual(100);

      expect(
        responseBody.dependencies.database.opened_connections,
      ).toBeDefined();
      expect(responseBody.dependencies.database.opened_connections).toEqual(1);

      console.log(responseBody);
    });
  });
});

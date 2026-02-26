import orchestrator from "tests/orchestrator.js";

beforeAll(async () => {
  await orchestrator.waitForAllServices();
  await orchestrator.clearDatabase();
  await orchestrator.runPendingMigrations();
});

describe("POST /api/v1/migrations", () => {
  describe("Anonymous user", () => {
    test("Should not access", async () => {
      const response = await fetch("http://localhost:3000/api/v1/migrations", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      });

      expect(response.status).toBe(403);
    });
  });

  describe("Default user", () => {
    test("Should not access", async () => {
      const createdUser = await orchestrator.createUser();
      const activatedUser = await orchestrator.activateUser(createdUser);
      const sessionObject = await orchestrator.createSession(activatedUser.id);

      const response = await fetch("http://localhost:3000/api/v1/migrations", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Cookie: `session_id=${sessionObject.token}`,
        },
      });

      expect(response.status).toBe(403);
    });
  });

  describe("Privileged user", () => {
    test("Running pending migrations", async () => {
      const privilegedUser = await orchestrator.createUser();
      await orchestrator.activateUser(privilegedUser);
      await orchestrator.addFeaturesToUser(privilegedUser, [
        "create:migrations",
      ]);

      const privilegedUserSession = await orchestrator.createSession(
        privilegedUser.id,
      );

      const response = await fetch(`http://localhost:3000/api/v1/migrations`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          cookie: `session_id=${privilegedUserSession.token}`,
        },
      });

      const responseBody = await response.json();

      expect(response.status).toBe(200);
      expect(Array.isArray(responseBody)).toBe(true);
    });
  });
});

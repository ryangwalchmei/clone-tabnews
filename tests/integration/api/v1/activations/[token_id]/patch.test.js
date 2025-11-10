import webserver from "infra/webserver";
import activation from "models/activation";
import user from "models/user";
import orchestrator from "tests/orchestrator";
import { version as uuidVersion } from "uuid";

beforeAll(async () => {
  await orchestrator.waitForAllServices();
  await orchestrator.clearDatabase();
  await orchestrator.runPendingMigrations();
  await orchestrator.deleteAllEmails();
});

describe("PATCH /activations/[token_id]", () => {
  describe("Anonymous user", () => {
    test(`With nonexistent token`, async () => {
      const activationResponse = await fetch(
        `${webserver.origin}/api/v1/activations/5f13f94b-080a-4a72-b41e-6a4bd08b92cf`,
        {
          method: "PATCH",
        },
      );

      expect(activationResponse.status).toBe(404);
      const activationResponseBody = await activationResponse.json();

      expect(activationResponseBody).toEqual({
        name: "NotFoundError",
        message:
          "O token de ativação utilizado não foi encontrado no sistema ou expirou.",
        action: "Faça um novo cadastro.",
        status_code: 404,
      });
    });

    test(`With expired token`, async () => {
      jest.useFakeTimers({
        now: new Date(Date.now() - activation.EXPIRATION_IN_MILLISECONDS),
      });

      const createdUser = await orchestrator.createUser();
      const expiredActivationToken = await activation.create(createdUser.id);

      jest.useRealTimers();

      const activationResponse = await fetch(
        `${webserver.origin}/api/v1/activations/${expiredActivationToken.id}`,
        {
          method: "PATCH",
        },
      );

      expect(activationResponse.status).toBe(404);

      const activationResponseBody = await activationResponse.json();

      expect(activationResponseBody).toEqual({
        name: "NotFoundError",
        message:
          "O token de ativação utilizado não foi encontrado no sistema ou expirou.",
        action: "Faça um novo cadastro.",
        status_code: 404,
      });
    });

    test(`With already used token`, async () => {
      const createdUser = await orchestrator.createUser();
      const activationToken = await activation.create(createdUser.id);

      const activationResponse1 = await fetch(
        `${webserver.origin}/api/v1/activations/${activationToken.id}`,
        {
          method: "PATCH",
        },
      );

      expect(activationResponse1.status).toBe(200);

      const activationResponse2 = await fetch(
        `${webserver.origin}/api/v1/activations/${activationToken.id}`,
        {
          method: "PATCH",
        },
      );
      expect(activationResponse2.status).toBe(404);

      const activationResponseBody2 = await activationResponse2.json();

      expect(activationResponseBody2).toEqual({
        name: "NotFoundError",
        message:
          "O token de ativação utilizado não foi encontrado no sistema ou expirou.",
        action: "Faça um novo cadastro.",
        status_code: 404,
      });
    });

    test(`With token valid`, async () => {
      const createdUser = await orchestrator.createUser();
      const activationToken = await activation.create(createdUser.id);

      const activationResponse = await fetch(
        `${webserver.origin}/api/v1/activations/${activationToken.id}`,
        {
          method: "PATCH",
        },
      );

      expect(activationResponse.status).toBe(200);

      const activationResponseBody = await activationResponse.json();

      expect(activationResponseBody).toEqual({
        id: activationResponseBody.id,
        use_at: activationResponseBody.use_at,
        user_id: createdUser.id,
        expires_at: activationToken.expires_at.toISOString(),
        created_at: activationToken.created_at.toISOString(),
        updated_at: activationResponseBody.updated_at,
      });

      expect(uuidVersion(activationResponseBody.id)).toBe(4);
      expect(uuidVersion(activationResponseBody.user_id)).toBe(4);

      expect(Date.parse(activationResponseBody.expires_at)).not.toBeNaN();
      expect(Date.parse(activationResponseBody.created_at)).not.toBeNaN();
      expect(Date.parse(activationResponseBody.updated_at)).not.toBeNaN();
      expect(
        activationResponseBody.updated_at > activationResponseBody.created_at,
      ).toBe(true);

      const expiresAt = new Date(activationResponseBody.expires_at);
      const created_at = new Date(activationResponseBody.created_at);

      expiresAt.setMilliseconds(0);
      created_at.setMilliseconds(0);

      expect(expiresAt - created_at).toBe(
        activation.EXPIRATION_IN_MILLISECONDS,
      );

      const activatedUser = await user.findOneById(createdUser.id);
      expect(activatedUser.features).toEqual([
        "create:session",
        "read:session",
      ]);
    });

    test("With valid token but already activated user", async () => {
      const createdUser = await orchestrator.createUser();
      await orchestrator.activateUser(createdUser);
      const activationToken = await activation.create(createdUser.id);

      const response = await fetch(
        `http://localhost:3000/api/v1/activations/${activationToken.id}`,
        {
          method: "PATCH",
        },
      );

      expect(response.status).toBe(403);

      const responseBody = await response.json();

      expect(responseBody).toEqual({
        name: "UnauthorizedError",
        message: "Você não pode mais utilizar tokens de ativaçãos.",
        action: "Entre em contato com o suporte.",
        status_code: 403,
      });
    });
  });

  describe("Default user", () => {
    test(`With valid token, but already logged in user`, async () => {
      const user1 = await orchestrator.createUser();
      await orchestrator.activateUser(user1);
      const user1SessionObject = await orchestrator.createSession(user1.id);

      const user2 = await orchestrator.createUser();
      const user2ActivationToken = await activation.create(user2.id);

      const activationResponse = await fetch(
        `${webserver.origin}/api/v1/activations/${user2ActivationToken.id}`,
        {
          method: "PATCH",
          headers: {
            Cookie: `session_id=${user1SessionObject.token}`,
          },
        },
      );

      expect(activationResponse.status).toBe(403);
      const activationResponseBody = await activationResponse.json();
      expect(activationResponseBody).toEqual({
        name: "UnauthorizedError",
        message: "Você não possui permissão para executar essa ação",
        action:
          'Verifique se seu usuário possui a feature "read:activation_token".',
        status_code: 403,
      });
    });
  });
});

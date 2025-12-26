import database from "infra/database";
import email from "infra/email";
import { ForbiddenError, NotFoundError } from "infra/errors";
import webserver from "infra/webserver";
import user from "./user";
import authorization from "./authorization";

const EXPIRATION_IN_MILLISECONDS = 60 * 15 * 1000;

async function findOneValidById(validationToken) {
  const token = await runSelectQuery(validationToken);

  return token;

  async function runSelectQuery(validationToken) {
    const results = await database.query({
      text: `
      SELECT
        * 
      FROM 
        user_activation_tokens 
      WHERE 
        id = $1
        AND expires_at > NOW()
        AND use_at IS NULL
      LIMIT
        1
      ;`,
      values: [validationToken],
    });

    if (results.rowCount == 0) {
      throw new NotFoundError({
        message:
          "O token de ativação utilizado não foi encontrado no sistema ou expirou.",
        action: "Faça um novo cadastro.",
      });
    }

    return results.rows[0];
  }
}

async function create(userId) {
  const expiresAt = new Date(Date.now() + EXPIRATION_IN_MILLISECONDS);

  const newToken = await runInsertQuery(userId, expiresAt);
  return newToken;

  async function runInsertQuery(userId, expiresAt) {
    const results = await database.query({
      text: `
        INSERT INTO
          user_activation_tokens (user_id, expires_at)
        VALUES
          ($1, $2)
        RETURNING
          *
      ;`,
      values: [userId, expiresAt],
    });
    return results.rows[0];
  }
}

async function sendEmailToUser(user, activationToken) {
  await email.send({
    from: "Gwalchmei <contato@gwalchmei.com.br>",
    to: user.email,
    subject: "Ative seu cadastro!",
    text: `${user.username}, clique no link abaixo para ativar seu cadastro no Gwalchmei.

${webserver.origin}/cadastro/ativar/${activationToken.id}

Atenciosamente,
Equipe Gwalchmei`,
  });
}

async function markTokenAsUsed(tokenId) {
  const token = await runUpdateQuery(tokenId);
  return token;

  async function runUpdateQuery(tokenId) {
    const tokenUpdateResults = await database.query({
      text: `
       UPDATE 
          user_activation_tokens 
        SET
          use_at = timezone('utc', NOW()),
          updated_at = timezone('utc', NOW())
        WHERE
          id = $1
        RETURNING 
          *
      ;`,
      values: [tokenId],
    });
    return tokenUpdateResults.rows[0];
  }
}

async function activatedUserByUserId(userId) {
  const userToActivate = await user.findOneById(userId);

  if (!authorization.can(userToActivate, "read:activation_token")) {
    throw new ForbiddenError({
      message: "Você não pode mais utilizar tokens de ativaçãos.",
      action: "Entre em contato com o suporte.",
    });
  }

  const activatedUser = await user.setFeatures(userId, [
    "create:session",
    "read:session",
  ]);

  return activatedUser;
}

const activation = {
  sendEmailToUser,
  create,
  findOneValidById,
  markTokenAsUsed,
  activatedUserByUserId,
  EXPIRATION_IN_MILLISECONDS,
};

export default activation;

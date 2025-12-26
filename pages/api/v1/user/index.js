import { createRouter } from "next-connect";
import controller from "infra/controller.js";
import user from "models/user.js";
import session from "models/session";
import authorization from "models/authorization";
import { ForbiddenError } from "infra/errors";

const router = createRouter();

router.use(controller.injectAnonymousOrUser);
router.get(controller.canRequest("read:session"), getHandler);

export default router.handler(controller.errorHandlers);

async function getHandler(request, response) {
  if (!authorization.can(request.context.user, "read:session")) {
    throw new ForbiddenError({
      message: "Você não possui permissão para acessar esse recurso.",
      action: "Contate o suporte caso você acredite que isto seja um erro.",
    });
  }

  const sessionToken = request.cookies.session_id;

  const sessionObject = await session.findOneValidByToken(sessionToken);

  const renewedSessionObject = await session.renew(sessionObject.id);
  controller.setSessionCookie(renewedSessionObject.token, response);

  const userFound = await user.findOneById(sessionObject.user_id);

  response.setHeader(
    "Cache-Control",
    "no-store, no-cache, max-age=0, must-revalidate",
  );
  return response.status(200).json(userFound);
}

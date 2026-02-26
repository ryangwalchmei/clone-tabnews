import { createRouter } from "next-connect";
import controller from "infra/controller.js";
import activation from "models/activation";
import authorization from "models/authorization";

const router = createRouter();

router.use(controller.injectAnonymousOrUser);
router.patch(controller.canRequest("read:activation_token"), patchHandler);

export default router.handler(controller.errorHandlers);

async function patchHandler(request, response) {
  const userTryingToPatch = request.context.user;
  const { token_id } = request.query;

  const validActivationToken = await activation.findOneValidById(token_id);
  await activation.activatedUserByUserId(validActivationToken.user_id);

  const usedActivationToken = await activation.markTokenAsUsed(token_id);

  const secureOutputValues = authorization.filterOutput(
    userTryingToPatch,
    "read:activation_token",
    usedActivationToken,
  );

  return response.status(200).json(secureOutputValues);
}

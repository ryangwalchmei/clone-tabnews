import { createRouter } from "next-connect";
import controller from "infra/controller.js";
import activation from "models/activation";

const router = createRouter();

router.patch(patchHandler);

export default router.handler(controller.errorHandlers);

async function patchHandler(request, response) {
  const { token_id } = request.query;

  const validTokenObject = await activation.findOneValidById(token_id);
  const usedActivationToken = await activation.markTokenAsUsed(
    validTokenObject.id,
  );
  await activation.activatedUserByUserId(usedActivationToken.user_id);

  return response.status(200).json(usedActivationToken);
}

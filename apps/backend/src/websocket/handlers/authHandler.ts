import { ERR_EXISTED_USER, ERR_INTERNAL, UserController } from "database";
import { WebsocketHandler, websocketHandlerCode } from "../utils/type";
import z from "zod";
import { getAPIG } from "../APIGateway";
import { ERR_BAD_REQUEST } from "../utils/error";
import { connectionAuthorizedMessage } from "../utils/websocketReponses";

const bodyValdiation = z.object({
  username: z.string(),
});

/**
 *
 * @description Authenticate the connection and make a new user document
 *
 * @param event
 * @param context
 * @returns
 */
export const authHandler: WebsocketHandler = async (event, context) => {
  const { send, connectionId } = getAPIG(event, context);

  const json = JSON.parse(event.body!);

  if (bodyValdiation.safeParse(json).success === false) {
    return await send({
      status: "REQUEST_ERROR",
      error: ERR_BAD_REQUEST,
    });
  }

  const body = bodyValdiation.parse(json);

  const { username } = body;
  const [user] = await UserController.getUserMeta({ username });

  /**
   * If the username is taken, reply with an error
   */
  if (user) {
    // The username is already taken
    return await send({
      status: "REQUEST_ERROR",
      error: ERR_EXISTED_USER,
    });
  } else {
    // Create new user
    const [user, error] = await UserController.createUser({
      username,
      connectionId,
    });

    if (error) {
      return await send({
        status: "INTERNAL_ERROR",
        error: error,
      });
    }

    return send(connectionAuthorizedMessage(user.username, connectionId));
  }
};
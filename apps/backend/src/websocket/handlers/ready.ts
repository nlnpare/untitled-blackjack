import {
  ERR_ILLEGAL_OPERATION,
  ERR_INTERNAL,
  ERR_INVALID_GAME,
  ERR_INVALID_USER,
  GameActionController,
  GameController,
  UserController,
} from "database";
import { getAPIG } from "../APIGateway";
import { ERR_BAD_REQUEST } from "../utils/error";
import { WebsocketHandler } from "../utils/type";
import z from "zod";
import { gameStartMessage } from "../utils/ResponseGenerator";

const bodyValidation = z.object({
  ready: z.boolean(),
  gameId: z.string().min(1),
});

export const readyHandler: WebsocketHandler = async (event, context) => {
  const { connectionId, send } = getAPIG(event, context);

  if (!event.body) {
    return await send({
      status: "REQUEST_ERROR",
      error: ERR_BAD_REQUEST,
    });
  }

  if (bodyValidation.safeParse(JSON.parse(event.body)).success === false) {
    return await send({
      status: "REQUEST_ERROR",
      error: ERR_BAD_REQUEST,
    });
  }

  const body = bodyValidation.parse(JSON.parse(event.body));
  const { ready, gameId } = body;

  console.log(event.body);

  const [user, isError] = await UserController.getUserMeta({
    connectionId,
  });

  console.log(user);

  if (isError) {
    return await send({
      status: "INTERNAL_ERROR",
      error: ERR_INTERNAL,
    });
  } else if (!user) {
    return await send({
      status: "REQUEST_ERROR",
      error: ERR_INVALID_USER,
    });
  }

  console.log(gameId);

  let [game, error] = await GameController.getGame({
    gameId,
  });

  console.log(game);

  if (error) {
    // Unknown error
    return await send({
      status: "INTERNAL_ERROR",
      error: ERR_INTERNAL,
    });
  } else if (!game) {
    // The game is not found
    return await send({
      status: "REQUEST_ERROR",
      error: ERR_INVALID_GAME,
    });
  } else if (
    // Find if the player saying ready is in the game or not?
    !game.players.find((player) => player.username === user.username) ||
    // There must be 2 players in the game to press ready
    game.players.length != 2
  ) {
    return await send({
      status: "REQUEST_ERROR",
      error: ERR_ILLEGAL_OPERATION,
    });
  }

  const [_, err] = await UserController.setReadyState(connectionId, ready);

  if (err) {
    return await send({
      status: "INTERNAL_ERROR",
      error: ERR_INTERNAL,
    });
  }

  [game] = await GameController.getGame({ gameId });

  console.log("BBBBBBBBBBBBBBB");
  console.log(game);

  if (!game) {
    return await send({
      status: "INTERNAL_ERROR",
      error: ERR_INTERNAL,
    });
  }

  await send({
    status: "OK",
    handler: "READY_STATE",

    content: ready,
  });

  /**
   * If the player choose to be ready, check if all players are ready
   */
  if (ready && game.players.length >= 2) {
    const allReady = game.players.every((player) => {
      return player.ready;
    });

    if (allReady) {
      // player connections
      const [playerA, playerB] = game.players;
      const [connectionA] = await UserController.getConnectionId({
        username: playerA.username,
      });
      const [connectionB] = await UserController.getConnectionId({
        username: playerB.username,
      });

      // start the game
      const [_1, err] = await GameController.startGame(gameId);

      // init the game
      const [_2, err2] = await GameActionController.initGame(gameId);

      if (err || err2) {
        await send(
          { status: "INTERNAL_ERROR", error: ERR_INTERNAL },
          connectionA
        );
        return await send(
          { status: "INTERNAL_ERROR", error: ERR_INTERNAL },
          connectionB
        );
      }

      if (!connectionA || !connectionB) {
        return await send({
          status: "INTERNAL_ERROR",
          error: ERR_INTERNAL,
        });
      }

      console.log("made apss it!");

      const [res, e] = await GameController.getGame({
        gameId,
      });

      if (e)
        return await send({
          status: "INTERNAL_ERROR",
          error: ERR_INTERNAL,
        });

      // send to A
      await send(gameStartMessage(res), connectionA);

      // send to be B
      return await send(gameStartMessage(res), connectionB);
    }
  }
};
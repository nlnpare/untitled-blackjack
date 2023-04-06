import fastify from "fastify";
import { userRouter } from "./http/v1/user";
import { gameRouter } from "./http/v1/game";
import { mongooseMiddleware } from "database";
import cors from "cors";

function init() {
  const app = fastify();

  // app.register(import("@fastify/middie"));
  // app.use(mongooseMiddleware);
  // app.use(
  //   cors({
  //     origin: "*",
  //   })
  // );

  app.get("/", (request, reply) => reply.send({ hello: "world" }));

  app.get("/ping", (request, reply) => reply.send("Pong"));

  app.get("/verbose", (req, rep) => rep.send(req));

  userRouter(app, "/user");
  gameRouter(app, "/game");

  return app;
}

export default init;

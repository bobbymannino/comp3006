import type { Server } from "node:http";
import { WebSocket, WebSocketServer } from "ws";
import { logger } from "./log.ts";

const log = logger("live");

/**
 * Every client listening for live posts.
 *
 * No not include a server since express does that, just redirect `upgrade`
 * events to WS
 */
const live = new WebSocketServer({ noServer: true });

/**
 * Accept WebSocket connections on the live posts path of a HTTP server.
 *
 * Since we only have one endpoint that requires a websocket we can skip a bit
 * of the logic
 */
export function attachLiveServer(server: Server) {
  server.on("upgrade", (req, socket, head) => {
    const url = new URL(req.url ?? "/", "http://localhost");

    if (url.pathname === "/api/posts") {
      live.handleUpgrade(req, socket, head, () => {
        log.debug(`Live client connected, ${live.clients.size} listening`);
      });
      return;
    }

    socket.destroy();
  });
}

/** Send a newly published post to every live client */
export function broadcastPost(post: object) {
  const message = JSON.stringify(post);
  for (const client of live.clients) {
    if (client.readyState === WebSocket.OPEN) client.send(message);
  }
}

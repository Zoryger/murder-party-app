import { Server as SocketIOServer } from "socket.io";
import type { Server as HttpServer } from "http";
import jwt from "jsonwebtoken";
import { Game, GamePlayer } from "../models/sequelize";
import { allowedOrigins } from "../config/cors";

interface SocketAuthPayload {
  userId: number;
  username: string;
  email: string;
}

let io: SocketIOServer | null = null;

export function initSockets(httpServer: HttpServer): SocketIOServer {
  io = new SocketIOServer(httpServer, {
    cors: { origin: allowedOrigins(), credentials: true },
  });

  // Vérifie le JWT à la connexion (le client l'envoie dans `auth.token`)
  io.use((socket, next) => {
    const token = socket.handshake.auth?.["token"];
    if (!token) return next(new Error("Token manquant."));

    try {
      const payload = jwt.verify(
        token,
        process.env["JWT_SECRET"]!,
      ) as SocketAuthPayload;
      socket.data["user"] = payload;
      next();
    } catch {
      next(new Error("Token invalide."));
    }
  });

  io.on("connection", (socket) => {
    const user = socket.data["user"] as SocketAuthPayload;

    socket.on("join-lobby", async (gameId: unknown) => {
      try {
        const id = Number(gameId);
        if (!Number.isInteger(id) || id < 1) return;

        const game = await Game.findByPk(id);
        if (!game) return;

        // Une partie en attente est ouverte à tous (le joueur n'est enregistré qu'une fois dans le salon).
        // Dès qu'elle a commencé, seuls le MJ et les joueurs de la partie écoutent ses événements.
        if (game.status !== "waiting") {
          const isGm = game.createdBy === user.userId;
          const isPlayer =
            !isGm &&
            (await GamePlayer.count({
              where: { gameId: id, userId: user.userId },
            })) > 0;
          if (!isGm && !isPlayer) return;
        }

        socket.join(`game:${id}`);
      } catch (err) {
        console.error("join-lobby :", err);
      }
    });

    socket.on("leave-lobby", (gameId: unknown) => {
      socket.leave(`game:${Number(gameId)}`);
    });
  });

  return io;
}

export function getIO(): SocketIOServer {
  if (!io) throw new Error("Socket.io n'est pas initialisé.");
  return io;
}

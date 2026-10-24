import "dotenv/config";
import express, { NextFunction, Request, Response } from "express";
import cors from "cors";
import helmet from "helmet";
import { rateLimit } from "express-rate-limit";
import { createServer } from "http";
import { syncDatabase } from "./models/sequelize";
import { initSockets } from "./sockets";
import { resumeOpenDuels } from "./utils/event.util";
import { allowedOrigins } from "./config/cors";
import authRoutes from "./routes/auth.routes";
import gameRoutes from "./routes/game.routes";
import scenarioRoutes from "./routes/scenario.routes";
import conversationRoutes from "./routes/conversation.routes";

const isProd = process.env["NODE_ENV"] === "production";

// Échec immédiat plutôt qu'un serveur qui démarre avec un secret absent ou trop faible
const jwtSecret = process.env["JWT_SECRET"];
if (!jwtSecret || (isProd && jwtSecret.length < 32)) {
  console.error(
    "❌ JWT_SECRET manquant (32 caractères minimum en production).",
  );
  process.exit(1);
}

const app = express();
const httpServer = createServer(app);
const PORT = Number(process.env["PORT"] ?? 3000);

app.set("trust proxy", 1); // Render place un proxy devant l'application (IP réelle, limitation de débit)
app.use(helmet({ crossOriginResourcePolicy: { policy: "cross-origin" } }));
app.use(cors({ origin: allowedOrigins(), credentials: true }));
app.use(express.json({ limit: "100kb" }));

// Anti-force-brute sur l'inscription et la connexion.
// Désactivé en développement pour ne pas gêner les tests avec beaucoup de comptes.
if (isProd) {
  app.use(
    "/api/auth",
    rateLimit({
      windowMs: 15 * 60 * 1000,
      limit: 100, // large : tous les joueurs d'une soirée partagent souvent la même box
      standardHeaders: "draft-7",
      legacyHeaders: false,
      message: {
        success: false,
        message: "Trop de tentatives, réessaie dans quelques minutes.",
      },
    }),
  );
}

app.use("/api/auth", authRoutes);
app.use("/api/games", gameRoutes);
app.use("/api/scenarios", scenarioRoutes);
app.use("/api/games/:id/conversations", conversationRoutes);

app.get("/api/health", (_req, res) => {
  res.json({ success: true, message: "API Murder Party opérationnelle 🔍" });
});

app.use((_req, res) => {
  res.status(404).json({ success: false, message: "Route introuvable." });
});

// Dernier filet : une erreur imprévue renvoie du JSON, jamais une trace d'exécution
app.use((err: unknown, _req: Request, res: Response, _next: NextFunction) => {
  console.error("Erreur non gérée :", err);
  res
    .status(500)
    .json({ success: false, message: "Erreur interne du serveur." });
});

process.on("unhandledRejection", (reason) => {
  console.error("Promesse rejetée non gérée :", reason);
});

syncDatabase().then(async () => {
  initSockets(httpServer);
  await resumeOpenDuels(); // reprend les duels laissés en cours par un redémarrage

  httpServer.listen(PORT, () => {
    console.log(
      `🔍 Serveur démarré sur le port ${PORT} (${isProd ? "production" : "développement"})`,
    );
    console.log(`🌐 Origines autorisées : ${allowedOrigins().join(", ")}`);
  });
});

import { Request, Response, NextFunction } from "express";
import { Game } from "../models/sequelize";
import { getActiveEffect } from "../utils/event.util";

// À placer APRÈS requireAuth. Renvoie 503 tant qu'une panne réseau est en cours.
// Le MJ n'est jamais bloqué.
export async function blackoutGuard(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const gameId = Number(req.params["id"]);
    if (!gameId) {
      next();
      return;
    }

    const game = await Game.findByPk(gameId);
    if (!game || game.createdBy === req.user?.userId) {
      next();
      return;
    }

    const blackout = await getActiveEffect(gameId, "blackout");
    if (blackout) {
      res.status(503).json({
        success: false,
        code: "BLACKOUT",
        message:
          "⚡ Panne réseau magique en cours : messageries, pouvoirs et indices sont hors service.",
        endsAt: blackout.endsAt,
      });
      return;
    }

    next();
  } catch (err) {
    next(err);
  }
}

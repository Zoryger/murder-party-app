import { Request, Response } from "express";
import {
  sequelize,
  Game,
  GamePlayer,
  MoneyTransfer,
  AlchemistRequest,
  PowerUse,
} from "../models/sequelize";
import { resolvePowerAccess } from "../utils/power.util";
import { ALCHEMIST_COST } from "../config/game.rules";
import { getIO } from "../sockets";

function notifyMoney(gameId: number): void {
  getIO().to(`game:${gameId}`).emit("money:update");
}

function notifyAlchemist(gameId: number): void {
  getIO().to(`game:${gameId}`).emit("alchemist:update");
}

// ── GET /api/games/:id/wallet ────────────────────────────────────────────────
export async function getWallet(req: Request, res: Response): Promise<void> {
  const gameId = Number(req.params["id"]);

  const me = await GamePlayer.findOne({
    where: { gameId, userId: req.user!.userId },
  });
  if (!me) {
    res
      .status(403)
      .json({ success: false, message: "Vous n'êtes pas dans cette partie." });
    return;
  }

  // Le panneau Alchimiste n'apparaît que si la partie est en cours, qu'on est vivant
  // et qu'on possède (ou emprunte via l'Horcruxe) ce pouvoir
  const access = await resolvePowerAccess(
    gameId,
    req.user!.userId,
    "alchimiste",
  );

  res.json({
    success: true,
    data: {
      playerId: me.id,
      money: me.money,
      status: me.status,
      alchemist: { enabled: !("error" in access), cost: ALCHEMIST_COST },
    },
  });
}

// ── POST /api/games/:id/money/transfer ───────────────────────────────────────
export async function transferMoney(
  req: Request,
  res: Response,
): Promise<void> {
  const gameId = Number(req.params["id"]);
  const toPlayerId = Number(req.body.toPlayerId);
  const amount = Number(req.body.amount);

  if (!Number.isInteger(amount) || amount < 1) {
    res
      .status(400)
      .json({
        success: false,
        message: "Le montant doit être un nombre entier positif.",
      });
    return;
  }

  const game = await Game.findByPk(gameId);
  if (!game || game.status !== "active") {
    res
      .status(400)
      .json({ success: false, message: "La partie n'est pas en cours." });
    return;
  }

  const me = await GamePlayer.findOne({
    where: { gameId, userId: req.user!.userId },
  });
  if (!me) {
    res
      .status(403)
      .json({ success: false, message: "Vous n'êtes pas dans cette partie." });
    return;
  }
  if (me.status !== "alive") {
    res
      .status(403)
      .json({
        success: false,
        message: "Les fantômes ne peuvent ni donner ni recevoir d'argent.",
      });
    return;
  }
  if (!toPlayerId || toPlayerId === me.id) {
    res
      .status(400)
      .json({ success: false, message: "Choisissez un autre joueur." });
    return;
  }

  type TxResult =
    | { ok: true; toName: string; balance: number }
    | { ok: false; status: number; message: string };

  const result = await sequelize.transaction(async (t): Promise<TxResult> => {
    const rows = await GamePlayer.findAll({
      where: { id: [me.id, toPlayerId], gameId },
      order: [["id", "ASC"]],
      transaction: t,
      lock: t.LOCK.UPDATE,
    });
    const from = rows.find((r) => r.id === me.id);
    const to = rows.find((r) => r.id === toPlayerId);

    if (!from || !to)
      return { ok: false, status: 404, message: "Joueur introuvable." };
    if (from.status !== "alive")
      return {
        ok: false,
        status: 403,
        message: "Les fantômes ne peuvent ni donner ni recevoir d'argent.",
      };
    if (to.status !== "alive")
      return {
        ok: false,
        status: 400,
        message: `${to.characterName} est un fantôme : il ne peut plus recevoir d'argent.`,
      };
    if (from.money < amount)
      return {
        ok: false,
        status: 400,
        message: `Solde insuffisant : vous avez ${from.money} G.`,
      };

    const balance = from.money - amount;
    await from.update({ money: balance }, { transaction: t });
    await to.update({ money: to.money + amount }, { transaction: t });
    await MoneyTransfer.create(
      { gameId, fromPlayerId: from.id, toPlayerId: to.id, amount },
      { transaction: t },
    );

    return { ok: true, toName: to.characterName, balance };
  });

  if (!result.ok) {
    res.status(result.status).json({ success: false, message: result.message });
    return;
  }

  notifyMoney(gameId);

  res.status(201).json({
    success: true,
    message: `Vous avez donné ${amount} G à ${result.toName}. Il vous reste ${result.balance} G.`,
  });
}

// ── POST /api/games/:id/powers/alchimiste ────────────────────────────────────
export async function useAlchimiste(
  req: Request,
  res: Response,
): Promise<void> {
  const gameId = Number(req.params["id"]);
  const access = await resolvePowerAccess(
    gameId,
    req.user!.userId,
    "alchimiste",
  );
  if ("error" in access) {
    res.status(access.status).json({ success: false, message: access.error });
    return;
  }
  const { actor, owner } = access;

  const question = String(req.body.question ?? "").trim();
  if (question.length < 5 || question.length > 300) {
    res
      .status(400)
      .json({
        success: false,
        message:
          "Posez une question fermée de 5 à 300 caractères (réponse OUI ou NON).",
      });
    return;
  }

  type TxResult =
    | { ok: true; balance: number }
    | { ok: false; message: string };

  // Paiement + création de la question dans une seule transaction : pas d'argent perdu sans question
  const result = await sequelize.transaction(async (t): Promise<TxResult> => {
    const payer = await GamePlayer.findByPk(actor.id, {
      transaction: t,
      lock: t.LOCK.UPDATE,
    });
    if (!payer || payer.money < ALCHEMIST_COST) {
      return {
        ok: false,
        message: `Il vous faut ${ALCHEMIST_COST} G pour interroger le MJ (vous avez ${payer?.money ?? 0} G). Demandez à un autre joueur de vous en donner.`,
      };
    }

    const balance = payer.money - ALCHEMIST_COST;
    await payer.update({ money: balance }, { transaction: t });

    const request = await AlchemistRequest.create(
      {
        gameId,
        playerId: actor.id,
        question,
        cost: ALCHEMIST_COST,
        status: "pending",
      },
      { transaction: t },
    );
    await PowerUse.create(
      {
        gameId,
        gamePlayerId: actor.id,
        ownerPlayerId: owner.id,
        powerSlug: "alchimiste",
        payload: String(request.id),
      },
      { transaction: t },
    );

    return { ok: true, balance };
  });

  if (!result.ok) {
    res.status(400).json({ success: false, message: result.message });
    return;
  }

  notifyMoney(gameId);
  notifyAlchemist(gameId);

  res.status(201).json({
    success: true,
    message: `Question transmise au MJ (${ALCHEMIST_COST} G débités). Il vous reste ${result.balance} G.`,
  });
}

// ── GET /api/games/:id/alchemist/requests (mes questions) ────────────────────
export async function getMyAlchemistRequests(
  req: Request,
  res: Response,
): Promise<void> {
  const gameId = Number(req.params["id"]);

  const me = await GamePlayer.findOne({
    where: { gameId, userId: req.user!.userId },
  });
  if (!me) {
    res
      .status(403)
      .json({ success: false, message: "Vous n'êtes pas dans cette partie." });
    return;
  }

  const rows = await AlchemistRequest.findAll({
    where: { gameId, playerId: me.id },
    order: [
      ["createdAt", "DESC"],
      ["id", "DESC"],
    ],
  });

  res.json({
    success: true,
    data: rows.map((r) => ({
      id: r.id,
      question: r.question,
      cost: r.cost,
      status: r.status,
      answer: r.answer,
      createdAt: r.createdAt,
      answeredAt: r.answeredAt,
    })),
  });
}

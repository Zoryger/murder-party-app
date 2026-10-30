import { Request, Response } from "express";
import { Op } from "sequelize";
import {
  Game,
  GamePlayer,
  Conversation,
  Message,
  CodeUnlock,
  PowerUse,
} from "../models/sequelize";
import { getIO } from "../sockets";
import { hasActiveVisionAbsolue } from "../utils/vision.util";
import { resolvePlayerByCode } from "../utils/event.util"; // ← 5.6

async function getMyGamePlayer(gameId: number, userId: number) {
  return GamePlayer.findOne({ where: { gameId, userId } });
}

function formatConversation(
  conv: Conversation,
  meId: number,
  nameById: Map<number, string>,
  lastMessage: Message | null,
  visionActive: boolean,
  category: "base" | "hacked" | "power",
) {
  const isOwn = conv.player1Id === meId || conv.player2Id === meId;
  const isCreatedByMe = conv.createdBy === meId && !isOwn;
  const canDetectManipulation = conv.isFake && (visionActive || isCreatedByMe);
  let otherPlayerId: number | null = null;
  let displayLabel: string;

  if (isOwn) {
    otherPlayerId = conv.player1Id === meId ? conv.player2Id : conv.player1Id;
    displayLabel = nameById.get(otherPlayerId) ?? "???";
  } else {
    displayLabel = `${nameById.get(conv.player1Id) ?? "???"} ↔ ${nameById.get(conv.player2Id) ?? "???"}`;
  }

  return {
    id: conv.id,
    isOwn,
    isCreatedByMe,
    isFake: visionActive ? conv.isFake : false,
    category: canDetectManipulation ? "power" : category,
    otherPlayerId,
    displayLabel,
    lastMessage: lastMessage
      ? {
          content: lastMessage.content,
          sentAt: lastMessage.createdAt,
          senderName: nameById.get(lastMessage.senderId) ?? "???",
        }
      : null,
  };
}

// ── GET /api/games/:id/conversations ──────────────────────────────────────
export async function getMyConversations(
  req: Request,
  res: Response,
): Promise<void> {
  const gameId = Number(req.params["id"]);
  const me = await getMyGamePlayer(gameId, req.user!.userId);
  if (!me) {
    res
      .status(403)
      .json({ success: false, message: "Vous n'êtes pas dans cette partie." });
    return;
  }

  // Les cibles voient une fausse conversation comme un fil normal ; seul son créateur et la Vision absolue la détectent.
  const ownConversations = await Conversation.findAll({
    where: {
      gameId,
      [Op.or]: [{ player1Id: me.id }, { player2Id: me.id }],
    },
  });
  const createdConversations = await Conversation.findAll({
    where: { gameId, createdBy: me.id },
  });

  const unlocks = await CodeUnlock.findAll({
    where: { gameId, unlockedByPlayerId: me.id },
  });
  const hackedIds = unlocks.map((u) => u.targetPlayerId);
  const hackedPlayerIds = new Set(hackedIds);

  let codeHackedConversations: Conversation[] = [];
  if (hackedIds.length > 0) {
    codeHackedConversations = await Conversation.findAll({
      where: {
        gameId,
        [Op.or]: [
          { player1Id: { [Op.in]: hackedIds } },
          { player2Id: { [Op.in]: hackedIds } },
        ],
      },
    });
  }

  const powerHacks = await PowerUse.findAll({
    where: {
      gameId,
      gamePlayerId: me.id,
      powerSlug: "informaticien",
      conversationId: { [Op.not]: null },
    },
  });
  const powerHackedIds = powerHacks
    .map((h) => h.conversationId!)
    .filter((id) => id !== null);
  const powerHackedIdSet = new Set(powerHackedIds);
  let powerHackedConversations: Conversation[] = [];
  if (powerHackedIds.length > 0) {
    powerHackedConversations = await Conversation.findAll({
      where: { id: { [Op.in]: powerHackedIds } },
    });
  }

  const allConversations = [
    ...ownConversations,
    ...createdConversations,
    ...codeHackedConversations,
    ...powerHackedConversations,
  ].filter((c, i, arr) => arr.findIndex((x) => x.id === c.id) === i);

  const players = await GamePlayer.findAll({ where: { gameId } });
  const nameById = new Map(players.map((p) => [p.id, p.characterName]));
  const visionActive = await hasActiveVisionAbsolue(me.id);

  const result = await Promise.all(
    allConversations.map(async (conv) => {
      const lastMessage = await Message.findOne({
        where: { conversationId: conv.id },
        order: [["createdAt", "DESC"]],
      });
      return formatConversation(
        conv,
        me.id,
        nameById,
        lastMessage,
        visionActive,
        conv.player1Id === me.id || conv.player2Id === me.id
          ? "base"
          : powerHackedIdSet.has(conv.id) || conv.createdBy === me.id
            ? "power"
          : hackedPlayerIds.has(conv.player1Id) || hackedPlayerIds.has(conv.player2Id)
            ? "hacked"
            : "power",
      );
    }),
  );

  result.sort((a, b) => {
    const at = a.lastMessage ? new Date(a.lastMessage.sentAt).getTime() : 0;
    const bt = b.lastMessage ? new Date(b.lastMessage.sentAt).getTime() : 0;
    return bt - at;
  });

  res.json({ success: true, data: result });
}

// ── POST /api/games/:id/conversations ─────────────────────────────────────
export async function getOrCreateConversation(
  req: Request,
  res: Response,
): Promise<void> {
  const gameId = Number(req.params["id"]);
  const game = await Game.findByPk(gameId);
  if (!game) {
    res.status(404).json({ success: false, message: "Partie introuvable." });
    return;
  }
  if (game.status !== "active") {
    res
      .status(400)
      .json({ success: false, message: "La partie n'a pas encore commencé." });
    return;
  }

  const me = await getMyGamePlayer(gameId, req.user!.userId);
  if (!me) {
    res
      .status(403)
      .json({ success: false, message: "Vous n'êtes pas dans cette partie." });
    return;
  }

  const withPlayerId = Number(req.body.withPlayerId);
  if (withPlayerId === me.id) {
    res
      .status(400)
      .json({
        success: false,
        message: "Impossible de discuter avec vous-même.",
      });
    return;
  }

  const other = await GamePlayer.findOne({
    where: { id: withPlayerId, gameId },
  });
  if (!other) {
    res.status(404).json({ success: false, message: "Joueur introuvable." });
    return;
  }
  if (other.status !== me.status) {
    res.status(403).json({
      success: false,
      message:
        me.status === "ghost"
          ? "Les fantômes peuvent uniquement discuter entre eux."
          : "Les joueurs vivants peuvent uniquement discuter entre eux.",
    });
    return;
  }

  let conversation = await Conversation.findOne({
    where: {
      gameId,
      isFake: false,
      [Op.or]: [
        { player1Id: me.id, player2Id: withPlayerId },
        { player1Id: withPlayerId, player2Id: me.id },
      ],
    },
  });

  if (!conversation) {
    conversation = await Conversation.create({
      gameId,
      player1Id: me.id,
      player2Id: withPlayerId,
      isFake: false,
    });
    getIO().to(`game:${gameId}`).emit("conversation:update");
  }

  res.status(201).json({ success: true, data: { id: conversation.id } });
}

// ── GET /api/games/:id/conversations/:conversationId/messages ────────────
export async function getMessages(req: Request, res: Response): Promise<void> {
  const gameId = Number(req.params["id"]);
  const conversationId = Number(req.params["conversationId"]);

  const me = await getMyGamePlayer(gameId, req.user!.userId);
  if (!me) {
    res
      .status(403)
      .json({ success: false, message: "Vous n'êtes pas dans cette partie." });
    return;
  }

  const conversation = await Conversation.findOne({
    where: { id: conversationId, gameId },
  });
  if (!conversation) {
    res
      .status(404)
      .json({ success: false, message: "Conversation introuvable." });
    return;
  }

  const isRealParticipant =
    conversation.player1Id === me.id || conversation.player2Id === me.id;
  let hasAccess = isRealParticipant;

  if (!hasAccess) {
    const unlock = await CodeUnlock.findOne({
      where: {
        gameId,
        unlockedByPlayerId: me.id,
        targetPlayerId: {
          [Op.in]: [conversation.player1Id, conversation.player2Id],
        },
      },
    });
    hasAccess = !!unlock;
  }

  if (!hasAccess) {
    const powerHack = await PowerUse.findOne({
      where: {
        gameId,
        gamePlayerId: me.id,
        powerSlug: "informaticien",
        conversationId,
      },
    });
    hasAccess = !!powerHack;
  }

  if (!hasAccess && conversation.createdBy === me.id) hasAccess = true; // l'Usurpateur peut relire ce qu'il a fabriqué

  if (!hasAccess) {
    res
      .status(403)
      .json({
        success: false,
        message: "Vous n'avez pas accès à cette conversation.",
      });
    return;
  }

  const visionActive = await hasActiveVisionAbsolue(me.id);
  const messages = await Message.findAll({
    where: { conversationId },
    order: [["createdAt", "ASC"]],
  });
  const players = await GamePlayer.findAll({ where: { gameId } });
  const nameById = new Map(players.map((p) => [p.id, p.characterName]));
  const otherPlayerId =
    conversation.player1Id === me.id
      ? conversation.player2Id
      : conversation.player1Id;
  const otherPlayer = players.find((player) => player.id === otherPlayerId);

  res.json({
    success: true,
    data: {
      isParticipant: isRealParticipant,
      isCreatedByMe: conversation.createdBy === me.id && !isRealParticipant,
      canWrite:
        isRealParticipant && !!otherPlayer && me.status === otherPlayer.status,
      isFake: visionActive ? conversation.isFake : false,
      participants: [
        {
          id: conversation.player1Id,
          characterName: nameById.get(conversation.player1Id) ?? "???",
        },
        {
          id: conversation.player2Id,
          characterName: nameById.get(conversation.player2Id) ?? "???",
        },
      ],
      messages: messages.map((m) => ({
        id: m.id,
        senderId: m.senderId,
        senderName: nameById.get(m.senderId) ?? "???",
        content: m.content,
        sentAt: m.createdAt,
      })),
    },
  });
}

// ── POST /api/games/:id/conversations/:conversationId/messages ───────────
export async function sendMessage(req: Request, res: Response): Promise<void> {
  const gameId = Number(req.params["id"]);
  const conversationId = Number(req.params["conversationId"]);

  const game = await Game.findByPk(gameId);
  if (!game) {
    res.status(404).json({ success: false, message: "Partie introuvable." });
    return;
  }
  if (game.status !== "active") {
    res
      .status(400)
      .json({ success: false, message: "La partie n'a pas encore commencé." });
    return;
  }

  const me = await getMyGamePlayer(gameId, req.user!.userId);
  if (!me) {
    res
      .status(403)
      .json({ success: false, message: "Vous n'êtes pas dans cette partie." });
    return;
  }

  const content = String(req.body.content ?? "").trim();
  if (!content) {
    res.status(400).json({ success: false, message: "Message vide." });
    return;
  }

  const conversation = await Conversation.findOne({
    where: { id: conversationId, gameId },
  });
  if (!conversation) {
    res
      .status(404)
      .json({ success: false, message: "Conversation introuvable." });
    return;
  }

  // Les cibles continuent une conversation falsifiée comme un fil normal ; seul son créateur ne peut y écrire.
  const isParticipant =
    (conversation.player1Id === me.id || conversation.player2Id === me.id) &&
    conversation.createdBy !== me.id;
  if (!isParticipant) {
    res
      .status(403)
      .json({
        success: false,
        message: "Vous ne pouvez pas écrire dans cette conversation.",
      });
    return;
  }
  const otherPlayerId =
    conversation.player1Id === me.id
      ? conversation.player2Id
      : conversation.player1Id;
  const other = await GamePlayer.findOne({
    where: { id: otherPlayerId, gameId },
  });
  if (!other || other.status !== me.status) {
    res.status(403).json({
      success: false,
      message:
        me.status === "ghost"
          ? "Les fantômes peuvent uniquement discuter avec des fantômes."
          : "Les joueurs vivants peuvent uniquement discuter avec des joueurs vivants.",
    });
    return;
  }

  const message = await Message.create({
    conversationId,
    senderId: me.id,
    content,
  });

  getIO().to(`game:${gameId}`).emit("message:new", { conversationId });

  res.status(201).json({
    success: true,
    data: {
      id: message.id,
      senderId: me.id,
      content: message.content,
      sentAt: message.createdAt,
    },
  });
}

// ── POST /api/games/:id/redeem-code ───────────────────────────────────────
export async function redeemCode(req: Request, res: Response): Promise<void> {
  const gameId = Number(req.params["id"]);

  const game = await Game.findByPk(gameId);
  if (!game) {
    res.status(404).json({ success: false, message: "Partie introuvable." });
    return;
  }
  if (game.status !== "active") {
    res
      .status(400)
      .json({ success: false, message: "La partie n'a pas encore commencé." });
    return;
  }

  const me = await getMyGamePlayer(gameId, req.user!.userId);
  if (!me) {
    res
      .status(403)
      .json({ success: false, message: "Vous n'êtes pas dans cette partie." });
    return;
  }

  const code = String(req.body.code ?? "").trim();
  if (!code) {
    res.status(400).json({ success: false, message: "Code requis." });
    return;
  }

  const target = await resolvePlayerByCode(gameId, code); // ← 5.6 (tient compte de l'inversion)
  if (!target) {
    res.status(404).json({ success: false, message: "Code invalide." });
    return;
  }
  if (target.id === me.id) {
    res
      .status(400)
      .json({ success: false, message: "C'est votre propre code." });
    return;
  }

  const existing = await CodeUnlock.findOne({
    where: { gameId, unlockedByPlayerId: me.id, targetPlayerId: target.id },
  });
  if (existing) {
    res.json({
      success: true,
      message: `Vous avez déjà piraté ${target.characterName}.`,
      data: { characterName: target.characterName },
    });
    return;
  }

  await CodeUnlock.create({
    gameId,
    unlockedByPlayerId: me.id,
    targetPlayerId: target.id,
  });

  getIO().to(`game:${gameId}`).emit("code:unlocked", {});

  res.status(201).json({
    success: true,
    message: `Code valide — vous avez piraté la messagerie de ${target.characterName} !`,
    data: { characterName: target.characterName },
  });
}

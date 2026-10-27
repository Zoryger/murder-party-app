import { Router } from "express";
import { body, param } from "express-validator";
import {
  getGames,
  getGameById,
  createGame,
  getGameByCode,
  updateGameStatus,
} from "../controllers/game.controller";
import {
  joinGame,
  getPlayers,
  getAssignableCharacters,
  assignCharacters,
  assignManual,
  startGame,
  getMyCharacterSheet,
} from "../controllers/gamePlayer.controller";
import { redeemCode } from "../controllers/conversation.controller";
import {
  getMyPower,
  useVoyante,
  useAnalyseurRelations,
  useInformaticien,
  useFalsificateur,
  useUsurpateur,
  useVisionAbsolue,
  useChasseurDePrimes,
  useNecromancien,
  useHorcruxe,
  useCupidon,
} from "../controllers/power.controller";
import {
  getEvents,
  voteDuel,
  cancelBlackout,
  useDuelliste,
  useInversionFrequence,
  useBrouilleurIem,
} from "../controllers/event.controller";
import {
  getWallet,
  transferMoney,
  useAlchimiste,
  getMyAlchemistRequests,
} from "../controllers/economy.controller";
import {
  getGmOverview,
  getGmAlchemistRequests,
  answerAlchemistRequest,
} from "../controllers/gm.controller";
import {
  getPhase,
  getFinalForm,
  submitFinal,
  getFinalStatus,
  closeGame,
  reopenGame,
  revealGame,
  getResults,
} from "../controllers/finale.controller";
import { getClueBoard, unlockClue } from "../controllers/clue.controller";
import { validate } from "../middleware/validate.middleware";
import { requireAuth } from "../middleware/auth.middleware";
import { blackoutGuard } from "../middleware/blackout.middleware";

const router = Router();

const createRules = [
  body("name")
    .trim()
    .isLength({ min: 3, max: 60 })
    .withMessage("Nom requis (3–60 car.)."),
  body("theme").trim().notEmpty().withMessage("Thème requis."),
  body("synopsis")
    .trim()
    .isLength({ min: 30 })
    .withMessage("Synopsis trop court (30 car. min)."),
  body("maxPlayers")
    .isInt({ min: 4, max: 20 })
    .withMessage("Entre 4 et 20 joueurs."),
  body("scenarioId")
    .optional({ nullable: true })
    .isInt()
    .withMessage("Scénario invalide."),
];

router.get("/", getGames);
router.get("/join/:code", getGameByCode);
router.get("/:id", getGameById);
router.post("/", requireAuth, createRules, validate, createGame);
router.patch(
  "/:id/status",
  requireAuth,
  [param("id").isInt(), body("status").isIn(["waiting", "active", "finished"])],
  validate,
  updateGameStatus,
);

router.post("/:id/join", requireAuth, joinGame);
router.get("/:id/players", requireAuth, getPlayers);
router.get("/:id/assignable-characters", requireAuth, getAssignableCharacters);
router.post("/:id/assign-characters", requireAuth, assignCharacters);
router.post("/:id/assign-manual", requireAuth, assignManual);
router.post("/:id/start", requireAuth, startGame);
router.get("/:id/me", requireAuth, getMyCharacterSheet);

// ── Soumis à la panne réseau (le MJ n'est jamais bloqué) ──────────────────────
router.post("/:id/redeem-code", requireAuth, blackoutGuard, redeemCode);
router.get("/:id/clues", requireAuth, blackoutGuard, getClueBoard);
router.post("/:id/clues/unlock", requireAuth, blackoutGuard, unlockClue);

// ── Événements : état, vote de duel, annulation de panne (MJ) ────────────────
router.get("/:id/events", requireAuth, getEvents);
router.post("/:id/duels/:duelId/vote", requireAuth, voteDuel);
router.post("/:id/events/cancel-blackout", requireAuth, cancelBlackout);

// ── Argent ────────────────────────────────────────────────────────────────────
router.get("/:id/wallet", requireAuth, getWallet);
router.post("/:id/money/transfer", requireAuth, blackoutGuard, transferMoney);
router.get("/:id/alchemist/requests", requireAuth, getMyAlchemistRequests);

// ── Fin de partie : étape, formulaire final, résultats ───────────────────────
router.get("/:id/phase", requireAuth, getPhase);
router.get("/:id/final", requireAuth, getFinalForm);
router.post("/:id/final", requireAuth, submitFinal);
router.get("/:id/results", requireAuth, getResults);

// ── Console du MJ ─────────────────────────────────────────────────────────────
router.get("/:id/gm/overview", requireAuth, getGmOverview);
router.get("/:id/gm/alchemist", requireAuth, getGmAlchemistRequests);
router.post(
  "/:id/gm/alchemist/:requestId/answer",
  requireAuth,
  answerAlchemistRequest,
);
router.get("/:id/gm/final-status", requireAuth, getFinalStatus);
router.post("/:id/gm/close", requireAuth, closeGame);
router.post("/:id/gm/reopen", requireAuth, reopenGame);
router.post("/:id/gm/reveal", requireAuth, revealGame);

// ── Pouvoirs ───────────────────────────────────────────────────────────────
router.get("/:id/my-power", requireAuth, getMyPower);
router.post("/:id/powers/voyante", requireAuth, blackoutGuard, useVoyante);
router.post(
  "/:id/powers/analyseur-relations",
  requireAuth,
  blackoutGuard,
  useAnalyseurRelations,
);
router.post(
  "/:id/powers/informaticien",
  requireAuth,
  blackoutGuard,
  useInformaticien,
);
router.post(
  "/:id/powers/falsificateur",
  requireAuth,
  blackoutGuard,
  useFalsificateur,
);
router.post(
  "/:id/powers/usurpateur",
  requireAuth,
  blackoutGuard,
  useUsurpateur,
);
router.post(
  "/:id/powers/vision-absolue",
  requireAuth,
  blackoutGuard,
  useVisionAbsolue,
);
router.post(
  "/:id/powers/chasseur-de-primes",
  requireAuth,
  blackoutGuard,
  useChasseurDePrimes,
);
router.post(
  "/:id/powers/necromancien",
  requireAuth,
  blackoutGuard,
  useNecromancien,
);
router.post("/:id/powers/horcruxe", requireAuth, blackoutGuard, useHorcruxe);
router.post("/:id/powers/cupidon", requireAuth, blackoutGuard, useCupidon);
router.post("/:id/powers/duelliste", requireAuth, blackoutGuard, useDuelliste);
router.post(
  "/:id/powers/inversion-de-frequence",
  requireAuth,
  blackoutGuard,
  useInversionFrequence,
);
router.post(
  "/:id/powers/brouilleur-iem",
  requireAuth,
  blackoutGuard,
  useBrouilleurIem,
);
router.post(
  "/:id/powers/alchimiste",
  requireAuth,
  blackoutGuard,
  useAlchimiste,
);

export default router;

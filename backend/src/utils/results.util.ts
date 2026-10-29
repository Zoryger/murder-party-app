import {
  Game,
  GamePlayer,
  User,
  Scenario,
  ScenarioCharacter,
  ScenarioPlotThread,
  FinalSubmission,
  FinalAccusation,
  LoveBond,
} from "../models/sequelize";
import { MURDERERS_COUNT, UNMASKED_THRESHOLD } from "../config/game.rules";

export type Verdict = "won" | "lost" | "review";
export type ObjectiveKind = "camouflage" | "investigate" | "love" | "special";

interface Evaluation {
  objectiveKind: ObjectiveKind;
  objectiveLabel: string;
  verdict: Verdict;
  detail: string;
}

const KNOWLEDGE_LABEL: Record<string, string> = {
  full: "Sait qu'ils sont 3 (le complice)",
  partial: "Sait qu'ils sont 2 (l'instigateur)",
  none: "Pense être le seul meurtrier (l'exécuteur)",
  not_applicable: "",
};

export async function buildResults(game: Game) {
  const players = await GamePlayer.findAll({
    where: { gameId: game.id },
    order: [["createdAt", "ASC"]],
  });

  const userIds = players
    .map((p) => p.userId)
    .filter((id): id is number => id !== null);
  const users = await User.findAll({ where: { id: userIds } });
  const usernameById = new Map(users.map((u) => [u.id, u.username]));
  const playerById = new Map(players.map((p) => [p.id, p]));

  const characterIds = players
    .map((p) => p.scenarioCharacterId)
    .filter((id): id is number => id !== null);
  const characters = await ScenarioCharacter.findAll({
    where: { id: characterIds },
  });
  const characterById = new Map(characters.map((c) => [c.id, c]));

  const submissions = await FinalSubmission.findAll({
    where: { gameId: game.id },
  });
  const accusations =
    submissions.length > 0
      ? await FinalAccusation.findAll({
          where: { submissionId: submissions.map((s) => s.id) },
        })
      : [];
  const bonds = await LoveBond.findAll({ where: { gameId: game.id } });

  const murdererIds = new Set(
    players.filter((p) => p.isMurderer).map((p) => p.id),
  );
  const submissionByPlayer = new Map(submissions.map((s) => [s.playerId, s]));
  const accusationsOf = (submissionId: number) =>
    accusations.filter((a) => a.submissionId === submissionId);

  // Accusations reçues par un joueur, hors accusation de soi-même
  const accusedBy = (playerId: number): number =>
    submissions.filter(
      (s) =>
        s.playerId !== playerId &&
        accusationsOf(s.id).some((a) => a.accusedPlayerId === playerId),
    ).length;

  const othersCount = (playerId: number): number =>
    submissions.filter((s) => s.playerId !== playerId).length;

  // « Démasqué » : accusé par PLUS de la moitié des autres joueurs qui ont répondu
  const isUnmasked = (playerId: number): boolean => {
    const others = othersCount(playerId);
    return others > 0 && accusedBy(playerId) > others * UNMASKED_THRESHOLD;
  };

  // ── Verdict de chaque joueur selon son objectif ───────────────────────────
  const evaluate = (p: GamePlayer): Evaluation => {
    const bond = bonds.find(
      (b) => b.player1Id === p.id || b.player2Id === p.id,
    );

    // Lié par Cupidon : cet objectif remplace l'objectif d'origine
    if (bond) {
      const partner = playerById.get(
        bond.player1Id === p.id ? bond.player2Id : bond.player1Id,
      );
      const bothAlive = p.status === "alive" && partner?.status === "alive";
      const bothCleared =
        !isUnmasked(p.id) && (partner ? !isUnmasked(partner.id) : true);
      return {
        objectiveKind: "love",
        objectiveLabel: `Survivre et être innocenté(e) avec ${partner?.characterName ?? "???"}`,
        verdict: bothAlive && bothCleared ? "won" : "lost",
        detail:
          `${bothAlive ? "Les deux sont en vie" : "Au moins un des deux est un fantôme"} · ` +
          `${bothCleared ? "aucun démasqué" : "au moins un démasqué"}`,
      };
    }

    // Dylan (exécuteur) : objectif de compréhension, jugé par le MJ
    if (p.isMurderer && p.murderKnowledge === "none") {
      const character = p.scenarioCharacterId
        ? characterById.get(p.scenarioCharacterId)
        : undefined;
      return {
        objectiveKind: "special",
        objectiveLabel: character?.objective ?? "Objectif spécial",
        verdict: "review",
        detail: "À juger par le MJ d'après ses notes.",
      };
    }

    // Complice et instigateur : camoufler le crime
    if (p.isMurderer) {
      return {
        objectiveKind: "camouflage",
        objectiveLabel: "Camoufler son crime et se faire passer pour innocent",
        verdict: isUnmasked(p.id) ? "lost" : "won",
        detail: `Accusé par ${accusedBy(p.id)} joueur(s) sur ${othersCount(p.id)}`,
      };
    }

    // Innocents : démasquer les trois meurtriers
    const investigate = {
      objectiveKind: "investigate" as const,
      objectiveLabel:
        "Découvrir l'identité du ou des meurtrier(s), la chaîne des événements et le ou leurs mobile(s).",
    };
    const submission = submissionByPlayer.get(p.id);
    if (!submission)
      return {
        ...investigate,
        verdict: "lost",
        detail: "Aucune réponse rendue",
      };

    const correct = accusationsOf(submission.id).filter((a) =>
      murdererIds.has(a.accusedPlayerId),
    ).length;
    return {
      ...investigate,
      verdict: correct === MURDERERS_COUNT ? "won" : "lost",
      detail: `${correct}/${MURDERERS_COUNT} meurtriers identifiés`,
    };
  };

  const verdicts = players.map((p) => ({
    playerId: p.id,
    username: p.userId ? (usernameById.get(p.userId) ?? null) : null,
    characterName: p.characterName,
    isMurderer: p.isMurderer,
    status: p.status,
    submitted: submissionByPlayer.has(p.id),
    ...evaluate(p),
  }));

  // ── Décompte des accusations ─────────────────────────────────────────────
  const tally = players
    .map((p) => ({
      playerId: p.id,
      characterName: p.characterName,
      isMurderer: p.isMurderer,
      accusedCount: accusedBy(p.id),
      unmasked: isUnmasked(p.id),
    }))
    .sort((a, b) => b.accusedCount - a.accusedCount);

  // ── Réponses détaillées (le contrôleur décide qui les voit) ──────────────
  const answers = submissions.map((s) => {
    const owner = playerById.get(s.playerId);
    const accusationViews = accusationsOf(s.id).map((a) => ({
      accusedName: playerById.get(a.accusedPlayerId)?.characterName ?? "???",
      isCorrect: murdererIds.has(a.accusedPlayerId),
      mobile: a.mobile,
    }));

    return {
      playerId: s.playerId,
      username: owner?.userId ? (usernameById.get(owner.userId) ?? null) : null,
      characterName: owner?.characterName ?? "???",
      weapon: s.weapon,
      subplots: s.subplots,
      objectiveNotes: s.objectiveNotes,
      correctCount: accusationViews.filter((a) => a.isCorrect).length,
      accusations: accusationViews,
      submittedAt: s.updatedAt,
    };
  });

  // ── La solution ──────────────────────────────────────────────────────────
  const scenario = game.scenarioId
    ? await Scenario.findByPk(game.scenarioId)
    : null;
  const plotThreads = game.scenarioId
    ? await ScenarioPlotThread.findAll({
        where: { scenarioId: game.scenarioId },
      })
    : [];

  const murderers = players
    .filter((p) => p.isMurderer)
    .map((p) => {
      const character = p.scenarioCharacterId
        ? characterById.get(p.scenarioCharacterId)
        : undefined;
      return {
        playerId: p.id,
        characterName: p.characterName,
        username: p.userId ? (usernameById.get(p.userId) ?? null) : null,
        title: character?.title ?? p.characterRole,
        knowledge: KNOWLEDGE_LABEL[p.murderKnowledge] ?? "",
        backstory: character?.backstory ?? "",
        linkToVictim: character?.linkToVictim ?? "",
      };
    });

  return {
    solution: {
      pitch: scenario?.pitch ?? game.synopsis,
      murderers,
      plotThreads: plotThreads.map((t) => ({
        title: t.title,
        description: t.description,
      })),
    },
    tally,
    verdicts,
    answers,
    submittedCount: submissions.length,
    totalPlayers: players.length,
  };
}

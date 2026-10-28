import sequelize from "../../config/database";
import User from "./User.model";
import Game from "./Game.model";
import GamePlayer from "./GamePlayer.model";
import Power from "./Power.model";
import Scenario from "./Scenario.model";
import ScenarioCharacter from "./ScenarioCharacter.model";
import ScenarioRelation from "./ScenarioRelation.model";
import ScenarioRiddle from "./ScenarioRiddle.model";
import ScenarioPhysicalClue from "./ScenarioPhysicalClue.model";
import ScenarioQrClue from "./ScenarioQrClue.model";
import ScenarioPlotThread from "./ScenarioPlotThread.model";
import Conversation from "./Conversation.model";
import Message from "./Message.model";
import CodeUnlock from "./CodeUnlock.model";
import PowerUse from "./PowerUse.model";
import GameClue from "./GameClue.model";
import GhostSubstitution from "./GhostSubstitution.model";
import LoveBond from "./LoveBond.model";
import TimedEffect from "./TimedEffect.model";
import Duel from "./Duel.model";
import DuelVote from "./DuelVote.model";
import AlchemistRequest from "./AlchemistRequest.model";
import MoneyTransfer from "./MoneyTransfer.model";
import FinalSubmission from "./FinalSubmission.model";
import FinalAccusation from "./FinalAccusation.model";
import { seedPowers } from "../../seed/powers.seed";
import {
  HP2027_CLUE_PASSWORDS,
  seedHp2027,
} from "../../seed/hp2027.seed";
import { DataTypes, QueryTypes } from "sequelize";
import ScenarioCluePassword from "./ScenarioCluePassword.model";
import ClueUnlock from "./ClueUnlock.model";

// ── Associations existantes ──────────────────────────────────────────────
User.hasMany(Game, { foreignKey: "createdBy", as: "createdGames" });
Game.belongsTo(User, { foreignKey: "createdBy", as: "creator" });

Game.hasMany(GamePlayer, { foreignKey: "gameId", as: "players" });
GamePlayer.belongsTo(Game, { foreignKey: "gameId", as: "game" });

User.hasMany(GamePlayer, { foreignKey: "userId", as: "playerProfiles" });
GamePlayer.belongsTo(User, { foreignKey: "userId", as: "user" });

// ── Associations — contenu du scénario ───────────────────────────────────
Scenario.hasMany(ScenarioCharacter, {
  foreignKey: "scenarioId",
  as: "characters",
});
ScenarioCharacter.belongsTo(Scenario, {
  foreignKey: "scenarioId",
  as: "scenario",
});

Power.hasMany(ScenarioCharacter, {
  foreignKey: "powerId",
  as: "scenarioCharacters",
});
ScenarioCharacter.belongsTo(Power, { foreignKey: "powerId", as: "power" });

Scenario.hasMany(ScenarioRelation, {
  foreignKey: "scenarioId",
  as: "relations",
});
ScenarioRelation.belongsTo(Scenario, {
  foreignKey: "scenarioId",
  as: "scenario",
});
ScenarioCharacter.hasMany(ScenarioRelation, {
  foreignKey: "characterId",
  as: "outgoingRelations",
});
ScenarioRelation.belongsTo(ScenarioCharacter, {
  foreignKey: "characterId",
  as: "character",
});
ScenarioRelation.belongsTo(ScenarioCharacter, {
  foreignKey: "relatedCharacterId",
  as: "relatedCharacter",
});

Scenario.hasMany(ScenarioRiddle, { foreignKey: "scenarioId", as: "riddles" });
ScenarioRiddle.belongsTo(Scenario, {
  foreignKey: "scenarioId",
  as: "scenario",
});
ScenarioCharacter.hasOne(ScenarioRiddle, {
  foreignKey: "characterId",
  as: "riddle",
});
ScenarioRiddle.belongsTo(ScenarioCharacter, {
  foreignKey: "characterId",
  as: "character",
});

Scenario.hasMany(ScenarioPhysicalClue, {
  foreignKey: "scenarioId",
  as: "physicalClues",
});
ScenarioPhysicalClue.belongsTo(Scenario, {
  foreignKey: "scenarioId",
  as: "scenario",
});
ScenarioCharacter.hasMany(ScenarioPhysicalClue, {
  foreignKey: "relatedCharacterId",
  as: "physicalClues",
});
ScenarioPhysicalClue.belongsTo(ScenarioCharacter, {
  foreignKey: "relatedCharacterId",
  as: "relatedCharacter",
});

Scenario.hasMany(ScenarioQrClue, { foreignKey: "scenarioId", as: "qrClues" });
ScenarioQrClue.belongsTo(Scenario, {
  foreignKey: "scenarioId",
  as: "scenario",
});

Scenario.hasMany(ScenarioPlotThread, {
  foreignKey: "scenarioId",
  as: "plotThreads",
});
ScenarioPlotThread.belongsTo(Scenario, {
  foreignKey: "scenarioId",
  as: "scenario",
});

// ── Liens Game / GamePlayer ↔ Scénario ───────────────────────────────────
Scenario.hasMany(Game, { foreignKey: "scenarioId", as: "games" });
Game.belongsTo(Scenario, { foreignKey: "scenarioId", as: "scenario" });

ScenarioCharacter.hasMany(GamePlayer, {
  foreignKey: "scenarioCharacterId",
  as: "gamePlayers",
});
GamePlayer.belongsTo(ScenarioCharacter, {
  foreignKey: "scenarioCharacterId",
  as: "scenarioCharacter",
});

// ── Associations — messagerie ─────────────────────────────────────────────
GamePlayer.hasMany(Conversation, {
  foreignKey: "player1Id",
  as: "conversationsAsP1",
});
GamePlayer.hasMany(Conversation, {
  foreignKey: "player2Id",
  as: "conversationsAsP2",
});
Conversation.belongsTo(GamePlayer, { foreignKey: "player1Id", as: "player1" });
Conversation.belongsTo(GamePlayer, { foreignKey: "player2Id", as: "player2" });

Conversation.hasMany(Message, { foreignKey: "conversationId", as: "messages" });
Message.belongsTo(Conversation, {
  foreignKey: "conversationId",
  as: "conversation",
});
GamePlayer.hasMany(Message, { foreignKey: "senderId", as: "sentMessages" });
Message.belongsTo(GamePlayer, { foreignKey: "senderId", as: "sender" });

GamePlayer.hasMany(CodeUnlock, {
  foreignKey: "unlockedByPlayerId",
  as: "unlocksMade",
});
GamePlayer.hasMany(CodeUnlock, {
  foreignKey: "targetPlayerId",
  as: "unlocksReceived",
});
CodeUnlock.belongsTo(GamePlayer, {
  foreignKey: "unlockedByPlayerId",
  as: "unlockedBy",
});
CodeUnlock.belongsTo(GamePlayer, {
  foreignKey: "targetPlayerId",
  as: "target",
});

// ── Associations — pouvoirs ────────────────────────────────────────────────
GamePlayer.hasMany(PowerUse, { foreignKey: "gamePlayerId", as: "powerUses" });
PowerUse.belongsTo(GamePlayer, { foreignKey: "gamePlayerId", as: "activator" });

// ── Associations — indices d'une partie ────────────────────────────────────
Game.hasMany(GameClue, { foreignKey: "gameId", as: "clues" });
GameClue.belongsTo(Game, { foreignKey: "gameId", as: "game" });
ScenarioPhysicalClue.hasOne(GameClue, {
  foreignKey: "physicalClueId",
  as: "gameInstance",
});
GameClue.belongsTo(ScenarioPhysicalClue, {
  foreignKey: "physicalClueId",
  as: "template",
});
ScenarioCharacter.hasMany(GameClue, {
  foreignKey: "currentCharacterId",
  as: "attributedClues",
});
GameClue.belongsTo(ScenarioCharacter, {
  foreignKey: "currentCharacterId",
  as: "currentCharacter",
});

// GhostSubstitution, LoveBond, TimedEffect, Duel, DuelVote, AlchemistRequest, MoneyTransfer,
// FinalSubmission et FinalAccusation : volontairement sans association (aucun include nécessaire)

// ── Synchronisation ───────────────────────────────────────────────────────
export async function syncDatabase(): Promise<void> {
  try {
    await sequelize.authenticate();
    console.log("✅ Connexion MySQL établie");

    // La synchronisation sûre crée les tables manquantes sans remanier les tables existantes.
    // `alter` peut multiplier les index MySQL à chaque démarrage et modifier des tables en place.
    const alter = process.env["DB_SYNC_MODE"] === "alter";
    await sequelize.sync(alter ? { alter: true } : undefined);
    await ensureCluePasswordSchema();
    await seedPowers();
    await seedHp2027();
    await ensureScenarioCluePasswords();
    await ensureClueUnlockSchema();
    console.log("✅ Tables synchronisées");
  } catch (error) {
    console.error("❌ Erreur de connexion MySQL :", error);
    process.exit(1);
  }
}

async function ensureCluePasswordSchema(): Promise<void> {
  const queryInterface = sequelize.getQueryInterface();
  const table = await queryInterface.describeTable("scenario_clue_passwords");

  if (!("qrClueId" in table)) {
    await queryInterface.addColumn("scenario_clue_passwords", "qrClueId", {
      type: DataTypes.INTEGER,
      allowNull: true,
    });
  }
  if (table.physicalClueId?.allowNull === false) {
    await queryInterface.changeColumn(
      "scenario_clue_passwords",
      "physicalClueId",
      {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
    );
  }

  const indexes = await sequelize.query<{ INDEX_NAME: string }>(
    `SELECT INDEX_NAME
     FROM INFORMATION_SCHEMA.STATISTICS
     WHERE TABLE_SCHEMA = DATABASE()
       AND TABLE_NAME = 'scenario_clue_passwords'
       AND COLUMN_NAME = 'qrClueId'
       AND NON_UNIQUE = 0`,
    { type: QueryTypes.SELECT },
  );
  if (indexes.length === 0) {
    await queryInterface.addIndex("scenario_clue_passwords", ["qrClueId"], {
      name: "scenario_clue_passwords_qr_clue_unique",
      unique: true,
    });
  }
}

async function ensureClueUnlockSchema(): Promise<void> {
  const queryInterface = sequelize.getQueryInterface();
  const table = await queryInterface.describeTable("clue_unlocks");

  if (!("cluePasswordId" in table)) {
    await queryInterface.addColumn("clue_unlocks", "cluePasswordId", {
      type: DataTypes.INTEGER,
      allowNull: true,
    });
  }

  if ("gameClueId" in table) {
    await sequelize.query(
      `UPDATE clue_unlocks AS unlocks
       INNER JOIN game_clues AS clues
         ON clues.id = unlocks.gameClueId AND clues.gameId = unlocks.gameId
       INNER JOIN scenario_clue_passwords AS passwords
         ON passwords.physicalClueId = clues.physicalClueId
       SET unlocks.cluePasswordId = passwords.id
       WHERE unlocks.cluePasswordId IS NULL`,
    );
    await queryInterface.changeColumn("clue_unlocks", "gameClueId", {
      type: DataTypes.INTEGER,
      allowNull: true,
    });
  }

  const indexes = await sequelize.query<{ INDEX_NAME: string }>(
    `SELECT INDEX_NAME
     FROM INFORMATION_SCHEMA.STATISTICS
     WHERE TABLE_SCHEMA = DATABASE()
       AND TABLE_NAME = 'clue_unlocks'
       AND COLUMN_NAME = 'cluePasswordId'
       AND NON_UNIQUE = 0`,
    { type: QueryTypes.SELECT },
  );
  if (indexes.length === 0) {
    await queryInterface.addIndex(
      "clue_unlocks",
      ["gamePlayerId", "cluePasswordId"],
      { name: "uniq_clue_password_unlock", unique: true },
    );
  }
}

async function ensureScenarioCluePasswords(): Promise<void> {
  const legacyPhysicalClueNames: Record<string, string> = {
    "Le Pass Numérique Ensanglanté d'Argus Rusard":
      "Le Pass Numérique Ensanglanté de Argus Rusard",
  };
  const [physicalClues, qrClues] = await Promise.all([
    ScenarioPhysicalClue.findAll({ attributes: ["id", "name"] }),
    ScenarioQrClue.findAll({ attributes: ["id", "slug"] }),
  ]);
  const existingPasswords = await ScenarioCluePassword.findAll({
    attributes: ["id", "physicalClueId", "qrClueId", "password"],
  });
  const passwordByPhysicalId = new Map(
    existingPasswords
      .filter((entry) => entry.physicalClueId !== null)
      .map((entry) => [entry.physicalClueId!, entry]),
  );
  const passwordByQrId = new Map(
    existingPasswords
      .filter((entry) => entry.qrClueId !== null)
      .map((entry) => [entry.qrClueId!, entry]),
  );

  for (const clue of physicalClues) {
    const clueName = legacyPhysicalClueNames[clue.name] ?? clue.name;
    if (clueName !== clue.name) {
      await clue.update({ name: clueName });
    }

    const password = HP2027_CLUE_PASSWORDS.physical[
      clueName as keyof typeof HP2027_CLUE_PASSWORDS.physical
    ];
    if (!password) {
      throw new Error(`Aucun code prédéfini pour l'indice physique « ${clueName} ».`);
    }
    const existing = passwordByPhysicalId.get(clue.id);
    if (existing) {
      if (existing.password !== password) {
        await existing.update({ password });
      }
    } else {
      await ScenarioCluePassword.create({
        physicalClueId: clue.id,
        qrClueId: null,
        password,
      });
    }
  }
  for (const clue of qrClues) {
    const password = HP2027_CLUE_PASSWORDS.qr[
      clue.slug as keyof typeof HP2027_CLUE_PASSWORDS.qr
    ];
    if (!password) {
      throw new Error(`Aucun code prédéfini pour l'indice QR « ${clue.slug} ».`);
    }
    const existing = passwordByQrId.get(clue.id);
    if (existing) {
      if (existing.password !== password) {
        await existing.update({ password });
      }
    } else {
      await ScenarioCluePassword.create({
        physicalClueId: null,
        qrClueId: clue.id,
        password,
      });
    }
  }
}

export {
  sequelize,
  User,
  Game,
  GamePlayer,
  Power,
  Scenario,
  ScenarioCharacter,
  ScenarioRelation,
  ScenarioRiddle,
  ScenarioPhysicalClue,
  ScenarioCluePassword,
  ScenarioQrClue,
  ScenarioPlotThread,
  Conversation,
  Message,
  CodeUnlock,
  PowerUse,
  GameClue,
  ClueUnlock,
  GhostSubstitution,
  LoveBond,
  TimedEffect,
  Duel,
  DuelVote,
  AlchemistRequest,
  MoneyTransfer,
  FinalSubmission,
  FinalAccusation,
};

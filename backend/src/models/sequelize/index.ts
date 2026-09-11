import sequelize from '../../config/database';
import User                 from './User.model';
import Game                 from './Game.model';
import GamePlayer           from './GamePlayer.model';
import Power                from './Power.model';
import Scenario             from './Scenario.model';
import ScenarioCharacter    from './ScenarioCharacter.model';
import ScenarioRelation     from './ScenarioRelation.model';
import ScenarioRiddle       from './ScenarioRiddle.model';
import ScenarioPhysicalClue from './ScenarioPhysicalClue.model';
import ScenarioQrClue       from './ScenarioQrClue.model';
import ScenarioPlotThread   from './ScenarioPlotThread.model';
import { seedPowers }       from '../../seed/powers.seed';
import { seedHp2027 }       from '../../seed/hp2027.seed';

// ── Associations existantes ──────────────────────────────────────────────
User.hasMany(Game,       { foreignKey: 'createdBy', as: 'createdGames' });
Game.belongsTo(User,     { foreignKey: 'createdBy', as: 'creator' });

Game.hasMany(GamePlayer, { foreignKey: 'gameId', as: 'players' });
GamePlayer.belongsTo(Game, { foreignKey: 'gameId', as: 'game' });

User.hasMany(GamePlayer, { foreignKey: 'userId', as: 'playerProfiles' });
GamePlayer.belongsTo(User, { foreignKey: 'userId', as: 'user' });

// ── Associations — contenu du scénario ───────────────────────────────────
Scenario.hasMany(ScenarioCharacter,   { foreignKey: 'scenarioId', as: 'characters' });
ScenarioCharacter.belongsTo(Scenario, { foreignKey: 'scenarioId', as: 'scenario' });

Power.hasMany(ScenarioCharacter,      { foreignKey: 'powerId', as: 'scenarioCharacters' });
ScenarioCharacter.belongsTo(Power,    { foreignKey: 'powerId', as: 'power' });

Scenario.hasMany(ScenarioRelation,    { foreignKey: 'scenarioId', as: 'relations' });
ScenarioRelation.belongsTo(Scenario,  { foreignKey: 'scenarioId', as: 'scenario' });
ScenarioCharacter.hasMany(ScenarioRelation,   { foreignKey: 'characterId', as: 'outgoingRelations' });
ScenarioRelation.belongsTo(ScenarioCharacter, { foreignKey: 'characterId', as: 'character' });
ScenarioRelation.belongsTo(ScenarioCharacter, { foreignKey: 'relatedCharacterId', as: 'relatedCharacter' });

Scenario.hasMany(ScenarioRiddle,      { foreignKey: 'scenarioId', as: 'riddles' });
ScenarioRiddle.belongsTo(Scenario,    { foreignKey: 'scenarioId', as: 'scenario' });
ScenarioCharacter.hasOne(ScenarioRiddle,      { foreignKey: 'characterId', as: 'riddle' });
ScenarioRiddle.belongsTo(ScenarioCharacter,   { foreignKey: 'characterId', as: 'character' });

Scenario.hasMany(ScenarioPhysicalClue,     { foreignKey: 'scenarioId', as: 'physicalClues' });
ScenarioPhysicalClue.belongsTo(Scenario,   { foreignKey: 'scenarioId', as: 'scenario' });
ScenarioCharacter.hasMany(ScenarioPhysicalClue,   { foreignKey: 'relatedCharacterId', as: 'physicalClues' });
ScenarioPhysicalClue.belongsTo(ScenarioCharacter, { foreignKey: 'relatedCharacterId', as: 'relatedCharacter' });

Scenario.hasMany(ScenarioQrClue,      { foreignKey: 'scenarioId', as: 'qrClues' });
ScenarioQrClue.belongsTo(Scenario,    { foreignKey: 'scenarioId', as: 'scenario' });

Scenario.hasMany(ScenarioPlotThread,  { foreignKey: 'scenarioId', as: 'plotThreads' });
ScenarioPlotThread.belongsTo(Scenario,{ foreignKey: 'scenarioId', as: 'scenario' });

// ── Liens Game / GamePlayer ↔ Scénario ───────────────────────────────────
Scenario.hasMany(Game,   { foreignKey: 'scenarioId', as: 'games' });
Game.belongsTo(Scenario, { foreignKey: 'scenarioId', as: 'scenario' });

ScenarioCharacter.hasMany(GamePlayer,   { foreignKey: 'scenarioCharacterId', as: 'gamePlayers' });
GamePlayer.belongsTo(ScenarioCharacter, { foreignKey: 'scenarioCharacterId', as: 'scenarioCharacter' });

// ── Synchronisation ───────────────────────────────────────────────────────
export async function syncDatabase(): Promise<void> {
  try {
    await sequelize.authenticate();
    console.log('✅ Connexion MySQL établie');

    await sequelize.sync({ alter: true });
    console.log('✅ Tables synchronisées');

    await seedPowers();
    await seedHp2027();
  } catch (error) {
    console.error('❌ Erreur de connexion MySQL :', error);
    process.exit(1);
  }
}

export {
  sequelize, User, Game, GamePlayer, Power,
  Scenario, ScenarioCharacter, ScenarioRelation,
  ScenarioRiddle, ScenarioPhysicalClue, ScenarioQrClue, ScenarioPlotThread,
};
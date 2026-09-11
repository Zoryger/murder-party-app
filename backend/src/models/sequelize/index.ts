import sequelize from '../../config/database';
import User       from './User.model';
import Game       from './Game.model';
import GamePlayer from './GamePlayer.model';
import Power      from './Power.model';

// ── Associations ──────────────────────────────────────────────────────────

// Un user crée plusieurs parties
User.hasMany(Game,       { foreignKey: 'createdBy', as: 'createdGames' });
Game.belongsTo(User,     { foreignKey: 'createdBy', as: 'creator' });

// Une partie a plusieurs joueurs
Game.hasMany(GamePlayer, { foreignKey: 'gameId', as: 'players' });
GamePlayer.belongsTo(Game, { foreignKey: 'gameId', as: 'game' });

// Un user peut être plusieurs joueurs (dans différentes parties)
User.hasMany(GamePlayer, { foreignKey: 'userId', as: 'playerProfiles' });
GamePlayer.belongsTo(User, { foreignKey: 'userId', as: 'user' });

// ── Synchronisation ───────────────────────────────────────────────────────
export async function syncDatabase(): Promise<void> {
  try {
    await sequelize.authenticate();
    console.log('✅ Connexion MySQL établie');

    // alter:true met à jour les tables existantes sans les supprimer
    await sequelize.sync({ alter: true });
    console.log('✅ Tables synchronisées');

    await seedPowers();
  } catch (error) {
    console.error('❌ Erreur de connexion MySQL :', error);
    process.exit(1);
  }
}

// ── Seed des pouvoirs (insérés une seule fois) ────────────────────────────
async function seedPowers(): Promise<void> {
  const count = await Power.count();
  if (count > 0) return; // déjà insérés

  await Power.bulkCreate([
    { name: 'Informaticien',  slug: 'informaticien',  category: 'info',
      description: 'Voit 3 conversations entre joueurs en hackant leur messagerie.',
      maxUses: 3 },
    { name: 'Voyante',        slug: 'voyante',         category: 'info',
      description: 'Voit tous les rôles de la partie, mais sans savoir qui les possède.',
      maxUses: 1 },
    { name: 'Vision absolue', slug: 'vision-absolue',  category: 'info',
      description: 'Voit tout ce qui est falsifié ou modifié par un autre pouvoir (×2, 1 min).',
      maxUses: 2, durationSeconds: 60 },
    { name: 'Usurpateur',     slug: 'usurpateur',      category: 'manipulation',
      description: 'Crée 2 fausses conversations entre 2 joueurs de son choix.',
      maxUses: 2 },
    { name: 'Falsificateur',  slug: 'falsificateur',   category: 'manipulation',
      description: 'Modifie le nom d\'un joueur sur 1 indice.',
      maxUses: 1 },
    { name: 'Cupidon',        slug: 'cupidon',         category: 'social',
      description: 'Force 2 joueurs à s\'aimer — leur objectif devient survivre ensemble.',
      maxUses: 1 },
    { name: 'Duelliste',      slug: 'duelliste',       category: 'social',
      description: 'Force 2 joueurs en joute verbale 3 min, puis vote des autres.',
      maxUses: 1 },
    { name: 'Orcrux',         slug: 'orcrux',          category: 'social',
      description: 'En devenant fantôme, choisit un vivant comme substitut et utilise son pouvoir.',
      maxUses: 1 },
    { name: 'Chasseur de prime', slug: 'chasseur-de-prime', category: 'life',
      description: 'Tue un joueur (→ fantôme) en connaissant son code de messagerie.',
      maxUses: 1 },
    { name: 'Nécromancie',    slug: 'necromancie',     category: 'life',
      description: 'Réanime 2 fantômes pour leur permettre d\'utiliser à nouveau leurs pouvoirs.',
      maxUses: 2 },
    { name: 'Moldue',         slug: 'moldue',          category: 'economy',
      description: 'Aucun pouvoir magique, mais dispose de beaucoup d\'argent en début de partie.',
      maxUses: 0 },
    { name: 'Alchimiste',     slug: 'alchimiste',      category: 'economy',
      description: 'Convertit de l\'argent en indice supplémentaire (via le MJ).',
      maxUses: 99 },
  ]);

  console.log('✅ 12 pouvoirs insérés en base');
}

export { sequelize, User, Game, GamePlayer, Power };
import Power from '../models/sequelize/Power.model';

export async function seedPowers(): Promise<void> {
  // Migration douce : l'ancien slug 'orcrux' devient 'horcruxe' (nom canonique HP)
  const legacy = await Power.findOne({ where: { slug: 'orcrux' } });
  if (legacy) {
    legacy.slug = 'horcruxe';
    legacy.name = 'Horcruxe';
    await legacy.save();
    console.log('🔄 Pouvoir renommé : orcrux → horcruxe');
  }

  const powersData = [
    { name: 'Informaticien', slug: 'informaticien', category: 'info' as const,
      description: "Choisit jusqu'à 3 couples de joueurs pour intercepter et lire leurs échanges de messages.",
      maxUses: 3, durationSeconds: null },
    { name: 'Voyante', slug: 'voyante', category: 'info' as const,
      description: 'Consulte la liste complète de tous les rôles et pouvoirs en jeu, sans savoir qui les détient.',
      maxUses: 1, durationSeconds: null },
    { name: 'Vision absolue', slug: 'vision-absolue', category: 'info' as const,
      description: 'Identifie tous les indices ou conversations falsifiés pendant 1 minute.',
      maxUses: 2, durationSeconds: 60 },
    { name: 'Analyseur de Relations', slug: 'analyseur-de-relations', category: 'info' as const,
      description: "Découvre l'état exact de la relation entre 2 joueurs (positive, neutre, négative ou aucune).",
      maxUses: 4, durationSeconds: null },
    { name: 'Usurpateur', slug: 'usurpateur', category: 'manipulation' as const,
      description: "Fabrique jusqu'à 2 fausses conversations de toutes pièces entre deux joueurs au choix.",
      maxUses: 2, durationSeconds: null },
    { name: 'Falsificateur', slug: 'falsificateur', category: 'manipulation' as const,
      description: "Remplace le nom d'un joueur par un autre sur 1 indice ou 1 conversation.",
      maxUses: 1, durationSeconds: null },
    { name: 'Inversion de Fréquence', slug: 'inversion-de-frequence', category: 'manipulation' as const,
      description: 'Force 2 joueurs à échanger leurs codes de communication secrets pendant 10 minutes.',
      maxUses: 1, durationSeconds: 600 },
    { name: 'Cupidon', slug: 'cupidon', category: 'social' as const,
      description: "Lie 2 joueurs — leur objectif devient « survivre tous les deux et être innocentés ensemble ».",
      maxUses: 1, durationSeconds: null },
    { name: 'Duelliste', slug: 'duelliste', category: 'social' as const,
      description: "Force 2 joueurs à s'affronter en joute verbale 3 minutes, puis les vivants votent pour éliminer l'un des deux.",
      maxUses: 1, durationSeconds: 180 },
    { name: 'Horcruxe', slug: 'horcruxe', category: 'social' as const,
      description: "En cas de mort, choisit 1 joueur vivant qui devient fantôme à sa place et utilise son pouvoir tant qu'il reste fantôme.",
      maxUses: 1, durationSeconds: null },
    { name: 'Chasseur de primes', slug: 'chasseur-de-primes', category: 'life' as const,
      description: "Élimine (transforme en fantôme) jusqu'à 3 joueurs s'il connaît leur code de conversation secret.",
      maxUses: 3, durationSeconds: null },
    { name: 'Nécromancien', slug: 'necromancien', category: 'life' as const,
      description: "Réanime jusqu'à 2 fantômes s'il connaît leur code de conversation secret.",
      maxUses: 2, durationSeconds: null },
    { name: 'Moldue', slug: 'moldue', category: 'economy' as const,
      description: "Aucun pouvoir magique, mais dispose d'une fortune personnelle considérable en monnaie du jeu.",
      maxUses: 0, durationSeconds: null },
    { name: 'Alchimiste', slug: 'alchimiste', category: 'economy' as const,
      description: 'Échange de l\'argent auprès du MJ contre un indice (question fermée, réponse OUI/NON).',
      maxUses: 99, durationSeconds: null },
    { name: 'Brouilleur I.E.M.', slug: 'brouilleur-iem', category: 'sabotage' as const,
      description: 'Déclenche une panne réseau magique de 15 minutes — bloque messages, site et pouvoirs.',
      maxUses: 2, durationSeconds: 900 },
  ];

  for (const p of powersData) {
    await Power.findOrCreate({ where: { slug: p.slug }, defaults: p });
  }

  console.log('✅ Pouvoirs synchronisés (15 au total)');
}
import {
  Scenario, ScenarioCharacter, ScenarioRelation,
  ScenarioRiddle, ScenarioPhysicalClue, ScenarioQrClue, ScenarioPlotThread,
} from '../models/sequelize';
import Power from '../models/sequelize/Power.model';

export async function seedHp2027(): Promise<void> {
  const already = await Scenario.findOne({ where: { slug: 'hp2027' } });
  if (already) return; // déjà seedé — pour reseeder, supprime les tables scenario_* via phpMyAdmin

  // 1. Le scénario
  const scenario = await Scenario.create({
    slug: 'hp2027',
    name: 'Harry Potter 2027 — Poudlard',
    pitch: "En 2027, le monde magique a intégré la technologie moldue. Le Professeur Chourave, favorite pour devenir la prochaine directrice de Poudlard, est retrouvée morte dans sa serre high-tech, le corps couvert de griffures et de morsures.",
    minPlayers: 10,
    maxPlayers: 15,
    durationMinutes: 240,
  });

  // 2. Récupère les pouvoirs déjà seedés
  const powers = await Power.findAll();
  const powerId = (slug: string): number => {
    const p = powers.find(p => p.slug === slug);
    if (!p) throw new Error(`Pouvoir introuvable : ${slug}`);
    return p.id;
  };

  // 3. Les 15 personnages
  const charactersData = [
    { key: 'lockhart', name: 'Gilderoy Lockhart', title: 'Professeur de DCFM & Influenceur (2ᵉ aux votes)',
      group: 'trio_criminel' as const, powerSlug: 'usurpateur', isMurderer: true, murderKnowledge: 'partial' as const, displayOrder: 1,
      backstory: "Star de WizardGram. Il veut la direction de Poudlard pour transformer l'école en vitrine pour ses sponsors.",
      linkToVictim: "Il l'a publiquement humiliée en direct la veille du meurtre (« un dinosaure agricole dépassé »).",
      objective: 'Camoufler son crime et se faire passer pour innocent.' },
    { key: 'rusard', name: 'Argus Rusard', title: 'Concierge de Poudlard (Le Complice)',
      group: 'trio_criminel' as const, powerSlug: 'horcruxe', isMurderer: true, murderKnowledge: 'full' as const, displayOrder: 2,
      backstory: "Dépassé par les drones des élèves, il veut s'acheter un système de sécurité algorithmique.",
      linkToVictim: "Elle refusait qu'il installe ses capteurs thermiques dans ses serres.",
      objective: 'Camoufler son crime et se faire passer pour innocent.' },
    { key: 'dylan', name: 'Dylan Vance', title: "Élève de Serdaigle (L'Exécuteur - Loup-Garou)",
      group: 'trio_criminel' as const, powerSlug: 'falsificateur', isMurderer: true, murderKnowledge: 'none' as const, displayOrder: 3,
      backstory: "Utilise une application moldue pour surveiller ses crises. L'application a bugué le soir du crime.",
      linkToVictim: "Il pense qu'elle l'avait attiré dans la serre après avoir découvert son secret.",
      objective: "Comprendre comment il s'est retrouvé dans la serre et pourquoi son application santé n'a pas fonctionné." },
    { key: 'flitwick', name: 'Filius Flitwick', title: 'Professeur de Sortilèges (3ᵉ aux votes)',
      group: 'corps_enseignant' as const, powerSlug: 'duelliste', isMurderer: false, murderKnowledge: 'not_applicable' as const, displayOrder: 4,
      backstory: "Créateur des « Sorts Connectés », désormais grand favori pour le second tour de l'élection.",
      linkToVictim: 'Très bon ami, mais sa mort le propulse immédiatement en position de gagner l\'élection.',
      objective: "Découvrir l'identité des 3 meurtriers, la chaîne des événements et leurs mobiles." },
    { key: 'londubat', name: 'Neville Londubat', title: 'Professeur de Botanique adjoint',
      group: 'corps_enseignant' as const, powerSlug: 'inversion-de-frequence', isMurderer: false, murderKnowledge: 'not_applicable' as const, displayOrder: 5,
      backstory: 'Bras droit de Chourave, il gère la numérisation des herbiers.',
      linkToVictim: 'Successeur désigné, il hérite de la gestion exclusive de ses brevets botaniques très lucratifs.',
      objective: "Découvrir l'identité des 3 meurtriers, la chaîne des événements et leurs mobiles." },
    { key: 'pince', name: 'Madame Pince', title: 'Bibliothécaire',
      group: 'corps_enseignant' as const, powerSlug: 'necromancien', isMurderer: false, murderKnowledge: 'not_applicable' as const, displayOrder: 6,
      backstory: 'Mène une guerre sainte contre la numérisation des livres.',
      linkToVictim: 'Chourave venait de couper le budget papier pour acheter des tablettes tactiles.',
      objective: "Découvrir l'identité des 3 meurtriers, la chaîne des événements et leurs mobiles." },
    { key: 'vector', name: 'Professeur Vector', title: "Professeure d'Arithmancie",
      group: 'corps_enseignant' as const, powerSlug: 'voyante', isMurderer: false, murderKnowledge: 'not_applicable' as const, displayOrder: 7,
      backstory: "Utilise des supercalculateurs moldus pour prédire l'avenir et les probabilités magiques.",
      linkToVictim: 'Chourave avait opposé son veto au financement de son serveur quantique.',
      objective: "Découvrir l'identité des 3 meurtriers, la chaîne des événements et leurs mobiles." },
    { key: 'lestrange', name: 'Maxime Lestrange', title: 'Élève de Serpentard (Le Hacker)',
      group: 'eleves' as const, powerSlug: 'informaticien', isMurderer: false, murderKnowledge: 'not_applicable' as const, displayOrder: 8,
      backstory: "Petit génie de l'informatique qui a falsifié ses notes sur le réseau du château.",
      linkToVictim: 'Chourave avait tracé son adresse IP magique juste avant de mourir.',
      objective: "Découvrir l'identité des 3 meurtriers, la chaîne des événements et leurs mobiles." },
    { key: 'sophia', name: 'Sophia Prince', title: "Élève de Poufsouffle (L'Opportuniste)",
      group: 'eleves' as const, powerSlug: 'cupidon', isMurderer: false, murderKnowledge: 'not_applicable' as const, displayOrder: 9,
      backstory: 'Assistante de serre qui vole des composants rares pour les revendre sur le Dark Web magique.',
      linkToVictim: "Chourave l'avait attrapée et refusait de lui signer sa recommandation.",
      objective: "Découvrir l'identité des 3 meurtriers, la chaîne des événements et leurs mobiles." },
    { key: 'chloe', name: 'Chloé Lovegood', title: 'Élève de Serdaigle (La Journaliste)',
      group: 'eleves' as const, powerSlug: 'vision-absolue', isMurderer: false, murderKnowledge: 'not_applicable' as const, displayOrder: 10,
      backstory: 'Rédactrice du Chicaneur 2.0, à la recherche du scoop de l\'année.',
      linkToVictim: 'Elle la harcelait de questions sur la sécurité de la serre la veille du meurtre.',
      objective: "Découvrir l'identité des 3 meurtriers, la chaîne des événements et leurs mobiles." },
    { key: 'stark', name: 'Cynthia Stark', title: "Ingénieure Réseau (L'Infiltrée Moldue)",
      group: 'visiteurs_ministere' as const, powerSlug: 'moldue', isMurderer: false, murderKnowledge: 'not_applicable' as const, displayOrder: 11,
      backstory: 'Infiltrée par une entreprise de la Silicon Valley pour voler la « Silice Magique ».',
      linkToVictim: 'Chourave l\'a surprise avec un scanner moldu dans sa serre la veille.',
      objective: "Découvrir l'identité des 3 meurtriers, la chaîne des événements et leurs mobiles." },
    { key: 'delacour', name: 'Régis Delacour', title: 'Auditeur du Ministère (Le Corrompu)',
      group: 'visiteurs_ministere' as const, powerSlug: 'alchimiste', isMurderer: false, murderKnowledge: 'not_applicable' as const, displayOrder: 12,
      backstory: 'Supervise les dépenses de modernisation tout en détournant des fonds.',
      linkToVictim: 'Chourave allait demander un audit officiel sur les trous dans le budget de la botanique.',
      objective: "Découvrir l'identité des 3 meurtriers, la chaîne des événements et leurs mobiles." },
    { key: 'pendelton', name: 'Arthur Pendelton', title: 'Ministre de la Magie',
      group: 'visiteurs_ministere' as const, powerSlug: 'analyseur-de-relations', isMurderer: false, murderKnowledge: 'not_applicable' as const, displayOrder: 13,
      backstory: 'Porteur du projet de modernisation techno-magique, en pleine crise politique.',
      linkToVictim: 'Il voulait lui acheter ses brevets pour un accord commercial avec les Moldus. Elle refusait.',
      objective: "Découvrir l'identité des 3 meurtriers, la chaîne des événements et leurs mobiles." },
    { key: 'dragonneau', name: 'Rolf Dragonneau', title: 'Expert en Créatures Magiques',
      group: 'visiteurs_ministere' as const, powerSlug: 'chasseur-de-primes', isMurderer: false, murderKnowledge: 'not_applicable' as const, displayOrder: 14,
      backstory: 'Consultant appelé à Poudlard, il a voyagé avec un couple de Grims de garde dangereux.',
      linkToVictim: "Chourave a été griffée par l'un de ses Grims la veille lors d'un test.",
      objective: "Découvrir l'identité des 3 meurtriers, la chaîne des événements et leurs mobiles." },
    { key: 'seamus', name: 'Seamus Finnigan', title: 'Professeur de Technologie de Défense',
      group: 'visiteurs_ministere' as const, powerSlug: 'brouilleur-iem', isMurderer: false, murderKnowledge: 'not_applicable' as const, displayOrder: 15,
      backstory: 'Enseigne la défense contre la cyber-magie. Ses cours provoquent de fréquentes explosions.',
      linkToVictim: 'Son drone défectueux a détruit une récolte rare de Chourave juste avant le meurtre.',
      objective: "Découvrir l'identité des 3 meurtriers, la chaîne des événements et leurs mobiles." },
  ];

  const characters: Record<string, ScenarioCharacter> = {};
  for (const c of charactersData) {
    characters[c.key] = await ScenarioCharacter.create({
      scenarioId: scenario.id,
      name: c.name,
      title: c.title,
      group: c.group,
      backstory: c.backstory,
      linkToVictim: c.linkToVictim,
      objective: c.objective,
      powerId: powerId(c.powerSlug),
      isMurderer: c.isMurderer,
      murderKnowledge: c.murderKnowledge,
      displayOrder: c.displayOrder,
    });
  }

  // 4. Les relations (orientées — chaque perso décrit sa vision de l'autre)
  type RelSeed = [string, string, 'positive' | 'neutral' | 'negative', string, boolean, string];
  const relationsData: RelSeed[] = [
    ['lockhart','rusard','positive',"Son homme de main secret. Il l'a payé pour éliminer Chourave et pense que Rusard a agi seul.",true,'🤝'],
    ['lockhart','flitwick','negative',"Son rival électoral qu'il compte écraser au second tour.",false,'⚔️'],
    ['lockhart','delacour','positive','Son plus grand fan et soutien financier officiel au Ministère.',false,'👑'],
    ['lockhart','pendelton','positive',"Le Ministre avec qui il fait du lobbying pour prouver qu'un directeur « moderne » est bon pour l'image.",false,'👔'],
    ['lockhart','chloe','negative','La journaliste qui refuse de publier ses articles promotionnels et cherche à le démasquer.',false,'🕵️‍♂️'],
    ['lockhart','vector','negative','La chercheuse qui a publié une étude prouvant que son programme électoral est absurde.',false,'📉'],

    ['rusard','lockhart','positive',"Son employeur secret. Il a pris son argent mais l'a doublé en utilisant le loup-garou.",true,'🤝'],
    ['rusard','dylan','negative',"Sa marionnette. Il connaît son secret et l'a enfermé dans la serre le soir du crime.",true,'⛓️'],
    ['rusard','pince','positive','Sa seule amie et alliée dans leur combat contre la modernité.',false,'❤️'],
    ['rusard','seamus','negative','Son ennemi quotidien qui fait exploser des batteries dans tout le château.',false,'💥'],
    ['rusard','dragonneau','negative','Sa cible idéale pour accuser le Grim échappé et détourner l\'attention.',false,'🐾'],

    ['dylan','rusard','negative','Son maître chanteur qui le terrorise.',true,'⛓️'],
    ['dylan','sophia','positive','Sa petite amie secrète à qui il cache sa lycanthrophie.',true,'💝'],
    ['dylan','lestrange','positive','Son meilleur ami et colocataire de chambre avec qui il code.',false,'💻'],
    ['dylan','dragonneau','negative',"L'expert qu'il évite désespérément depuis qu'il a des cicatrices suspectes.",false,'🩺'],

    ['flitwick','lockhart','negative','Son rival politique qu\'il considère comme un imposteur sans culture.',false,'⚔️'],
    ['flitwick','londubat','positive','Son jeune collègue qu\'il réconforte tout en cherchant son soutien politique.',false,'🍏'],
    ['flitwick','pendelton','positive',"Le Ministre avec qui il négocie la modernisation raisonnée de l'école.",false,'👔'],

    ['londubat','flitwick','positive',"Son mentor, même s'il s'interroge sur les bénéfices politiques qu'il tire du meurtre.",false,'🍏'],
    ['londubat','dragonneau','positive',"Son ami qu'il aide à traquer son Grim en fuite pour éviter qu'on ne l'abatte.",false,'🌱'],
    ['londubat','chloe','positive','Sa confidente journalistique à qui il donne des infos en échange d\'articles mesurés.',false,'🕵️‍♂️'],
    ['londubat','seamus','positive',"Son ami dont le drone a détruit une récolte rare de la serre la semaine passée.",false,'💥'],
    ['londubat','sophia','negative',"L'élève qu'il a surprise en train de fouiller dans les dossiers de Chourave.",false,'👁️'],

    ['pince','rusard','positive','Son plus fidèle soutien dans sa lutte anti-technologie.',false,'❤️'],
    ['pince','stark','negative','L\'ingénieure moldue dont elle sabote les câbles réseau à travers la bibliothèque.',false,'🔌'],
    ['pince','vector','negative','Sa rivale qui veut réquisitionner ses pièces d\'archives pour installer des serveurs.',false,'📉'],
    ['pince','sophia','positive','Sa favorite parmi les élèves car elle continue d\'emprunter de vrais livres.',false,'📚'],

    ['vector','stark','positive','Sa complice qui lui fournit des composants informatiques moldus en sous-main.',false,'🔌'],
    ['vector','pince','negative','Sa voisine de bureau qui se plaint sans cesse du bruit de ses serveurs.',false,'📚'],
    ['vector','lockhart','negative','Le candidat dont elle a démontré la stupidité via des calculs statistiques.',false,'📉'],

    ['lestrange','sophia','negative',"Sa maîtresse-chanteuse qui l'oblige à pirater d'autres comptes pour elle.",true,'😈'],
    ['lestrange','dylan','positive','Son meilleur ami et colocataire qu\'il sent très anxieux ces derniers jours.',false,'💻'],
    ['lestrange','chloe','negative','La journaliste dont il pirate régulièrement le blog pour s\'amuser.',false,'🕵️‍♂️'],

    ['sophia','dylan','positive',"Son petit ami dont elle sent qu'il cache un lourd secret.",true,'💝'],
    ['sophia','lestrange','negative',"L'élève qu'elle fait chanter grâce à sa découverte sur le changement de notes.",true,'😈'],
    ['sophia','pince','positive',"La bibliothécaire auprès de qui elle joue l'élève modèle.",false,'📚'],
    ['sophia','londubat','negative',"Le professeur qu'elle cherche à discréditer avant qu'il ne la dénonce.",false,'👁️'],

    ['chloe','lockhart','negative',"L'influenceur qu'elle attaque constamment dans ses articles.",false,'🕵️‍♂️'],
    ['chloe','stark','negative',"L'ingénieure qu'elle surveille, la suspectant d'espionnage.",false,'🛠️'],
    ['chloe','londubat','positive','Son contact privilégié au sein du corps professoral.',false,'🕵️‍♂️'],
    ['chloe','lestrange','negative',"Le hacker qui pollue son site web et qu'elle veut faire exclure.",false,'🕵️‍♂️'],

    ['stark','pince','negative','La bibliothécaire qui détruit régulièrement ses installations de câbles.',false,'🔌'],
    ['stark','vector','positive','Sa partenaire scientifique à qui elle livre du matériel de contrebande.',false,'🔌'],
    ['stark','delacour','positive',"L'auditeur qu'elle paie pour obtenir des badges d'accès universels.",false,'💵'],
    ['stark','chloe','negative',"L'élève journaliste qui furète un peu trop autour d'elle.",false,'🛠️'],
    ['stark','seamus','neutral','Le prof passionné qui ne cesse de l\'accaparer avec des questions techniques.',false,'💥'],

    ['delacour','lockhart','positive','Son ami VIP dont il valide les factures douteuses.',false,'👑'],
    ['delacour','stark','positive','L\'ingénieure qui le paie en monnaie moldue sous la table.',false,'💵'],
    ['delacour','pendelton','negative',"Son supérieur hiérarchique devant qui il simule une rigueur absolue.",false,'💼'],

    ['pendelton','delacour','negative','Son inspecteur des finances auquel il met une pression constante.',false,'💼'],
    ['pendelton','flitwick','positive','Le candidat qu\'il soutient discrètement pour rassurer le public.',false,'👔'],
    ['pendelton','lockhart','positive','L\'image publique qu\'il utilise pour promouvoir son ministère.',false,'👔'],
    ['pendelton','dragonneau','positive',"L'expert qu'il a embauché pour sécuriser les lieux sans créer d'émeute.",false,'📜'],

    ['dragonneau','londubat','positive','Son ami intime à qui il a avoué la fuite de sa créature.',false,'🌱'],
    ['dragonneau','dylan','negative','Son suspect réel dont il surveille les symptômes post-transformation.',false,'🩺'],
    ['dragonneau','rusard','negative','Son accusateur public qui veut faire abattre sa créature.',false,'🐾'],
    ['dragonneau','pendelton','negative','Son employeur qui le menace de tout couper si sa créature est coupable.',false,'📜'],

    ['seamus','londubat','positive',"Son ami d'enfance qu'il s'en veut d'avoir involontairement lésé.",false,'💥'],
    ['seamus','rusard','negative','Le concierge irritable qui doit nettoyer toutes ses explosions.',false,'💥'],
    ['seamus','stark','positive','L\'ingénieure dont il admire le matériel informatique moldu.',false,'💥'],
  ];

  await ScenarioRelation.bulkCreate(
    relationsData.map(([from, to, type, desc, secret, emoji]) => ({
      scenarioId: scenario.id,
      characterId: characters[from]!.id,
      relatedCharacterId: characters[to]!.id,
      relationType: type,
      description: desc,
      isSecret: secret,
      emoji,
    }))
  );

  // 5. Les 15 énigmes
  const riddlesData: [string, string, string, string][] = [
    ['dylan', 'Schéma lunaire', "8 phases lunaires à remettre dans l'ordre chronologique.", '64273815'],
    ['lockhart', 'Glorieux texte', 'Anagramme "GLORIEUX" cachée dans un texte narcissique — chaque lettre devient son rang alphabétique.', '7121518952124'],
    ['lestrange', 'Le binaire', 'Suite de nombres décimaux à convertir en binaire simple.', '100010001111000101'],
    ['rusard', 'Rébus', 'Un rébus à résoudre puis multiplier les 9 chiffres obtenus entre eux.', '362880'],
    ['vector', 'Carré magique', 'Carré magique 3x3 (somme = 15 par ligne/colonne) — lire dans le sens de lecture.', '492357816'],
    ['delacour', 'Chiffres romains', 'Une série de chiffres romains à convertir en chiffres arabes.', '357142698'],
    ['pince', 'Le poème macabre', 'Compter le nombre de lettres de chaque mot d\'un poème lugubre.', '2544567827624'],
    ['londubat', "L'armoire aux poisons", "8 fioles colorées à convertir via l'ordre de l'arc-en-ciel (Rouge=1 … Violet=7).", '51473215'],
    ['dragonneau', 'Le chimiste', 'Formule Ba-Ti-C-K-O-Ne-S à convertir en numéros atomiques.', '562261981016'],
    ['pendelton', 'Géométrie fatale', 'Formes géométriques imbriquées — compter les sommets de chacune.', '5930644'],
    ['flitwick', 'Morse visuel', 'Taches de sang (points) et os (tirets) à traduire en morse.', '82049175'],
    ['sophia', 'Le digicode', 'Un digicode 3x3 avec une série de flèches à suivre depuis le chiffre 5.', '52369874521'],
    ['chloe', 'Suite logique', '4 suites logiques à compléter (×3+1, Fibonacci, carrés parfaits, nombres premiers).', '364133617'],
    ['stark', 'BlackJack', '7 cartes à traduire par leur valeur numérique dans l\'ordre.', '1117124139'],
    ['seamus', 'Les dés du tricheur', '9 dés à 6 faces dont on lit la face visible dans l\'ordre.', '123264662'],
  ];

  await ScenarioRiddle.bulkCreate(
    riddlesData.map(([key, title, description, secretCode], i) => ({
      scenarioId: scenario.id,
      characterId: characters[key]!.id,
      title, description, secretCode,
      displayOrder: i + 1,
    }))
  );

  // 6. Les 4 indices physiques
  await ScenarioPhysicalClue.bulkCreate([
    { scenarioId: scenario.id, relatedCharacterId: characters.rusard!.id,
      name: "Le Pass Numérique Ensanglanté d'Argus Rusard",
      support: 'Carte magnétique ou badge à cordon avec fausse boue et faux sang.',
      location: 'Recoin du jardin ou sous un tapis près de la zone « Serre ».',
      effect: 'Prouve que le badge de Rusard a servi à verrouiller la serre lors du crime.' },
    { scenarioId: scenario.id, relatedCharacterId: characters.sophia!.id,
      name: "La Boîte d'Ingrédients Rares de Sophia Prince",
      support: 'Petite boîte en bois avec flacons étiquetés ("Pousse du Diable", "Silice brute").',
      location: "Fond d'un placard ou derrière des livres.",
      effect: 'Accuse Sophia de vol dans les réserves secrètes de Chourave.' },
    { scenarioId: scenario.id, relatedCharacterId: characters.seamus!.id,
      name: 'Les Débris du Drone de Seamus Finnigan',
      support: 'Morceaux de plastique noir, hélices cassées et câbles magiques brûlés.',
      location: 'Poubelle extérieure ou zone garage.',
      effect: 'Confirme le crash du drone de Seamus dans la serre juste avant le meurtre.' },
    { scenarioId: scenario.id, relatedCharacterId: characters.stark!.id,
      name: 'Le Scanner Réseau Moldu de Cynthia Stark',
      support: 'Petit boîtier électronique avec antenne bricolée et étiquette « Stark Industries ».',
      location: "Glissé sous un fauteuil du salon ou caché près d'une prise électrique.",
      effect: "Prouve qu'une technologie moldue capturait les données de la serre à l'insu de tous." },
  ]);

  // 7. Les 6 QR codes
  await ScenarioQrClue.bulkCreate([
    { scenarioId: scenario.id, slug: 'chicaneur-chloe', title: 'Extrait Audio du « Chicaneur 2.0 »',
      content: "Enregistrement (ou texte) d'une dispute tendue entre Chourave et Chloé Lovegood la veille du meurtre.",
      revelation: 'Chourave menaçait de poursuivre Chloé pour diffamation.' },
    { scenarioId: scenario.id, slug: 'note-vector', title: "Note d'Analyse Probabiliste du Professeur Vector",
      content: "Capture d'écran d'un rapport statistique d'Arithmancie.",
      revelation: "Démontre que le programme de Lockhart est une fraude et que la mort de Chourave laissait 89% de chances de victoire à Flitwick." },
    { scenarioId: scenario.id, slug: 'galleonpay-rusard', title: 'Relevé de Compte « GalleonPay » de Rusard',
      content: 'Relevé bancaire magique indiquant la réception de 10 000 Gallions deux jours avant le crime.',
      revelation: "Preuve que Rusard a été payé par un commanditaire anonyme (Lockhart)." },
    { scenarioId: scenario.id, slug: 'bug-moontracker', title: 'Rapport de Bug de l\'application « MoonTracker »',
      content: "Journal d'erreurs de l'application de suivi lunaire de Dylan Vance.",
      revelation: 'Indique un blocage manuel du signal GPS à 22h00 via le serveur central de sécurité.' },
    { scenarioId: scenario.id, slug: 'contrat-ministeriel', title: 'Projet de Contrat de Cession Ministériel',
      content: 'Document officiel annoté en rouge par Chourave (« REFUSÉ »).',
      revelation: 'Donne un mobile politique direct au Ministre Arthur Pendelton.' },
    { scenarioId: scenario.id, slug: 'autopsie-veterinaire', title: 'Rapport d\'Autopsie Vétérinaire Magique',
      content: 'Analyse comparée des blessures sur la victime, réalisée par Rolf Dragonneau.',
      revelation: 'Distingue les griffures du Grim (la veille) des morsures mortelles de loup-garou (la nuit du crime).' },
  ]);

  // 8. Les 4 intrigues secondaires
  await ScenarioPlotThread.bulkCreate([
    { scenarioId: scenario.id, title: "L'Intrigue Électorale",
      description: 'Le Professeur Flitwick (3ᵉ au vote) devient le grand favori avec la mort de Chourave, ce qui lui donne un mobile parfait aux yeux de tous.' },
    { scenarioId: scenario.id, title: 'L\'Intrigue du Cyber-Chantage',
      description: "Maxime Lestrange a piraté le serveur de Poudlard pour modifier ses notes. Chourave l'avait tracé juste avant sa mort. Sophia Prince l'a découvert et le fait chanter." },
    { scenarioId: scenario.id, title: "L'Intrigue d'Espionnage Industriel",
      description: 'Cynthia Stark tente de voler la formule de la « Silice Magique » créée par Chourave. Elle paie Régis Delacour et travaille avec le Professeur Vector.' },
    { scenarioId: scenario.id, title: 'La Fausse Piste de la Créature Échappée',
      description: 'Rolf Dragonneau a laissé s\'échapper un Grim de garde près des serres le soir du crime. Chourave avait été griffée par cette créature la veille.' },
  ]);

  console.log('✅ Scénario HP2027 seedé — 15 personnages, 65 relations, 15 énigmes, 4 indices, 6 QR codes, 4 intrigues');
}
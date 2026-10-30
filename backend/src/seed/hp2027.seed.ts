import {
  Scenario,
  ScenarioCharacter,
  ScenarioRelation,
  ScenarioRiddle,
  ScenarioPhysicalClue,
  ScenarioQrClue,
  ScenarioPlotThread,
} from "../models/sequelize";
import Power from "../models/sequelize/Power.model";

export const HP2027_CLUE_PASSWORDS = {
  physical: {
    "Le Pass Numérique Ensanglanté de Argus Rusard": "PASS-RUSARD-27",
    "La Boîte d'Ingrédients Rares de Sophia Prince": "BOITE-SOPHIA-27",
    "Les Débris du Drone de Seamus Finnigan": "DRONE-SEAMUS-27",
    "Le Scanner Réseau Moldu de Cynthia Stark": "SCANNER-STARK-27",
  },
  qr: {
    "chicaneur-chloe": "CHICANEUR-CHLOE",
    "note-vector": "NOTE-VECTOR-27",
    "galleonpay-rusard": "GALLEON-RUSARD",
    "bug-moontracker": "MOONTRACKER-DYLAN",
    "contrat-ministeriel": "CONTRAT-MINISTERE",
    "autopsie-veterinaire": "AUTOPSIE-ROLF",
  },
} as const;

export async function seedHp2027(): Promise<void> {
  // 1. Le scénario
  const scenarioData = {
    slug: "hp2027",
    name: "Harry Potter 2027 — Poudlard",
    pitch:
      "En 2027, le monde magique a intégré la technologie moldue. Le Professeur Chourave, favorite pour devenir la prochaine directrice de Poudlard, est retrouvée morte dans sa serre high-tech, le corps couvert de griffures et de morsures.",
    minPlayers: 2,
    maxPlayers: 20,
    durationMinutes: 240,
  };
  const existingScenario = await Scenario.findOne({
    where: { slug: scenarioData.slug },
  });
  const scenario = existingScenario
    ? await existingScenario.update(scenarioData)
    : await Scenario.create(scenarioData);

  // 2. Récupère les pouvoirs déjà seedés
  const powers = await Power.findAll();
  const powerId = (slug: string): number => {
    const p = powers.find((p) => p.slug === slug);
    if (!p) throw new Error(`Pouvoir introuvable : ${slug}`);
    return p.id;
  };

  // 3. Les 20 personnages
  const charactersData = [
    {
      key: "lockhart",
      name: "Gilderoy Lockhart",
      title: "Professeur de DCFM & Influenceur (2ᵉ aux votes)",
      group: "trio_criminel" as const,
      powerSlug: "usurpateur",
      isMurderer: true,
      murderKnowledge: "partial" as const,
      displayOrder: 1,
      backstory:
        "Star de WizardGram. Il veut la direction de Poudlard pour transformer l'école en vitrine pour ses sponsors.",
      linkToVictim:
        "Il l'a publiquement humiliée en direct la veille du meurtre (« un dinosaure agricole dépassé »).",
      objective: "Camoufler son crime et se faire passer pour innocent.",
    },
    {
      key: "rusard",
      name: "Argus Rusard",
      title: "Concierge de Poudlard (Le Complice)",
      group: "trio_criminel" as const,
      powerSlug: "horcruxe",
      isMurderer: true,
      murderKnowledge: "full" as const,
      displayOrder: 2,
      backstory:
        "Dépassé par les drones et autres outils informatiques des élèves, il veut s'acheter un système de sécurité algorithmique. Mais Chourave le lui refusait.",
      linkToVictim:
        "Elle refusait qu'il installe ses capteurs thermiques dans ses serres. Tu as donc participé à son meurtre.",
      objective: "Camoufler son crime et se faire passer pour innocent.",
    },
    {
      key: "dylan",
      name: "Dylan Vance",
      title: "Élève de Serdaigle (L'Exécuteur - Loup-Garou)",
      group: "trio_criminel" as const,
      powerSlug: "falsificateur",
      isMurderer: true,
      murderKnowledge: "none" as const,
      displayOrder: 3,
      backstory:
        "Utilise une application moldue pour surveiller ses crises de loup-garou. L'application a bugué le soir du crime. Il est particulièrement à l'aise avec la techologie.",
      linkToVictim:
        "Il pense qu'elle l'avait attiré dans la serre après avoir découvert son secret. Que s'est-il réellemnet passé ce soir la ?",
      objective:
        "Comprendre comment il s'est retrouvé dans la serre et pourquoi son application santé n'a pas fonctionné.",
    },
    {
      key: "flitwick",
      name: "Filius Flitwick",
      title: "Professeur de Sortilèges (3ᵉ aux votes)",
      group: "corps_enseignant" as const,
      powerSlug: "duelliste",
      isMurderer: false,
      murderKnowledge: "not_applicable" as const,
      displayOrder: 4,
      backstory:
        "Créateur des « Sorts Connectés », désormais grand favori pour le second tour de l'élection car les vote pour Chourave vont certainement voter pour lui.",
      linkToVictim:
        "Très bon ami, mais sa mort le propulse immédiatement en position de gagner l'élection.",
      objective:
        "Découvrir l'identité du ou des meurtrier(s), la chaîne des événements et le ou leurs mobile(s).",
    },
    {
      key: "londubat",
      name: "Neville Londubat",
      title: "Professeur de Botanique adjoint",
      group: "corps_enseignant" as const,
      powerSlug: "inversion-de-frequence",
      isMurderer: false,
      murderKnowledge: "not_applicable" as const,
      displayOrder: 5,
      backstory:
        "Bras droit de Chourave, il gère la numérisation des herbiers.",
      linkToVictim:
        "Successeur désigné, il hérite de la gestion exclusive de ses brevets botaniques très lucratifs.",
      objective:
        "Découvrir l'identité du ou des meurtrier(s), la chaîne des événements et le ou leurs mobile(s).",
    },
    {
      key: "pince",
      name: "Madame Pince",
      title: "Bibliothécaire",
      group: "corps_enseignant" as const,
      powerSlug: "necromancien",
      isMurderer: false,
      murderKnowledge: "not_applicable" as const,
      displayOrder: 6,
      backstory: "Mène une guerre sainte contre la numérisation des livres.",
      linkToVictim:
        "Chourave venait de réduire le budget papier pour acheter des tablettes tactiles.",
      objective:
        "Découvrir l'identité du ou des meurtrier(s), la chaîne des événements et le ou leurs mobile(s).",
    },
    {
      key: "vector",
      name: "Professeur Vector",
      title: "Professeure d'Arithmancie",
      group: "corps_enseignant" as const,
      powerSlug: "voyante",
      isMurderer: false,
      murderKnowledge: "not_applicable" as const,
      displayOrder: 7,
      backstory:
        "Utilise des supercalculateurs moldus pour prédire l'avenir et les probabilités magiques.",
      linkToVictim:
        "Chourave avait opposé son veto au financement de son serveur quantique.",
      objective:
        "Découvrir l'identité du ou des meurtrier(s), la chaîne des événements et le ou leurs mobile(s).",
    },
    {
      key: "lestrange",
      name: "Maxime Lestrange",
      title: "Élève de Serpentard (Le Hacker)",
      group: "eleves" as const,
      powerSlug: "informaticien",
      isMurderer: false,
      murderKnowledge: "not_applicable" as const,
      displayOrder: 8,
      backstory:
        "Petit génie de l'informatique qui a falsifié ses notes sur le réseau du château.",
      linkToVictim:
        "Chourave avait tracé son adresse IP magique juste avant de mourir.",
      objective:
        "Découvrir l'identité du ou des meurtrier(s), la chaîne des événements et le ou leurs mobile(s).",
    },
    {
      key: "sophia",
      name: "Sophia Prince",
      title: "Élève de Poufsouffle (L'Opportuniste)",
      group: "eleves" as const,
      powerSlug: "cupidon",
      isMurderer: false,
      murderKnowledge: "not_applicable" as const,
      displayOrder: 9,
      backstory:
        "Assistante de serre qui vole des composants rares pour les revendre sur le Dark Web magique.",
      linkToVictim:
        "Chourave l'avait attrapée et refusait de lui signer sa recommandation.",
      objective:
        "Découvrir l'identité du ou des meurtrier(s), la chaîne des événements et le ou leurs mobile(s).",
    },
    {
      key: "chloe",
      name: "Chloé Lovegood",
      title: "Élève de Serdaigle (La Journaliste)",
      group: "eleves" as const,
      powerSlug: "vision-absolue",
      isMurderer: false,
      murderKnowledge: "not_applicable" as const,
      displayOrder: 10,
      backstory:
        "Rédactrice du Chicaneur 2.0, à la recherche du scoop de l'année.",
      linkToVictim:
        "Chloé harcelait Chourave  de questions sur la sécurité de la serre la veille du meurtre.",
      objective:
        "Découvrir l'identité du ou des meurtrier(s), la chaîne des événements et le ou leurs mobile(s).",
    },
    {
      key: "stark",
      name: "Cynthia Stark",
      title: "Ingénieure Réseau (L'Infiltrée Moldue)",
      group: "visiteurs_ministere" as const,
      powerSlug: "moldue",
      isMurderer: false,
      murderKnowledge: "not_applicable" as const,
      displayOrder: 11,
      backstory:
        "Infiltrée par une entreprise de la Silicon Valley pour voler la « Silice Magique ».",
      linkToVictim:
        "Chourave l'a surprise avec un scanner moldu dans sa serre la veille.",
      objective:
        "Découvrir l'identité du ou des meurtrier(s), la chaîne des événements et le ou leurs mobile(s).",
    },
    {
      key: "delacour",
      name: "Régis Delacour",
      title: "Auditeur du Ministère (Le Corrompu)",
      group: "visiteurs_ministere" as const,
      powerSlug: "alchimiste",
      isMurderer: false,
      murderKnowledge: "not_applicable" as const,
      displayOrder: 12,
      backstory:
        "Supervise les dépenses de modernisation tout en détournant des fonds.",
      linkToVictim:
        "Chourave allait demander un audit officiel sur les trous dans le budget de la botanique.",
      objective:
        "Découvrir l'identité du ou des meurtrier(s), la chaîne des événements et le ou leurs mobile(s).",
    },
    {
      key: "pendelton",
      name: "Arthur Pendelton",
      title: "Ministre de la Magie",
      group: "visiteurs_ministere" as const,
      powerSlug: "analyseur-de-relations",
      isMurderer: false,
      murderKnowledge: "not_applicable" as const,
      displayOrder: 13,
      backstory:
        "Porteur du projet de modernisation techno-magique, en pleine crise politique.",
      linkToVictim:
        "Il voulait lui acheter ses brevets pour un accord commercial avec les Moldus. Elle refusait.",
      objective:
        "Découvrir l'identité du ou des meurtrier(s), la chaîne des événements et le ou leurs mobile(s).",
    },
    {
      key: "dragonneau",
      name: "Rolf Dragonneau",
      title: "Expert en Créatures Magiques",
      group: "visiteurs_ministere" as const,
      powerSlug: "chasseur-de-primes",
      isMurderer: false,
      murderKnowledge: "not_applicable" as const,
      displayOrder: 14,
      backstory:
        "Consultant appelé à Poudlard, il a voyagé avec un couple de Grims de garde dangereux.",
      linkToVictim:
        "Chourave a été griffée par l'un de ses Grims la veille lors d'un test.",
      objective:
        "Découvrir l'identité du ou des meurtrier(s), la chaîne des événements et le ou leurs mobile(s).",
    },
    {
      key: "seamus",
      name: "Seamus Finnigan",
      title: "Professeur de Technologie de Défense",
      group: "visiteurs_ministere" as const,
      powerSlug: "brouilleur-iem",
      isMurderer: false,
      murderKnowledge: "not_applicable" as const,
      displayOrder: 15,
      backstory:
        "Enseigne la défense contre la cyber-magie. Ses cours provoquent de fréquentes explosions.",
      linkToVictim:
        "Son drone défectueux a détruit une récolte rare de Chourave juste avant le meurtre.",
      objective:
        "Découvrir l'identité du ou des meurtrier(s), la chaîne des événements et le ou leurs mobile(s).",
    },
    {
      key: "roxy",
      name: "Roxane « Roxy » Zabini",
      title: "Journaliste vedette de la Gazette 2.0",
      group: "visiteurs_ministere" as const,
      powerSlug: "moldue",
      isMurderer: false,
      murderKnowledge: "not_applicable" as const,
      displayOrder: 16,
      backstory:
        "Journaliste ambitieuse et influenceuse média, elle privilégie les scoops viraux et l'impact immédiat.",
      linkToVictim:
        "Son interview tendue de Chourave sur la privatisation des serres a fini en altercation virale, quelques minutes avant le meurtre.",
      objective:
        "Tu détiens secrètement l'enregistrement d'un micro-espion caché dans la serre. Garde-le pour le scoop idéal tout en découvrant qui a tué Chourave.",
    },
    {
      key: "silas",
      name: "Silas Vane",
      title: "Technicien réseau de Poudlard",
      group: "visiteurs_ministere" as const,
      powerSlug: "chasseur-de-primes",
      isMurderer: false,
      murderKnowledge: "not_applicable" as const,
      displayOrder: 17,
      backstory:
        "Technicien méthodique, il maintient les verrous numériques, les capteurs et les serveurs de Poudlard.",
      linkToVictim:
        "Il a réinitialisé le verrou de la serre le soir du meurtre et fut l'un des derniers à accéder à ses commandes.",
      objective:
        "Tu as découvert une session distante ouverte avec les identifiants de Rusard pour modifier les horaires de fermeture. Avoue ce que tu sais sans révéler ta négligence technique.",
    },
    {
      key: "althea",
      name: "Dr. Althéa Sanguin",
      title: "Médecin légiste et experte en créatures magiques",
      group: "visiteurs_ministere" as const,
      powerSlug: "moldue",
      isMurderer: false,
      murderKnowledge: "not_applicable" as const,
      displayOrder: 18,
      backstory:
        "Consultante du Ministère, elle analyse les blessures et toxines avec une rigueur implacable.",
      linkToVictim:
        "Elle connaissait Chourave et contestait l'usage de créatures dangereuses pour stimuler les plantes carnivores.",
      objective:
        "Ton examen révèle des griffures, des traces de contrainte et une toxine altérant les réflexes. Établis ce qui s'est passé sans céder aux rumeurs.",
    },
    {
      key: "orson",
      name: "Orson Flint",
      title: "Lobbyiste du Conseil d'Administration",
      group: "visiteurs_ministere" as const,
      powerSlug: "necromancien",
      isMurderer: false,
      murderKnowledge: "not_applicable" as const,
      displayOrder: 19,
      backstory:
        "Représentant d'un consortium d'investisseurs, il veut rentabiliser Poudlard et commercialiser ses brevets.",
      linkToVictim:
        "Chourave refusait de céder les brevets de la Silice Magique, mettant en péril un contrat majeur de son consortium.",
      objective:
        "Tu as soudoyé Régis Delacour pour obtenir les comptes secrets des serres et préparer la saisie des brevets. Cache ces versements et protège les intérêts du consortium.",
    },
    {
      key: "callisto",
      name: "Callisto Blackwood",
      title: "Élève de 7e année et hackeuse de baguettes",
      group: "eleves" as const,
      powerSlug: "moldue",
      isMurderer: false,
      murderKnowledge: "not_applicable" as const,
      displayOrder: 20,
      backstory:
        "Élève solitaire et experte en magie numérique, elle pirate les réseaux et les puces des baguettes modernes.",
      linkToVictim:
        "Cachée près des serres pour intercepter des données, elle a entendu une altercation avant de fuir au déclenchement des alarmes.",
      objective:
        "Tu as intercepté un paquet chiffré envoyé par le panneau de la serre au moment du verrouillage. Protège ta trace numérique et décide à qui révéler cette preuve.",
    },
  ];

  const characters: Record<string, ScenarioCharacter> = {};
  for (const c of charactersData) {
    const characterData = {
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
    };
    const existingCharacter = await ScenarioCharacter.findOne({
      where: { scenarioId: scenario.id, name: c.name },
    });
    characters[c.key] = existingCharacter
      ? await existingCharacter.update(characterData)
      : await ScenarioCharacter.create(characterData);
  }

  // 4. Les relations (orientées — chaque perso décrit sa vision de l'autre)
  type RelSeed = [
    string,
    string,
    "positive" | "neutral" | "negative",
    string,
    boolean,
    string,
  ];
  const relationsData: RelSeed[] = [
    [
      "lockhart",
      "rusard",
      "positive",
      "Son homme de main secret. Il l'a payé pour éliminer Chourave, il connait donc ton secret et toi le sien.",
      true,
      "🤝",
    ],
    [
      "lockhart",
      "flitwick",
      "negative",
      "Son rival électoral qu'il compte écraser au second tour. Les votes de Chourave risquent d'aller vers Flitwick au second tour.",
      false,
      "⚔️",
    ],
    [
      "lockhart",
      "delacour",
      "positive",
      "Son plus grand fan et soutien financier officiel au Ministère.",
      false,
      "👑",
    ],
    [
      "lockhart",
      "pendelton",
      "positive",
      "Le Ministre avec qui il fait du lobbying pour prouver qu'un directeur « moderne » est bon pour l'image.",
      false,
      "👔",
    ],
    [
      "lockhart",
      "chloe",
      "negative",
      "La journaliste qui refuse de publier ses articles promotionnels et cherche à le démasquer.",
      false,
      "🕵️‍♂️",
    ],
    [
      "lockhart",
      "vector",
      "negative",
      "La chercheuse qui a publié une étude prouvant que son programme électoral est absurde.",
      false,
      "📉",
    ],

    [
      "rusard",
      "lockhart",
      "positive",
      "Son employeur secret. Il a pris son argent mais l'a doublé en utilisant le loup-garou.",
      true,
      "🤝",
    ],
    [
      "rusard",
      "dylan",
      "negative",
      "Sa marionnette. Il connaît son secret et l'a enfermé dans la serre le soir du crime.",
      true,
      "⛓️",
    ],
    [
      "rusard",
      "pince",
      "positive",
      "Sa seule amie et alliée dans leur combat contre la modernité.",
      false,
      "❤️",
    ],
    [
      "rusard",
      "seamus",
      "negative",
      "Son ennemi quotidien qui fait exploser des batteries dans tout le château.",
      false,
      "💥",
    ],
    [
      "rusard",
      "dragonneau",
      "negative",
      "Sa cible idéale pour accuser le Grim échappé et détourner l'attention.",
      false,
      "🐾",
    ],

    [
      "dylan",
      "rusard",
      "negative",
      "Son maître chanteur qui le terrorise car il connait son secret animal.",
      true,
      "⛓️",
    ],
    [
      "dylan",
      "sophia",
      "positive",
      "Sa petite amie secrète à qui il cache sa lycanthrophie.",
      true,
      "💝",
    ],
    [
      "dylan",
      "lestrange",
      "positive",
      "Son meilleur ami et colocataire de chambre avec qui il code.",
      false,
      "💻",
    ],
    [
      "dylan",
      "dragonneau",
      "negative",
      "L'expert qu'il évite désespérément depuis qu'il a des cicatrices suspectes.",
      false,
      "🩺",
    ],

    [
      "flitwick",
      "lockhart",
      "negative",
      "Son rival politique qu'il considère comme un imposteur sans culture.",
      false,
      "⚔️",
    ],
    [
      "flitwick",
      "londubat",
      "positive",
      "Son jeune collègue qu'il réconforte tout en cherchant son soutien politique.",
      false,
      "🍏",
    ],
    [
      "flitwick",
      "pendelton",
      "positive",
      "Le Ministre avec qui il négocie la modernisation raisonnée de l'école.",
      false,
      "👔",
    ],

    [
      "londubat",
      "flitwick",
      "positive",
      "Son mentor, même s'il s'interroge sur les bénéfices politiques qu'il tire du meurtre.",
      false,
      "🍏",
    ],
    [
      "londubat",
      "dragonneau",
      "positive",
      "Son ami qu'il aide à traquer son Grim en fuite pour éviter qu'on ne l'abatte. Ils l'ont retrouvé le lendemain du meurtre.",
      false,
      "🌱",
    ],
    [
      "londubat",
      "chloe",
      "positive",
      "Sa confidente journalistique à qui il donne des infos en échange d'articles mesurés.",
      false,
      "🕵️‍♂️",
    ],
    [
      "londubat",
      "seamus",
      "positive",
      "Son ami dont le drone a détruit une récolte rare de la serre la semaine passée.",
      false,
      "💥",
    ],
    [
      "londubat",
      "sophia",
      "negative",
      "L'élève qu'il a surprise en train de fouiller dans les dossiers de Chourave.",
      false,
      "👁️",
    ],

    [
      "pince",
      "rusard",
      "positive",
      "Son plus fidèle soutien dans sa lutte anti-technologie.",
      false,
      "❤️",
    ],
    [
      "pince",
      "stark",
      "negative",
      "L'ingénieure moldue dont elle sabote les câbles réseau à travers la bibliothèque.",
      false,
      "🔌",
    ],
    [
      "pince",
      "vector",
      "negative",
      "Sa rivale qui veut réquisitionner ses pièces d'archives pour installer des serveurs.",
      false,
      "📉",
    ],
    [
      "pince",
      "sophia",
      "positive",
      "Sa favorite parmi les élèves car elle continue d'emprunter de vrais livres.",
      false,
      "📚",
    ],

    [
      "vector",
      "stark",
      "positive",
      "Sa complice qui lui fournit des composants informatiques moldus en sous-main.",
      false,
      "🔌",
    ],
    [
      "vector",
      "pince",
      "negative",
      "Sa voisine de bureau qui se plaint sans cesse du bruit de ses serveurs.",
      false,
      "📚",
    ],
    [
      "vector",
      "lockhart",
      "negative",
      "Le candidat dont elle a démontré la stupidité via des calculs statistiques.",
      false,
      "📉",
    ],

    [
      "lestrange",
      "sophia",
      "negative",
      "Sa maîtresse-chanteuse qui l'oblige à pirater d'autres comptes pour elle.",
      true,
      "😈",
    ],
    [
      "lestrange",
      "dylan",
      "positive",
      "Son meilleur ami et colocataire qu'il sent très anxieux ces derniers jours.",
      false,
      "💻",
    ],
    [
      "lestrange",
      "chloe",
      "negative",
      "La journaliste dont il pirate régulièrement le blog pour s'amuser.",
      false,
      "🕵️‍♂️",
    ],

    [
      "sophia",
      "dylan",
      "positive",
      "Son petit ami dont elle sent qu'il cache un lourd secret.",
      true,
      "💝",
    ],
    [
      "sophia",
      "lestrange",
      "negative",
      "L'élève qu'elle fait chanter grâce à sa découverte sur le changement de notes.",
      true,
      "😈",
    ],
    [
      "sophia",
      "pince",
      "positive",
      "La bibliothécaire auprès de qui elle joue l'élève modèle.",
      false,
      "📚",
    ],
    [
      "sophia",
      "londubat",
      "negative",
      "Le professeur qu'elle cherche à discréditer avant qu'il ne la dénonce.",
      false,
      "👁️",
    ],

    [
      "chloe",
      "lockhart",
      "negative",
      "L'influenceur qu'elle attaque constamment dans ses articles.",
      false,
      "🕵️‍♂️",
    ],
    [
      "chloe",
      "stark",
      "negative",
      "L'ingénieure qu'elle surveille, la suspectant d'espionnage.",
      false,
      "🛠️",
    ],
    [
      "chloe",
      "londubat",
      "positive",
      "Son contact privilégié au sein du corps professoral.",
      false,
      "🕵️‍♂️",
    ],
    [
      "chloe",
      "lestrange",
      "negative",
      "Le hacker qui pollue son site web et qu'elle veut faire exclure.",
      false,
      "🕵️‍♂️",
    ],

    [
      "stark",
      "pince",
      "negative",
      "La bibliothécaire qui détruit régulièrement ses installations de câbles.",
      false,
      "🔌",
    ],
    [
      "stark",
      "vector",
      "positive",
      "Sa partenaire scientifique à qui elle livre du matériel de contrebande.",
      false,
      "🔌",
    ],
    [
      "stark",
      "delacour",
      "positive",
      "L'auditeur qu'elle paie pour obtenir des badges d'accès universels.",
      false,
      "💵",
    ],
    [
      "stark",
      "chloe",
      "negative",
      "L'élève journaliste qui furète un peu trop autour d'elle.",
      false,
      "🛠️",
    ],
    [
      "stark",
      "seamus",
      "neutral",
      "Le prof passionné qui ne cesse de l'accaparer avec des questions techniques.",
      false,
      "💥",
    ],

    [
      "delacour",
      "lockhart",
      "positive",
      "Son ami VIP dont il valide les factures douteuses.",
      false,
      "👑",
    ],
    [
      "delacour",
      "stark",
      "positive",
      "L'ingénieure qui le paie en monnaie moldue sous la table.",
      false,
      "💵",
    ],
    [
      "delacour",
      "pendelton",
      "negative",
      "Son supérieur hiérarchique devant qui il simule une rigueur absolue.",
      false,
      "💼",
    ],

    [
      "pendelton",
      "delacour",
      "negative",
      "Son inspecteur des finances auquel il met une pression constante.",
      false,
      "💼",
    ],
    [
      "pendelton",
      "flitwick",
      "positive",
      "Le candidat qu'il soutient discrètement pour rassurer le public.",
      false,
      "👔",
    ],
    [
      "pendelton",
      "lockhart",
      "positive",
      "L'image publique qu'il utilise pour promouvoir son ministère.",
      false,
      "👔",
    ],
    [
      "pendelton",
      "dragonneau",
      "positive",
      "L'expert qu'il a embauché pour sécuriser les lieux sans créer d'émeute.",
      false,
      "📜",
    ],

    [
      "dragonneau",
      "londubat",
      "positive",
      "Son ami intime à qui il a avoué la fuite de sa créature.",
      false,
      "🌱",
    ],
    [
      "dragonneau",
      "dylan",
      "negative",
      "Son suspect réel dont il surveille les symptômes post-transformation.",
      false,
      "🩺",
    ],
    [
      "dragonneau",
      "rusard",
      "negative",
      "Son accusateur public qui veut faire abattre sa créature.",
      false,
      "🐾",
    ],
    [
      "dragonneau",
      "pendelton",
      "negative",
      "Son employeur qui le menace de tout couper si sa créature est coupable.",
      false,
      "📜",
    ],

    [
      "seamus",
      "londubat",
      "positive",
      "Son ami d'enfance qu'il s'en veut d'avoir involontairement lésé.",
      false,
      "💥",
    ],
    [
      "seamus",
      "rusard",
      "negative",
      "Le concierge irritable qui doit nettoyer toutes ses explosions.",
      false,
      "💥",
    ],
    [
      "seamus",
      "stark",
      "positive",
      "L'ingénieure dont il admire le matériel informatique moldu.",
      false,
      "💥",
    ],
    [
      "roxy",
      "chloe",
      "negative",
      "Ta rivale de presse : tu la trouves trop lente et naïve, elle te juge sans éthique. Tu veux publier avant elle.",
      false,
      "📰",
    ],
    [
      "roxy",
      "londubat",
      "neutral",
      "Tu le trouves trop calme et cherches à le faire craquer en direct sur ses allées et venues autour des serres.",
      false,
      "🎙️",
    ],
    [
      "roxy",
      "pendelton",
      "negative",
      "Tu mets le Ministre sous pression en direct pour le forcer à réagir aux scandales de Poudlard.",
      false,
      "📺",
    ],
    [
      "silas",
      "rusard",
      "negative",
      "Il te traite avec mépris mais utilise tes systèmes. Tu sais que ses identifiants ont servi à modifier à distance les horaires du verrou de la serre.",
      true,
      "🔒",
    ],
    [
      "silas",
      "stark",
      "neutral",
      "Ta collègue et rivale : tu respectes ses compétences en matériel moldu, mais te méfies de son comportement autour des accès aux serres.",
      false,
      "🔌",
    ],
    [
      "silas",
      "vector",
      "positive",
      "Ta supérieure supervise tes accès aux serveurs. Tu la respectes comme une scientifique exigeante mais juste.",
      false,
      "📉",
    ],
    [
      "silas",
      "seamus",
      "negative",
      "Ses drones et prototypes provoquent des pannes et abîment les câbles ; tu passes ton temps à réparer ses dégâts.",
      false,
      "⚡",
    ],
    [
      "althea",
      "dragonneau",
      "negative",
      "Tu connais la férocité des Grims de Rolf et comptes vérifier si des traces de sa créature sont liées à l'attaque.",
      false,
      "🐾",
    ],
    [
      "althea",
      "dylan",
      "neutral",
      "Tu as remarqué sa fatigue extrême et des micro-lésions sur ses mains ; tu le gardes sous surveillance.",
      false,
      "🩺",
    ],
    [
      "orson",
      "roxy",
      "positive",
      "Tu la finances discrètement pour orienter l'opinion publique en faveur de la commercialisation des serres.",
      true,
      "📰",
    ],
    [
      "orson",
      "althea",
      "negative",
      "Tu la presses d'accélérer ses conclusions pour faire classer l'affaire et faciliter la saisie des brevets.",
      false,
      "⚖️",
    ],
    [
      "orson",
      "silas",
      "negative",
      "Tu le vois comme un obstacle à l'accès aux données confidentielles et cherches des failles dans sa maintenance pour le faire céder.",
      false,
      "🔒",
    ],
    [
      "orson",
      "delacour",
      "positive",
      "Tu l'as soudoyé pour obtenir les états financiers secrets des serres et préparer la saisie des brevets.",
      true,
      "💰",
    ],
    [
      "callisto",
      "lestrange",
      "negative",
      "Ton rival informatique : tu le trouves imprudent et brouillon, mais reconnais ses capacités.",
      false,
      "💻",
    ],
    [
      "callisto",
      "seamus",
      "positive",
      "Tu apprécies ses expériences : les pannes de ses drones créent le chaos et neutralisent parfois les systèmes de sécurité.",
      false,
      "⚡",
    ],
    [
      "callisto",
      "althea",
      "negative",
      "Tu crains que son expertise ne révèle la signature magique de ta baguette et ne t'identifie près des serres.",
      false,
      "🩺",
    ],
    [
      "callisto",
      "orson",
      "negative",
      "Tu acceptes son argent pour intercepter des données, mais sais qu'il pourrait te sacrifier si tes activités étaient découvertes.",
      true,
      "🕵️",
    ],
  ];

  for (const [from, to, type, desc, secret, emoji] of relationsData) {
    const relationData = {
      scenarioId: scenario.id,
      characterId: characters[from]!.id,
      relatedCharacterId: characters[to]!.id,
      relationType: type,
      description: desc,
      isSecret: secret,
      emoji,
    };
    const existingRelation = await ScenarioRelation.findOne({
      where: {
        scenarioId: scenario.id,
        characterId: relationData.characterId,
        relatedCharacterId: relationData.relatedCharacterId,
      },
    });
    if (existingRelation) {
      await existingRelation.update(relationData);
    } else {
      await ScenarioRelation.create(relationData);
    }
  }

  // 5. Les 15 énigmes
  const riddlesData: [string, string, string, string][] = [
    [
      "dylan",
      "Schéma lunaire",
      "8 phases lunaires à remettre dans l'ordre chronologique.",
      "64273815",
    ],
    [
      "lockhart",
      "Glorieux texte",
      'Anagramme "GLORIEUX" cachée dans un texte narcissique — chaque lettre devient son rang alphabétique.',
      "7121518952124",
    ],
    [
      "lestrange",
      "Le binaire",
      "Suite de nombres décimaux à convertir en binaire simple.",
      "100010001111000101",
    ],
    [
      "rusard",
      "Rébus",
      "Un rébus à résoudre puis multiplier les 9 chiffres obtenus entre eux.",
      "362880",
    ],
    [
      "vector",
      "Carré magique",
      "Carré magique 3x3 (somme = 15 par ligne/colonne) — lire dans le sens de lecture.",
      "492357816",
    ],
    [
      "delacour",
      "Chiffres romains",
      "Une série de chiffres romains à convertir en chiffres arabes.",
      "357142698",
    ],
    [
      "pince",
      "Le poème macabre",
      "Compter le nombre de lettres de chaque mot d'un poème lugubre.",
      "2544567827624",
    ],
    [
      "londubat",
      "L'armoire aux poisons",
      "8 fioles colorées à convertir via l'ordre de l'arc-en-ciel (Rouge=1 … Violet=7).",
      "51473215",
    ],
    [
      "dragonneau",
      "Le chimiste",
      "Formule Ba-Ti-C-K-O-Ne-S à convertir en numéros atomiques.",
      "562261981016",
    ],
    [
      "pendelton",
      "Géométrie fatale",
      "Formes géométriques imbriquées — compter les sommets de chacune.",
      "5930644",
    ],
    [
      "flitwick",
      "Morse visuel",
      "Taches de sang (points) et os (tirets) à traduire en morse.",
      "82049175",
    ],
    [
      "sophia",
      "Le digicode",
      "Un digicode 3x3 avec une série de flèches à suivre depuis le chiffre 5.",
      "52369874521",
    ],
    [
      "chloe",
      "Suite logique",
      "4 suites logiques à compléter (×3+1, Fibonacci, carrés parfaits, nombres premiers).",
      "364133617",
    ],
    [
      "stark",
      "BlackJack",
      "7 cartes à traduire par leur valeur numérique dans l'ordre.",
      "1117124139",
    ],
    [
      "seamus",
      "Les dés du tricheur",
      "9 dés à 6 faces dont on lit la face visible dans l'ordre.",
      "123264662",
    ],
  ];

  for (const [
    i,
    [key, title, description, secretCode],
  ] of riddlesData.entries()) {
    const riddleData = {
      scenarioId: scenario.id,
      characterId: characters[key]!.id,
      title,
      description,
      secretCode,
      displayOrder: i + 1,
    };
    const existingRiddle = await ScenarioRiddle.findOne({
      where: { scenarioId: scenario.id, characterId: riddleData.characterId },
    });
    if (existingRiddle) {
      await existingRiddle.update(riddleData);
    } else {
      await ScenarioRiddle.create(riddleData);
    }
  }

  // 6. Les 4 indices physiques
  const physicalClues = [
    {
      scenarioId: scenario.id,
      relatedCharacterId: characters.rusard!.id,
      name: "Le Pass Numérique Ensanglanté de Argus Rusard",
      support:
        "Carte magnétique remplie de boue et de sang qui permet l'ouverture de la serre.",
      location: "Trouvé à coté de la serre.",
      effect: "Ce badge a pu servir à verrouiller ou déverrouiller la serre.",
    },
    {
      scenarioId: scenario.id,
      relatedCharacterId: characters.sophia!.id,
      name: "La Boîte d'Ingrédients Rares de Sophia Prince",
      support:
        'Petite boîte en bois avec flacons étiquetés ("Pousse du Diable", "Silice brute").',
      location: "Fond d'un placard.",
      effect: "",
    },
    {
      scenarioId: scenario.id,
      relatedCharacterId: characters.seamus!.id,
      name: "Les Débris du Drone de Seamus Finnigan",
      support:
        "Morceaux de plastique noir, hélices cassées et câbles magiques brûlés.",
      location: "Poubelle extérieure",
      effect: "Confirme le crash du drone de Seamus dans la serre.",
    },
    {
      scenarioId: scenario.id,
      relatedCharacterId: characters.stark!.id,
      name: "Le Scanner Réseau Moldu de Cynthia Stark",
      support:
        "Petit boîtier électronique avec antenne bricolée et étiquette « Stark Industries ».",
      location: "Caché près d'une prise électrique proche de la serre.",
      effect:
        "Prouve qu'une technologie moldue capturait les données de la serre à l'insu de tous.",
    },
  ];
  for (const clueData of physicalClues) {
    const existingClue = await ScenarioPhysicalClue.findOne({
      where: { scenarioId: scenario.id, name: clueData.name },
    });
    if (existingClue) {
      await existingClue.update(clueData);
    } else {
      await ScenarioPhysicalClue.create(clueData);
    }
  }

  // 7. Les 6 QR codes
  const qrClues = [
    {
      scenarioId: scenario.id,
      slug: "chicaneur-chloe",
      title: "Extrait Audio du « Chicaneur 2.0 »",
      content:
        "Enregistrement d'une dispute tendue entre Chourave et Chloé Lovegood la veille du meurtre.",
      revelation: "Chourave menaçait de poursuivre Chloé pour diffamation.",
    },
    {
      scenarioId: scenario.id,
      slug: "note-vector",
      title: "Note d'Analyse Probabiliste du Professeur Vector",
      content: "Capture d'écran d'un rapport statistique d'Arithmancie.",
      revelation:
        "Démontre que le programme de Lockhart est une fraude et que la mort de Chourave laissait 89% de chances de victoire à Flitwick.",
    },
    {
      scenarioId: scenario.id,
      slug: "galleonpay-rusard",
      title: "Relevé de Compte « GalleonPay » de Rusard",
      content:
        "Relevé bancaire magique indiquant la réception de 10 000 Gallions.",
      revelation: "Preuve que Rusard a été richement payé par un tierce.",
    },
    {
      scenarioId: scenario.id,
      slug: "bug-moontracker",
      title: "Rapport de Bug de l'application « MoonTracker »",
      content:
        "Journal d'erreurs de l'application de suivi lunaire de Dylan Vance.",
      revelation:
        "Indique un blocage manuel du signal GPS à 22h00 via le serveur central de sécurité.",
    },
    {
      scenarioId: scenario.id,
      slug: "contrat-ministeriel",
      title: "Projet de Contrat de Cession Ministériel",
      content: "Document officiel annoté en rouge par Chourave (« REFUSÉ »).",
      revelation:
        "Donne un mobile politique direct au Ministre Arthur Pendelton.",
    },
    {
      scenarioId: scenario.id,
      slug: "autopsie-veterinaire",
      title: "Rapport d'Autopsie Vétérinaire Magique",
      content:
        "Analyse comparée des blessures sur la victime, réalisée par Rolf Dragonneau.",
      revelation:
        "Distingue les griffures du Grim (la veille) des morsures mortelles d'une autre entité (la nuit du crime).",
    },
  ];
  for (const clueData of qrClues) {
    const existingClue = await ScenarioQrClue.findOne({
      where: { scenarioId: scenario.id, slug: clueData.slug },
    });
    if (existingClue) {
      await existingClue.update(clueData);
    } else {
      await ScenarioQrClue.create(clueData);
    }
  }

  // 8. Les 4 intrigues secondaires
  const plotThreads = [
    {
      scenarioId: scenario.id,
      title: "L'Intrigue Électorale",
      description:
        "Le Professeur Flitwick (3ᵉ au vote) devient le grand favori avec la mort de Chourave, ce qui lui donne un mobile parfait aux yeux de tous.",
    },
    {
      scenarioId: scenario.id,
      title: "L'Intrigue du Cyber-Chantage",
      description:
        "Maxime Lestrange a piraté le serveur de Poudlard pour modifier ses notes. Chourave l'avait tracé juste avant sa mort. Sophia Prince l'a découvert et le fait chanter.",
    },
    {
      scenarioId: scenario.id,
      title: "L'Intrigue d'Espionnage Industriel",
      description:
        "Cynthia Stark tente de voler la formule de la « Silice Magique » créée par Chourave. Elle paie Régis Delacour et travaille avec le Professeur Vector.",
    },
    {
      scenarioId: scenario.id,
      title: "La Fausse Piste de la Créature Échappée",
      description:
        "Rolf Dragonneau a laissé s'échapper un Grim de garde près des serres le soir du crime. Chourave avait été griffée par cette créature la veille.",
    },
  ];
  for (const plotThreadData of plotThreads) {
    const existingPlotThread = await ScenarioPlotThread.findOne({
      where: { scenarioId: scenario.id, title: plotThreadData.title },
    });
    if (existingPlotThread) {
      await existingPlotThread.update(plotThreadData);
    } else {
      await ScenarioPlotThread.create(plotThreadData);
    }
  }

  console.log(
    "✅ Scénario HP2027 synchronisé — 15 personnages, 65 relations, 15 énigmes, 4 indices, 6 QR codes, 4 intrigues",
  );
}

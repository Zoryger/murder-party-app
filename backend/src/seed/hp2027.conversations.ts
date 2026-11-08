export interface PredefinedConversationMessage {
  senderCharacterName: string;
  recipientCharacterName: string;
  content: string;
  sentAt: string;
}

export const HP2027_PREDEFINED_MESSAGES: PredefinedConversationMessage[] = [
  {
    senderCharacterName: "Gilderoy Lockhart",
    recipientCharacterName: "Argus Rusard",
    content: "Rendez-vous dans mon bureau pour une affaire importante",
    sentAt: "2026-11-11T18:00:00+01:00",
  },
  {
    senderCharacterName: "Argus Rusard",
    recipientCharacterName: "Gilderoy Lockhart",
    content: "J’ai bien reçu le paiement, je m’attelle à résoudre le problème.",
    sentAt: "2026-11-12T13:00:00+01:00",
  },
  {
    senderCharacterName: "Régis Delacour",
    recipientCharacterName: "Gilderoy Lockhart",
    content:
      "Gilderoy, la mort de Chourave remet Flitwick dans la course. Si le Ministère fouille dans tes budgets de campagne, tu vas devoir justifier chaque Gallion.",
    sentAt: "2026-11-14T10:30:00+01:00",
  },
  {
    senderCharacterName: "Gilderoy Lockhart",
    recipientCharacterName: "Régis Delacour",
    content:
      "Détends-toi, Régis ! Mes abonnés m'adorent et le public veut du renouveau. Couvre mes dépenses au niveau comptable et tu auras tout à y gagner une fois que je serai directeur.",
    sentAt: "2026-11-14T10:45:00+01:00",
  },
  {
    senderCharacterName: "Régis Delacour",
    recipientCharacterName: "Gilderoy Lockhart",
    content:
      "Entendu. Mais évite les vagues, nous n'avons pas le droit à l'erreur.",
    sentAt: "2026-11-14T11:00:00+01:00",
  },
  {
    senderCharacterName: "Gilderoy Lockhart",
    recipientCharacterName: "Chloé Lovegood",
    content:
      "Votre journal qui sert de papier toilette continue à me diffamer. Si cela continue, j’emploierai les grands moyens.",
    sentAt: "2026-11-12T15:00:00+01:00",
  },
  {
    senderCharacterName: "Argus Rusard",
    recipientCharacterName: "Seamus Finnigan",
    content:
      "Si je retrouve encore l’un de tes drones à détruire une serre ou autre, ça va mal se passer…",
    sentAt: "2026-11-13T13:00:00+01:00",
  },
  {
    senderCharacterName: "Argus Rusard",
    recipientCharacterName: "Rolf Dragonneau",
    content:
      "J’ai su que l’un de vos Grims a échappé à votre surveillance cette nuit. J’espère qu’il n’y a aucun lien avec la mort de Chourave…",
    sentAt: "2026-11-14T12:00:00+01:00",
  },
  {
    senderCharacterName: "Sophia Prince",
    recipientCharacterName: "Dylan Vance",
    content: "Je te trouve étrange ces derniers temps. Tout va bien entre nous ?",
    sentAt: "2026-11-14T15:00:00+01:00",
  },
  {
    senderCharacterName: "Dylan Vance",
    recipientCharacterName: "Sophia Prince",
    content:
      "Oui, tout va bien, je suis juste fatigué en ce moment, ne t’inquiète pas.",
    sentAt: "2026-11-14T16:00:00+01:00",
  },
  {
    senderCharacterName: "Maxime Lestrange",
    recipientCharacterName: "Dylan Vance",
    content:
      "Dylan, tu es où ? Tu as une tête de déterré depuis ce matin et tu évites ma question à chaque fois qu'on rentre au dortoir.",
    sentAt: "2026-11-14T14:00:00+01:00",
  },
  {
    senderCharacterName: "Dylan Vance",
    recipientCharacterName: "Maxime Lestrange",
    content:
      "Je suis près des serres. Je n'ai pas très bien dormi, c'est tout. Ne t'inquiète pas pour moi.",
    sentAt: "2026-11-14T14:15:00+01:00",
  },
  {
    senderCharacterName: "Maxime Lestrange",
    recipientCharacterName: "Dylan Vance",
    content:
      "Tu sais bien que je ne te crois pas. Tu es hyper anxieux depuis la mort de Chourave. Si tu as un souci ou besoin d'un coup de main en informatique, tu peux tout me dire, on est colocs.",
    sentAt: "2026-11-14T14:30:00+01:00",
  },
  {
    senderCharacterName: "Dylan Vance",
    recipientCharacterName: "Maxime Lestrange",
    content:
      "Je sais, Maxime... Merci. Mais il m'arrive des trucs bizarres en ce moment et je préfère régler ça tout seul. Ne te mêle pas de ça, s'il te plaît.",
    sentAt: "2026-11-14T14:32:00+01:00",
  },
  {
    senderCharacterName: "Filius Flitwick",
    recipientCharacterName: "Neville Londubat",
    content:
      "J’ai appris pour la mort de Chourave, je sais que tu étais proche d’elle… As-tu trouvé des indices utiles pour comprendre sa mort dans la serre ?",
    sentAt: "2026-11-14T14:00:00+01:00",
  },
  {
    senderCharacterName: "Neville Londubat",
    recipientCharacterName: "Filius Flitwick",
    content:
      "Non malheureusement, je n’ai pas encore eu la force d’y retourner… Je me dois de vous le demander, veuillez me pardonner, mais sa mort vous est favorable pour l’élection. Avez-vous un lien avec ce drame ?",
    sentAt: "2026-11-14T15:00:00+01:00",
  },
  {
    senderCharacterName: "Filius Flitwick",
    recipientCharacterName: "Neville Londubat",
    content: "Non, c’était une très bonne amie.",
    sentAt: "2026-11-14T16:00:00+01:00",
  },
  {
    senderCharacterName: "Filius Flitwick",
    recipientCharacterName: "Madame Pince",
    content:
      "Bonjour Madame Pince, l'ouvrage sur les Sorts Connectés est-il toujours disponible aux archives ?",
    sentAt: "2026-11-12T13:30:00+01:00",
  },
  {
    senderCharacterName: "Madame Pince",
    recipientCharacterName: "Filius Flitwick",
    content:
      "Oui, Professeur Flitwick. Je vous l'ai mis de côté. Merci de privilégier nos livres anciens plutôt que les gadgets de Lockhart.",
    sentAt: "2026-11-12T13:33:00+01:00",
  },
  {
    senderCharacterName: "Filius Flitwick",
    recipientCharacterName: "Madame Pince",
    content: "La vraie magie s'appuie sur le savoir. Je passe le prendre avant mon cours.",
    sentAt: "2026-11-12T13:42:00+01:00",
  },
  {
    senderCharacterName: "Rolf Dragonneau",
    recipientCharacterName: "Neville Londubat",
    content:
      "Neville, as-tu du nouveau du côté de la serre ? Je repasse la zone au peigne fin, mais aucune trace de mon Grim pour l'instant.",
    sentAt: "2026-11-14T11:00:00+01:00",
  },
  {
    senderCharacterName: "Neville Londubat",
    recipientCharacterName: "Rolf Dragonneau",
    content:
      "Rien de mon côté non plus, Rolf. J'essaie d'éloigner Rusard pour qu'on puisse continuer à chercher discrètement. Mais fais attention, s'il apprend que la créature s'est échappée la nuit de la mort de Chourave, il va immédiatement l'accuser.",
    sentAt: "2026-11-14T11:15:00+01:00",
  },
  {
    senderCharacterName: "Rolf Dragonneau",
    recipientCharacterName: "Neville Londubat",
    content:
      "Je sais bien... Mais je suis convaincu que toutes les blessures sur Pomona ne viennent pas d'un Grim. Il faut absolument qu'on le retrouve avant que quiconque ne décide de l'abattre.",
    sentAt: "2026-11-14T11:20:00+01:00",
  },
  {
    senderCharacterName: "Neville Londubat",
    recipientCharacterName: "Rolf Dragonneau",
    content:
      "D'accord. Retrouvons-nous près du parc dans dix minutes pour faire le point, mais reste très discret.",
    sentAt: "2026-11-14T11:23:00+01:00",
  },
  {
    senderCharacterName: "Roxane « Roxy » Zabini",
    recipientCharacterName: "Neville Londubat",
    content:
      "Neville ! Tu réponds enfin. Je prépare un sujet sur ta reprise soudaine des brevets de Chourave. Tu me donnes ta version avant mon direct ?",
    sentAt: "2026-11-14T12:50:00+01:00",
  },
  {
    senderCharacterName: "Neville Londubat",
    recipientCharacterName: "Roxane « Roxy » Zabini",
    content:
      "Roxane, arrête de m'envoyer des messages. Je n'ai rien à dire à ton média sensationnaliste, laisse-nous respecter sa mémoire.",
    sentAt: "2026-11-14T13:00:00+01:00",
  },
  {
    senderCharacterName: "Roxane « Roxy » Zabini",
    recipientCharacterName: "Neville Londubat",
    content:
      "Le bras droit qui hérite d'une fortune juste après le meurtre... Mes abonnés vont adorer ce timing !",
    sentAt: "2026-11-14T13:05:00+01:00",
  },
  {
    senderCharacterName: "Neville Londubat",
    recipientCharacterName: "Roxane « Roxy » Zabini",
    content:
      "Tu cherches du buzz, pas la vérité. Tu n'auras aucune déclaration de ma part.",
    sentAt: "2026-11-14T13:30:00+01:00",
  },
  {
    senderCharacterName: "Cynthia Stark",
    recipientCharacterName: "Madame Pince",
    content:
      "Madame Pince, je vous informe que je dois intervenir en fin d'après-midi près des serres et des archives pour vérifier les branchements du réseau de surveillance. Merci de ne pas toucher aux boîtiers.",
    sentAt: "2026-11-13T15:42:00+01:00",
  },
  {
    senderCharacterName: "Madame Pince",
    recipientCharacterName: "Cynthia Stark",
    content:
      "Vos gadgets technologiques n'ont rien à faire près des serres ni des archives. Le Professeur Chourave m'a d'ailleurs confirmé aujourd'hui même qu'elle réduisait les budgets accordés à vos appareils et à ces maudites tablettes.",
    sentAt: "2026-11-13T15:55:00+01:00",
  },
  {
    senderCharacterName: "Cynthia Stark",
    recipientCharacterName: "Madame Pince",
    content:
      "Ce n'est pas votre décision, ni une raison pour entraver mon travail. J'ai aperçu des anomalies sur le secteur de la serre n°3 et je compte bien scanner la zone avant la tombée de la nuit.",
    sentAt: "2026-11-13T15:57:00+01:00",
  },
  {
    senderCharacterName: "Madame Pince",
    recipientCharacterName: "Cynthia Stark",
    content:
      "Faites attention à vos actes, Stark. Si vous persistez à vouloir tout défigurer avec vos câbles et vos serveurs, vous finirez par le regretter amèrement. Je veillerai personnellement à ce que le patrimoine de Poudlard soit protégé.",
    sentAt: "2026-11-13T16:05:00+01:00",
  },
  {
    senderCharacterName: "Cynthia Stark",
    recipientCharacterName: "Madame Pince",
    content:
      "C'est noté. Mais si mes câbles sont à nouveau sectionnés ce soir, j'en informerai directement la direction.",
    sentAt: "2026-11-13T16:30:00+01:00",
  },
  {
    senderCharacterName: "Professeur Vector",
    recipientCharacterName: "Chloé Lovegood",
    content:
      "Chloé, si tu publies un article sur les finances, n'oublie pas à quel point Chourave était une obscurantiste. Bloquer mon serveur quantique pour financer ses engrais était une aberration absolue.",
    sentAt: "2026-11-13T17:50:00+01:00",
  },
  {
    senderCharacterName: "Chloé Lovegood",
    recipientCharacterName: "Professeur Vector",
    content:
      "C'est noté, Professeur. On dit même qu'elle voulait couper l'ensemble de votre budget dès ce soir…",
    sentAt: "2026-11-13T17:55:00+01:00",
  },
  {
    senderCharacterName: "Professeur Vector",
    recipientCharacterName: "Chloé Lovegood",
    content:
      "Exact. Cette femme étouffait le progrès scientifique de Poudlard. Utilise mes données chiffrées pour montrer à quel point sa décision était absurde.",
    sentAt: "2026-11-13T18:00:00+01:00",
  },
  {
    senderCharacterName: "Seamus Finnigan",
    recipientCharacterName: "Professeur Vector",
    content:
      "Professeure Vector ! J'ai eu une idée géniale : si on couplait vos supercalculateurs avec l'un de mes réacteurs techno-magiques, on triplerait votre puissance de calcul en deux secondes !",
    sentAt: "2026-11-10T15:00:00+01:00",
  },
  {
    senderCharacterName: "Professeur Vector",
    recipientCharacterName: "Seamus Finnigan",
    content:
      "Absolument pas, Seamus. Vos bricolages instables provoquent continuellement des surtensions et des courts-circuits. Je refuse catégoriquement que vous approchiez de mes serveurs.",
    sentAt: "2026-11-10T15:30:00+01:00",
  },
  {
    senderCharacterName: "Seamus Finnigan",
    recipientCharacterName: "Professeur Vector",
    content:
      "Mais l'Arithmancie moderne doit savoir prendre des risques ! Un petit boost sur le réseau et vous auriez vos résultats prédictifs instantanément.",
    sentAt: "2026-11-10T15:50:00+01:00",
  },
  {
    senderCharacterName: "Professeur Vector",
    recipientCharacterName: "Seamus Finnigan",
    content:
      "Un « boost » à votre façon risquerait de faire sauter tout le réseau du château et d'anéantir des semaines de calculs complexes. Tenez vos prototypes et vos drones éloignés de mon laboratoire.",
    sentAt: "2026-11-10T16:10:00+01:00",
  },
  {
    senderCharacterName: "Sophia Prince",
    recipientCharacterName: "Maxime Lestrange",
    content:
      "Maxime, j'ai besoin de tes compétences pour un nouveau piratage ce soir sur le réseau du château.",
    sentAt: "2026-11-13T11:27:00+01:00",
  },
  {
    senderCharacterName: "Maxime Lestrange",
    recipientCharacterName: "Sophia Prince",
    content:
      "Laisse-moi tranquille, Sophia. Je refuse de continuer à faire ton sale boulot.",
    sentAt: "2026-11-13T11:30:00+01:00",
  },
  {
    senderCharacterName: "Sophia Prince",
    recipientCharacterName: "Maxime Lestrange",
    content:
      "Tu oublies un peu vite ce que je sais sur toi... Si cela devenait public, tu risquerais l'exclusion directe.",
    sentAt: "2026-11-13T11:35:00+01:00",
  },
  {
    senderCharacterName: "Maxime Lestrange",
    recipientCharacterName: "Sophia Prince",
    content:
      "Tu es insupportable. Dis-moi ce que tu veux récupérer et efface ces preuves ensuite.",
    sentAt: "2026-11-13T11:40:00+01:00",
  },
  {
    senderCharacterName: "Chloé Lovegood",
    recipientCharacterName: "Cynthia Stark",
    content:
      "Stark, j'ai vu vos manœuvres suspectes autour des serres avec vos appareils moldus. Je sais que Chourave vous avait à l'œil avant de mourir. Si vous continuez de masquer la véritable raison de votre présence à Poudlard, je publierai un dossier complet sur vos agissements dans Le Chicaneur 2.0 dès demain matin.",
    sentAt: "2026-11-14T17:00:00+01:00",
  },
  {
    senderCharacterName: "Silas Vane",
    recipientCharacterName: "Cynthia Stark",
    content:
      "Cynthia, tes appareils moldus pompent toute la bande passante sur le secteur des serres. Tu fais quoi exactement là-bas ?",
    sentAt: "2026-11-12T16:30:00+01:00",
  },
  {
    senderCharacterName: "Cynthia Stark",
    recipientCharacterName: "Silas Vane",
    content:
      "Des tests de maintenance réseau, Silas. Rien qui ne perturbe tes serveurs, détends-toi.",
    sentAt: "2026-11-12T16:45:00+01:00",
  },
  {
    senderCharacterName: "Silas Vane",
    recipientCharacterName: "Cynthia Stark",
    content:
      "Tes boîtiers tirent deux fois trop d'énergie. Si tu bloques les verrous numériques avec ton matériel, je coupe tes accès.",
    sentAt: "2026-11-12T17:00:00+01:00",
  },
  {
    senderCharacterName: "Cynthia Stark",
    recipientCharacterName: "Silas Vane",
    content:
      "Ne touche à rien. Je sais ce que je fais, occupe-toi de tes propres serveurs.",
    sentAt: "2026-11-12T17:10:00+01:00",
  },
  {
    senderCharacterName: "Régis Delacour",
    recipientCharacterName: "Arthur Pendelton",
    content:
      "Monsieur le Ministre, les répercussions du meurtre de Chourave menacent de bloquer l'attribution des crédits de modernisation. Comment souhaitez-vous que je gère les arbitrages budgétaires ?",
    sentAt: "2026-11-14T12:30:00+01:00",
  },
  {
    senderCharacterName: "Arthur Pendelton",
    recipientCharacterName: "Régis Delacour",
    content:
      "Maintenez une priorité absolue sur les projets visibles, Régis. L'opinion publique et le Conseil d'Administration veulent voir que l'école avance malgré le drame.",
    sentAt: "2026-11-14T12:40:00+01:00",
  },
  {
    senderCharacterName: "Régis Delacour",
    recipientCharacterName: "Arthur Pendelton",
    content:
      "C'est compris. Je validerai les lignes de dépenses prioritaires et j'écarterai temporairement les demandes marginales pour sécuriser le bilan.",
    sentAt: "2026-11-14T13:00:00+01:00",
  },
  {
    senderCharacterName: "Roxane « Roxy » Zabini",
    recipientCharacterName: "Arthur Pendelton",
    content:
      "Monsieur le Ministre, je prépare un sujet exclusif sur votre projet de modernisation et la tension monte avec Chourave. Allez-vous intervenir s'il n'y a pas d'accord avant les élections ?",
    sentAt: "2026-11-13T09:50:00+01:00",
  },
  {
    senderCharacterName: "Arthur Pendelton",
    recipientCharacterName: "Roxane « Roxy » Zabini",
    content:
      "Roxane, le Ministère privilégie la négociation. Je vous demande de ne pas envenimer les débats sur la Gazette 2.0 avant notre réunion officielle demain.",
    sentAt: "2026-11-13T10:10:00+01:00",
  },
  {
    senderCharacterName: "Roxane « Roxy » Zabini",
    recipientCharacterName: "Arthur Pendelton",
    content:
      "Le public a le droit de savoir si les brevets botaniques bloquent l'avenir de Poudlard. Les spectateurs attendent des réponses directes.",
    sentAt: "2026-11-13T10:15:00+01:00",
  },
];

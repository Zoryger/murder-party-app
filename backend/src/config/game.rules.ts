export const MONEY_START_MIN = 2;
export const MONEY_START_MAX = 10;
export const MONEY_MOLDUE = 20;
export const ALCHEMIST_COST = 25; // coût d'une question posée au MJ

// ── Fin de partie ────────────────────────────────────────────────────────────
export const MURDERERS_COUNT = 3; // nombre de meurtriers à désigner dans le formulaire final
export const UNMASKED_THRESHOLD = 0.5; // « démasqué » = accusé par PLUS de cette part des autres joueurs

// Argent de départ d'un joueur, selon le pouvoir de son personnage
export function startingMoney(powerSlug: string | undefined): number {
  if (powerSlug === "moldue") return MONEY_MOLDUE;
  return (
    MONEY_START_MIN +
    Math.floor(Math.random() * (MONEY_START_MAX - MONEY_START_MIN + 1))
  );
}

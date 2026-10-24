// Navigateurs autorisés à appeler l'API et à ouvrir un WebSocket.
// CORS_ORIGINS : liste séparée par des virgules, sans "/" final.
export function allowedOrigins(): string[] {
  const raw = process.env["CORS_ORIGINS"] ?? "http://localhost:4200";
  return raw
    .split(",")
    .map((o) => o.trim().replace(/\/$/, ""))
    .filter(Boolean);
}

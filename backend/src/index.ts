import 'dotenv/config';
import express from 'express';
import cors    from 'cors';

import authRoutes from './routes/auth.routes';
import gameRoutes from './routes/game.routes';

const app  = express();
const PORT = process.env['PORT'] ?? 3000;

// ── Middleware globaux ────────────────────────────────────────────────────
app.use(cors({
  origin:      'http://localhost:4200', // Angular en dev
  credentials: true,
}));
app.use(express.json());                // parser le body JSON

// ── Routes ────────────────────────────────────────────────────────────────
app.use('/api/auth',  authRoutes);
app.use('/api/games', gameRoutes);

// ── Route de santé ────────────────────────────────────────────────────────
app.get('/api/health', (_req, res) => {
  res.json({ success: true, message: 'API Murder Party opérationnelle 🔍' });
});

// ── 404 ───────────────────────────────────────────────────────────────────
app.use((_req, res) => {
  res.status(404).json({ success: false, message: 'Route introuvable.' });
});

// ── Démarrage ─────────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`🔍 Serveur Murder Party démarré sur http://localhost:${PORT}`);
  console.log(`📡 API disponible sur http://localhost:${PORT}/api`);
});
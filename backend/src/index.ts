import 'dotenv/config';
import express from 'express';
import cors    from 'cors';
import { createServer } from 'http';
import { syncDatabase } from './models/sequelize';
import { initSockets }  from './sockets';
import authRoutes     from './routes/auth.routes';
import gameRoutes     from './routes/game.routes';
import scenarioRoutes from './routes/scenario.routes';

const app        = express();
const httpServer = createServer(app);
const PORT       = process.env['PORT'] ?? 3000;

app.use(cors({ origin: 'http://localhost:4200', credentials: true }));
app.use(express.json());

app.use('/api/auth',      authRoutes);
app.use('/api/games',     gameRoutes);
app.use('/api/scenarios', scenarioRoutes);

app.get('/api/health', (_req, res) => {
  res.json({ success: true, message: 'API Murder Party opérationnelle 🔍' });
});

app.use((_req, res) => {
  res.status(404).json({ success: false, message: 'Route introuvable.' });
});

syncDatabase().then(() => {
  initSockets(httpServer);

  httpServer.listen(PORT, () => {
    console.log(`🔍 Serveur démarré sur http://localhost:${PORT}`);
    console.log(`📡 API disponible sur http://localhost:${PORT}/api`);
    console.log(`🔌 Socket.io prêt`);
  });
});
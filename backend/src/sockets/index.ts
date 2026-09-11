import { Server as SocketIOServer } from 'socket.io';
import type { Server as HttpServer } from 'http';
import jwt from 'jsonwebtoken';

interface SocketAuthPayload {
  userId:   number;
  username: string;
  email:    string;
}

let io: SocketIOServer | null = null;

export function initSockets(httpServer: HttpServer): SocketIOServer {
  io = new SocketIOServer(httpServer, {
    cors: { origin: 'http://localhost:4200', credentials: true },
  });

  // Vérifie le JWT à la connexion (le client l'envoie dans `auth.token`)
  io.use((socket, next) => {
    const token = socket.handshake.auth?.['token'];
    if (!token) return next(new Error('Token manquant.'));

    try {
      const payload = jwt.verify(token, process.env['JWT_SECRET']!) as SocketAuthPayload;
      socket.data['user'] = payload;
      next();
    } catch {
      next(new Error('Token invalide.'));
    }
  });

  io.on('connection', (socket) => {
    const user = socket.data['user'] as SocketAuthPayload;
    console.log(`🔌 Socket connecté : ${user.username} (${socket.id})`);

    socket.on('join-lobby', (gameId: number) => {
      socket.join(`game:${gameId}`);
      console.log(`👥 ${user.username} a rejoint la room game:${gameId}`);
    });

    socket.on('leave-lobby', (gameId: number) => {
      socket.leave(`game:${gameId}`);
    });

    socket.on('disconnect', () => {
      console.log(`🔌 Socket déconnecté : ${user.username}`);
    });
  });

  return io;
}

export function getIO(): SocketIOServer {
  if (!io) throw new Error("Socket.io n'est pas initialisé.");
  return io;
}
import { Injectable, inject } from '@angular/core';
import { io, Socket } from 'socket.io-client';
import { environment } from '../../../environments/environment';
import { AuthService } from './auth.service';

@Injectable({ providedIn: 'root' })
export class SocketService {
  private auth = inject(AuthService);
  private socket: Socket | null = null;
  private currentToken: string | null = null;
  private rooms = new Set<number>();

  connect(): Socket {
    const token = this.auth.getToken();

    // Réutilise la connexion existante (même si elle est encore en cours) tant que le token n'a pas changé
    if (this.socket && this.currentToken === token) return this.socket;

    this.socket?.disconnect();
    this.currentToken = token;

    const socket = io(environment.socketUrl, { auth: { token } });

    // À chaque (re)connexion — y compris après un redémarrage du serveur — on rejoint à nouveau les rooms
    socket.on('connect', () => {
      this.rooms.forEach((id) => socket.emit('join-lobby', id));
    });

    this.socket = socket;
    return socket;
  }

  joinLobby(gameId: number): void {
    this.rooms.add(gameId);
    const socket = this.connect();
    if (socket.connected) socket.emit('join-lobby', gameId);
  }

  leaveLobby(gameId: number): void {
    this.rooms.delete(gameId);
    this.socket?.emit('leave-lobby', gameId);
  }

  on(event: string, callback: (...args: any[]) => void): void {
    this.connect().on(event, callback);
  }

  off(event: string, callback?: (...args: any[]) => void): void {
    this.socket?.off(event, callback);
  }
}

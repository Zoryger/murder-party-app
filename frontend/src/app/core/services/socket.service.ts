import { Injectable, inject } from '@angular/core';
import { io, Socket } from 'socket.io-client';
import { environment } from '../../../environments/environment';
import { AuthService } from './auth.service';

@Injectable({ providedIn: 'root' })
export class SocketService {
  private auth = inject(AuthService);
  private socket: Socket | null = null;

  connect(): Socket {
    if (this.socket?.connected) return this.socket;

    this.socket = io(environment.socketUrl, {
      auth: { token: this.auth.getToken() },
    });

    return this.socket;
  }

  joinLobby(gameId: number): void {
    this.connect().emit('join-lobby', gameId);
  }

  leaveLobby(gameId: number): void {
    this.socket?.emit('leave-lobby', gameId);
  }

  on(event: string, callback: (...args: any[]) => void): void {
    this.connect().on(event, callback);
  }

  off(event: string): void {
    this.socket?.off(event);
  }
}
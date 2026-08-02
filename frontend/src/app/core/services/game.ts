import { Injectable } from '@angular/core';
import { Observable, of, delay } from 'rxjs';
import { ApiResponse, Game, GameStatus, CreateGameDto } from '../types';

@Injectable({ providedIn: 'root' })
export class GameService {
  private nextId = 4;

  private games: Game[] = [
    { id:1, name:'Harry Potter 2027', theme:'Poudlard', synopsis:'Le professeur Chourave a été retrouvée morte dans sa serre...',
      status:GameStatus.Waiting, joinCode:'HP2027', createdBy:1, createdAt:new Date() },
  ];

  getGames(): Observable<ApiResponse<Game[]>> {
    return of({ data: this.games, success: true }).pipe(delay(200));
  }

  getGame(id: number): Observable<ApiResponse<Game>> {
    const game = this.games.find(g => g.id === id);
    if (!game) return of({ data: null as any, success: false, message: 'Introuvable' });
    return of({ data: game, success: true }).pipe(delay(150));
  }

  createGame(dto: CreateGameDto): Observable<ApiResponse<Game>> {
    const joinCode = Math.random().toString(36).substring(2, 8).toUpperCase();
    const newGame: Game = {
      id: this.nextId++, ...dto,
      status: GameStatus.Waiting, joinCode,
      createdBy: 1, createdAt: new Date(),
    };
    this.games.push(newGame);
    return of({ data: newGame, success: true }).pipe(delay(300));
  }
}
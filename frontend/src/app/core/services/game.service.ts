import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface Game {
  id:          number;
  name:        string;
  theme:       string;
  synopsis:    string;
  status:      'waiting' | 'active' | 'finished';
  joinCode:    string;
  createdBy:   number;
  maxPlayers:  number;
  scenarioId?: number | null;
  createdAt:   Date;
}

export interface ApiResponse<T> {
  success: boolean;
  data:    T;
  message?: string;
}

export interface CreateGameDto {
  name:        string;
  theme:       string;
  synopsis:    string;
  maxPlayers:  number;
  scenarioId?: number | null;
}

export interface PublicPlayer {
  id:            number;
  userId:        number;
  username:      string;
  characterName: string;
  characterRole: string;
  isAssigned:    boolean;
  status:        'alive' | 'ghost';
}

export interface MyCharacterSheet {
  isGm:        boolean;
  isAssigned?: boolean;
  game?:       Game;
  player?: {
    id: number; status: string; money: number; messagingCode: string;
  };
  character?: {
    id: number; name: string; title: string; backstory: string;
    linkToVictim: string; objective: string; isMurderer: boolean;
    murderKnowledge: string;
    power: { name: string; description: string; category: string; maxUses: number; durationSeconds: number | null };
  };
  relations?: Array<{
    relationType: 'positive' | 'neutral' | 'negative';
    description:  string;
    isSecret:     boolean;
    emoji:        string | null;
    withCharacterName: string;
    withUsername:       string | null;
  }>;
}

@Injectable({ providedIn: 'root' })
export class GameService {
  private http = inject(HttpClient);
  private API  = environment.apiUrl;

  getGames(): Observable<ApiResponse<Game[]>> {
    return this.http.get<ApiResponse<Game[]>>(`${this.API}/games`);
  }

  getGame(id: number): Observable<ApiResponse<Game>> {
    return this.http.get<ApiResponse<Game>>(`${this.API}/games/${id}`);
  }

  getGameByCode(code: string): Observable<ApiResponse<Game>> {
    return this.http.get<ApiResponse<Game>>(`${this.API}/games/join/${code}`);
  }

  createGame(dto: CreateGameDto): Observable<ApiResponse<Game>> {
    return this.http.post<ApiResponse<Game>>(`${this.API}/games`, dto);
  }

  updateStatus(id: number, status: string): Observable<ApiResponse<Game>> {
    return this.http.patch<ApiResponse<Game>>(`${this.API}/games/${id}/status`, { status });
  }

  joinGame(gameId: number): Observable<ApiResponse<unknown>> {
    return this.http.post<ApiResponse<unknown>>(`${this.API}/games/${gameId}/join`, {});
  }

  getPlayers(gameId: number): Observable<ApiResponse<PublicPlayer[]>> {
    return this.http.get<ApiResponse<PublicPlayer[]>>(`${this.API}/games/${gameId}/players`);
  }

  assignCharacters(gameId: number): Observable<ApiResponse<unknown>> {
    return this.http.post<ApiResponse<unknown>>(`${this.API}/games/${gameId}/assign-characters`, {});
  }

  startGame(gameId: number): Observable<ApiResponse<Game>> {
    return this.http.post<ApiResponse<Game>>(`${this.API}/games/${gameId}/start`, {});
  }

  getMyCharacterSheet(gameId: number): Observable<ApiResponse<MyCharacterSheet>> {
    return this.http.get<ApiResponse<MyCharacterSheet>>(`${this.API}/games/${gameId}/me`);
  }
}
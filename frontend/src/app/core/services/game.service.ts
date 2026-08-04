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
  createdAt:   Date;
}

export interface ApiResponse<T> {
  success: boolean;
  data:    T;
  message?: string;
}

export interface CreateGameDto {
  name:       string;
  theme:      string;
  synopsis:   string;
  maxPlayers: number;
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
}
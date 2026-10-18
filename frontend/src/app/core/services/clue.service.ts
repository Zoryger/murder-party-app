import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface GameClue {
  id: number;
  name: string;
  support: string;
  location: string;
  effect: string;
  attributedTo: string | null;
  isFalsified?: boolean;
  trueAttribution?: string | null;
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

@Injectable({ providedIn: 'root' })
export class ClueService {
  private http = inject(HttpClient);
  private API = environment.apiUrl;

  getClueBoard(gameId: number): Observable<ApiResponse<GameClue[]>> {
    return this.http.get<ApiResponse<GameClue[]>>(`${this.API}/games/${gameId}/clues`);
  }
}

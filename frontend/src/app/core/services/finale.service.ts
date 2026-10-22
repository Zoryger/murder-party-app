import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export type GameStatus = 'waiting' | 'active' | 'voting' | 'finished';
export type Verdict = 'won' | 'lost' | 'review';

export interface PhaseInfo {
  status: GameStatus;
  isGm: boolean;
}

// ── Formulaire final (joueur) ──────────────────────────────────────────────
export interface FinalFormData {
  status: 'voting' | 'finished';
  readOnly: boolean;
  required: number;
  myPlayerId: number;
  players: { id: number; characterName: string }[];
  objective: string;
  mine: {
    accusations: { playerId: number; mobile: string }[];
    weapon: string;
    subplots: string;
    objectiveNotes: string;
    submittedAt: string;
  } | null;
}

export interface FinalPayload {
  accusations: { playerId: number; mobile: string }[];
  weapon: string;
  subplots: string;
  objectiveNotes: string;
}

// ── Résultats ──────────────────────────────────────────────────────────────
export interface AnswerView {
  playerId: number;
  username: string | null;
  characterName: string;
  weapon: string;
  subplots: string;
  objectiveNotes: string;
  correctCount: number;
  accusations: { accusedName: string; isCorrect: boolean; mobile: string }[];
  submittedAt: string;
}

export interface ResultsData {
  status: 'voting' | 'finished';
  isGm: boolean;
  submittedCount: number;
  totalPlayers: number;
  solution: {
    pitch: string;
    murderers: {
      playerId: number;
      characterName: string;
      username: string | null;
      title: string;
      knowledge: string;
      backstory: string;
      linkToVictim: string;
    }[];
    plotThreads: { title: string; description: string }[];
  };
  tally: {
    playerId: number;
    characterName: string;
    isMurderer: boolean;
    accusedCount: number;
    unmasked: boolean;
  }[];
  verdicts: {
    playerId: number;
    username: string | null;
    characterName: string;
    isMurderer: boolean;
    status: 'alive' | 'ghost';
    submitted: boolean;
    objectiveKind: 'camouflage' | 'investigate' | 'love' | 'special';
    objectiveLabel: string;
    verdict: Verdict;
    detail: string;
  }[];
  myAnswer: AnswerView | null;
  answers: AnswerView[] | null;
}

// ── Console MJ ─────────────────────────────────────────────────────────────
export interface FinalStatus {
  status: GameStatus;
  startedAt: string | null;
  totalPlayers: number;
  submittedCount: number;
  players: { id: number; characterName: string; username: string | null; submitted: boolean }[];
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

@Injectable({ providedIn: 'root' })
export class FinaleService {
  private http = inject(HttpClient);
  private API = environment.apiUrl;

  getPhase(gameId: number): Observable<ApiResponse<PhaseInfo>> {
    return this.http.get<ApiResponse<PhaseInfo>>(`${this.API}/games/${gameId}/phase`);
  }

  getForm(gameId: number): Observable<ApiResponse<FinalFormData>> {
    return this.http.get<ApiResponse<FinalFormData>>(`${this.API}/games/${gameId}/final`);
  }

  submit(gameId: number, payload: FinalPayload): Observable<ApiResponse<unknown>> {
    return this.http.post<ApiResponse<unknown>>(`${this.API}/games/${gameId}/final`, payload);
  }

  getResults(gameId: number): Observable<ApiResponse<ResultsData>> {
    return this.http.get<ApiResponse<ResultsData>>(`${this.API}/games/${gameId}/results`);
  }

  getFinalStatus(gameId: number): Observable<ApiResponse<FinalStatus>> {
    return this.http.get<ApiResponse<FinalStatus>>(`${this.API}/games/${gameId}/gm/final-status`);
  }

  closeGame(gameId: number): Observable<ApiResponse<unknown>> {
    return this.http.post<ApiResponse<unknown>>(`${this.API}/games/${gameId}/gm/close`, {});
  }

  reopenGame(gameId: number): Observable<ApiResponse<unknown>> {
    return this.http.post<ApiResponse<unknown>>(`${this.API}/games/${gameId}/gm/reopen`, {});
  }

  revealGame(gameId: number): Observable<ApiResponse<unknown>> {
    return this.http.post<ApiResponse<unknown>>(`${this.API}/games/${gameId}/gm/reveal`, {});
  }
}

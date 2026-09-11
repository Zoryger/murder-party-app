import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface Scenario {
  id:              number;
  slug:            string;
  name:            string;
  pitch:           string;
  minPlayers:      number;
  maxPlayers:      number;
  durationMinutes: number;
}

export interface ApiResponse<T> {
  success: boolean;
  data:    T;
  message?: string;
}

@Injectable({ providedIn: 'root' })
export class ScenarioService {
  private http = inject(HttpClient);
  private API  = environment.apiUrl;

  getScenarios(): Observable<ApiResponse<Scenario[]>> {
    return this.http.get<ApiResponse<Scenario[]>>(`${this.API}/scenarios`);
  }
}
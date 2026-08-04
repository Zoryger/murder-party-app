import { Injectable, inject, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { tap } from 'rxjs/operators';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface AuthUser {
  id:        number;
  username:  string;
  email:     string;
  createdAt: Date;
}

export interface AuthResponse {
  success: boolean;
  data: {
    token: string;
    user:  AuthUser;
  };
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private http   = inject(HttpClient);
  private router = inject(Router);
  private API    = environment.apiUrl;

  // Signal : source de vérité de l'état de connexion
  private _user = signal<AuthUser | null>(this.loadUserFromStorage());

  // Computed : dérivés du signal principal
  currentUser = this._user.asReadonly();
  isLoggedIn  = computed(() => this._user() !== null);

  // ── Chargement initial depuis localStorage ──────────────────────────────
  private loadUserFromStorage(): AuthUser | null {
    try {
      const stored = localStorage.getItem('mp_user');
      return stored ? JSON.parse(stored) : null;
    } catch { return null; }
  }

  getToken(): string | null {
    return localStorage.getItem('mp_token');
  }

  // ── Register ─────────────────────────────────────────────────────────────
  register(username: string, email: string, password: string): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.API}/auth/register`, { username, email, password })
      .pipe(tap(res => this.saveSession(res)));
  }

  // ── Login ─────────────────────────────────────────────────────────────────
  login(email: string, password: string): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.API}/auth/login`, { email, password })
      .pipe(tap(res => this.saveSession(res)));
  }

  // ── Logout ────────────────────────────────────────────────────────────────
  logout(): void {
    localStorage.removeItem('mp_token');
    localStorage.removeItem('mp_user');
    this._user.set(null);
    this.router.navigate(['/']);
  }

  // ── Sauvegarde session ────────────────────────────────────────────────────
  private saveSession(res: AuthResponse): void {
    localStorage.setItem('mp_token', res.data.token);
    localStorage.setItem('mp_user',  JSON.stringify(res.data.user));
    this._user.set(res.data.user);
  }
}
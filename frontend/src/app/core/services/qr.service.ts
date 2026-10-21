import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface QrClueView {
  title: string;
  content: string;
  revelation: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

@Injectable({ providedIn: 'root' })
export class QrService {
  private http = inject(HttpClient);
  private API = environment.apiUrl;

  getQr(slug: string): Observable<ApiResponse<QrClueView>> {
    return this.http.get<ApiResponse<QrClueView>>(`${this.API}/scenarios/qr/${slug}`);
  }
}

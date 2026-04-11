import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { catchError, Observable, tap, throwError } from 'rxjs';

import { API_BASE_URL } from '../api.config';

const TOKEN_STORAGE_KEY = 'access_token';

export interface LoginResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);

  login(email: string, password: string): Observable<LoginResponse> {
    return this.http
      .post<LoginResponse>(`${API_BASE_URL}/auth/login`, { email, password })
      .pipe(
        tap((res) => this.saveToken(res.access_token)),
        catchError((err: HttpErrorResponse) =>
          throwError(() => new Error(this.mapLoginError(err))),
        ),
      );
  }

  saveToken(token: string): void {
    if (!token) {
      return;
    }
    localStorage.setItem(TOKEN_STORAGE_KEY, token);
  }

  getToken(): string | null {
    return localStorage.getItem(TOKEN_STORAGE_KEY);
  }

  isAuthenticated(): boolean {
    const token = this.getToken();
    return typeof token === 'string' && token.length > 0;
  }

  removeToken(): void {
    localStorage.removeItem(TOKEN_STORAGE_KEY);
  }

  logout(): void {
    this.removeToken();
  }

  getAuthorizationHeader(): Record<string, string> {
    const token = this.getToken();
    return token ? { Authorization: `Bearer ${token}` } : {};
  }

  private mapLoginError(err: HttpErrorResponse): string {
    const body = err.error;

    if (body && typeof body === 'object' && 'detail' in body) {
      const detail = (body as { detail: unknown }).detail;
      if (typeof detail === 'string' && detail.length > 0) {
        return detail;
      }
      if (Array.isArray(detail) && detail.length > 0) {
        const first = detail[0];
        if (first && typeof first === 'object' && 'msg' in first) {
          const msg = (first as { msg?: string }).msg;
          if (typeof msg === 'string' && msg.length > 0) {
            return msg;
          }
        }
      }
    }

    if (err.status === 0) {
      return 'Sem conexão com o servidor. Confirme se a API está na porta 8000 e reinicie o `ng serve` (proxy).';
    }

    if (err.status === 401 || err.status === 400) {
      return 'E-mail ou senha inválidos.';
    }

    return err.statusText || 'Não foi possível entrar. Tente de novo.';
  }
}

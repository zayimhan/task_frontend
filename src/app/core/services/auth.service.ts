import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { BehaviorSubject, Observable, tap } from 'rxjs';
import { Router } from '@angular/router';
import { RegisterRequest } from '../../models/register-request';
import { LoginRequest } from '../../models/login-request';
import { environment } from '../../../enviroments/enviroment.prod';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private apiUrl = `${environment.apiUrl}/auth`;

  private isLoggedInSubject = new BehaviorSubject<boolean>(this.hasToken());
  public isLoggedIn$ = this.isLoggedInSubject.asObservable();

  constructor(
    private http: HttpClient,
    private router: Router,
  ) {}

  register(data: RegisterRequest, file: File): Observable<any> {
    const formData = new FormData();

    // JSON verisini Blob olarak ekle (Content-Type: application/json için)
    formData.append(
      'request',
      new Blob([JSON.stringify(data)], {
        type: 'application/json',
      }),
    );

    // Resmi ekle
    formData.append('image', file);

    return this.http.post(`${this.apiUrl}/register`, formData);
  }

  verifyCode(userId: number, code: string): Observable<any> {
    // Backend Controller: @RequestMapping("/api/verify")
    const verificationUrl = `${this.apiUrl}/verify`;

    const params = new HttpParams().set('userId', userId).set('code', code);

    return this.http.post<any>(verificationUrl, {}, { params: params }).pipe(
      tap((response) => {
        // Backend'den dönen VERIFY TOKEN'ı alıyoruz
        const verifyToken = response.data || response.token || response;

        if (verifyToken && typeof verifyToken === 'string') {
          console.log('Verify Token alındı, geçici olarak kaydediliyor...');
          // Token'ı kaydediyoruz ki birazdan autoLogin çağırınca Header'a eklensin
          this.saveToken(verifyToken);
        }
      }),
    );
  }

  login(request: LoginRequest): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/login`, request).pipe(
      tap((response) => {
        // Backend yapına göre token response.data içinde veya direkt response içinde olabilir
        // ApiResponse<String> dönüyorsan response.data içindedir.
        const token = response.data || response.token || response;

        if (token && typeof token === 'string') {
          this.saveToken(token);
        }
      }),
    );
  }

  autoLogin(): Observable<any> {
    // Interceptor, yukarıda kaydettiğimiz VerifyToken'ı alıp Header'a koyacak.
    return this.http.post<any>(`${this.apiUrl}/auto-login`, {}).pipe(
      tap((response) => {
        // Backend şimdi bize gerçek AUTH TOKEN'ı verecek
        const authToken = response.data || response.token || response;

        if (authToken && typeof authToken === 'string') {
          console.log('Auth Token alındı! Oturum tam açıldı.');
          // Eski VerifyToken'ın üzerine gerçek AuthToken'ı yazıyoruz
          this.saveToken(authToken);
        }
      }),
    );
  }

  resendVerificationCode(userId: number, verificationType: string): Observable<any> {
    const resendUrl = `${this.apiUrl}/verify/resend`;

    const params = new HttpParams().set('userId', userId).set('type', verificationType);

    return this.http.post(resendUrl, {}, { params: params });
  }

  getProfile(): Observable<any> {
    return this.http.get(`${this.apiUrl}/users/me`);
  }

  private saveToken(token: string) {
    localStorage.setItem('auth_token', token);
    this.isLoggedInSubject.next(true);
  }

  getToken(): string | null {
    return localStorage.getItem('auth_token');
  }

  logout() {
    localStorage.removeItem('auth_token');
    this.isLoggedInSubject.next(false);
    this.router.navigate(['/login']);
  }

  private hasToken(): boolean {
    return !!localStorage.getItem('auth_token');
  }
}

import { Component, OnInit, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { AuthService } from './core/services/auth.service';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet],
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class App implements OnInit {
  constructor(private authService: AuthService) {}
  ngOnInit(): void {
    // Uygulama açıldığında Token var mı diye bak
    if (this.authService.getToken()) {
      // Token varsa Auto-Login isteği at (Token geçerli mi diye backend kontrol etsin)
      this.authService.autoLogin().subscribe({
        next: (res) => {
          // Başarılıysa zaten servis içinde yeni token kaydedildi.
          console.log('Kullanıcı oturumu doğrulandı.');
        },
        error: (err) => {
          // Token geçersizse veya süresi dolmuşsa çıkış yap
          console.warn('Oturum süresi dolmuş.');
          this.authService.logout();
        },
      });
    }
  }
}

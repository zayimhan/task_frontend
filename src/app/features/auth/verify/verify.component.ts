import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-verify',
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './verify.component.html',
  styleUrl: './verify.component.css',
})
export class VerifyComponent implements OnInit, OnDestroy {
  verifyForm: FormGroup;
  userId: number | null = null;
  verificationType: string = 'EMAIL';

  errorMessage: string = '';
  successMessage: string = '';

  // Geri Sayım Değişkenleri
  countdown: number = 0; // Ekranda görünecek sayaç
  isResending: boolean = false; // Sadece API isteği atılırken true olur
  private timer: any; // Timer referansı (sayfadan çıkınca durdurmak için)

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private route: ActivatedRoute,
    private router: Router,
    private cdr: ChangeDetectorRef,
  ) {
    this.verifyForm = this.fb.group({
      code: ['', [Validators.required, Validators.minLength(4)]],
    });
  }

  ngOnInit(): void {
    this.route.queryParams.subscribe((params) => {
      this.userId = params['userId'] ? +params['userId'] : null;
      if (params['type']) {
        this.verificationType = params['type'];
      }
    });
  }

  // Sayfadan çıkılırsa sayacı temizle (Memory Leak önlemi)
  ngOnDestroy(): void {
    if (this.timer) {
      clearInterval(this.timer);
    }
  }

  onSubmit() {
    // ... Mevcut kodların aynı kalsın ...
    if (this.verifyForm.invalid || !this.userId) return;

    const code = this.verifyForm.value.code;
    this.authService.verifyCode(this.userId, code).subscribe({
      next: () => {
        this.successMessage = 'Giriş yapılıyor...';
        this.authService.autoLogin().subscribe({
          next: () => this.router.navigate(['/home']),
          error: () => this.router.navigate(['/login']),
        });
      },
      error: (err) => {
        this.errorMessage = err.error?.message || 'Kod hatalı.';
      },
    });
  }

  isFadingOut: boolean = false; // Animasyon kontrolü için

  // --- GÜNCELLENEN KISIM ---
  resendCode() {
    if (!this.userId || this.countdown > 0 || this.isResending) return;

    // 1. Yükleniyor durumuna al
    this.isResending = true;
    this.errorMessage = '';
    this.successMessage = '';
    this.isFadingOut = false; // Animasyonu sıfırla

    this.authService.resendVerificationCode(this.userId, this.verificationType).subscribe({
      next: () => {
        // 2. Başarılı oldu, yükleniyor'u kapat
        this.isResending = false;
        this.showTemporarySuccess('Yeni doğrulama kodu gönderildi!');

        // 3. Hemen geri sayımı başlat
        this.startCountdown();
        this.cdr.detectChanges();
      },
      error: (err) => {
        // Hata olursa da yükleniyor'u kapat ki tekrar deneyebilsin
        this.isResending = false;
        this.errorMessage = 'Hata: ' + (err.error?.message || 'Gönderilemedi.');
      },
    });
  }

  startCountdown() {
    this.countdown = 60; // 60 Saniye ayarı
    this.cdr.detectChanges();
    this.timer = setInterval(() => {
      this.countdown--;
      this.cdr.detectChanges();
      if (this.countdown <= 0) {
        clearInterval(this.timer);
      }
    }, 1000);
  }

  showTemporarySuccess(message: string) {
    this.successMessage = message;
    this.isFadingOut = false;
    this.cdr.detectChanges();

    // 4 Saniye ekranda kalsın
    setTimeout(() => {
      // 1. Animasyonu başlat (Fade Out class'ı eklenecek)
      this.isFadingOut = true;
      this.cdr.detectChanges();

      // 2. Animasyon bitince (0.5sn sonra) metni tamamen sil
      setTimeout(() => {
        this.successMessage = '';
        this.isFadingOut = false;
        this.cdr.detectChanges();
      }, 500); // CSS transition süresiyle (0.5s) aynı olmalı
    }, 4000); // Kullanıcı 4 saniye boyunca mesajı okur
  }
}

import { Component, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-login',
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './login.component.html',
  styleUrl: './login.component.css',
})
export class LoginComponent {
  loginForm: FormGroup;
  errorMessage: string = '';

  // YENİ: Yönlendirme ve Yükleme durumlarını yönetmek için
  isLoading: boolean = false;
  isRedirecting: boolean = false;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router,
    private cdr: ChangeDetectorRef,
  ) {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', Validators.required],
    });
  }

  onSubmit() {
    if (this.loginForm.invalid) return;

    this.errorMessage = '';
    this.isRedirecting = false;
    this.isLoading = true; // 1. Butonu kilitle ve döndür

    this.authService.login(this.loginForm.value).subscribe({
      next: () => {
        // Başarılı giriş
        this.isLoading = false;
        this.router.navigate(['/home']);
      },
      error: (err) => {
        this.isLoading = false; // Hata gelince butonu serbest bırak

        // Angular'ın hata paketini açıyoruz
        const backendResponse = err.error;
        const errorMsg = backendResponse?.message;
        const userId = backendResponse?.data;

        // --- MANTIK KONTROLÜ ---
        if (errorMsg === 'VERIFICATION_REQUIRED') {
          this.isRedirecting = true; // Mavi uyarıyı göster
          this.errorMessage =
            'Hesabınız doğrulanmamış. Yeni kod gönderildi, yönlendiriliyorsunuz...';

          if (userId) {
            // SÜREYİ KISALTTIK: 1 Saniye (Kullanıcı çok beklemesin)
            setTimeout(() => {
              this.router.navigate(['/verify'], {
                queryParams: {
                  userId: userId,
                  type: 'EMAIL',
                },
              });
            }, 1000);
          } else {
            this.isRedirecting = false;
            this.errorMessage = 'Doğrulama gerekli ancak ID alınamadı.';
          }
        } else if (errorMsg === 'INVALID_CREDENTIALS') {
          this.errorMessage = 'E-posta veya şifre hatalı.';
        } else if (errorMsg === 'USER_NOT_ACTIVE') {
          this.errorMessage = 'Hesabınız askıya alınmış.';
        } else {
          this.errorMessage = errorMsg || 'Giriş başarısız. Lütfen tekrar deneyin.';
        }

        this.cdr.detectChanges();
      },
    });
  }
}

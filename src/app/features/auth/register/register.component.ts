import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { AddressService } from '../../../core/services/address.service';
import { VerificationType } from '../../../models/register-request';

@Component({
  selector: 'app-register',
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './register.component.html',
  styleUrl: './register.component.css',
})
export class RegisterComponent implements OnInit {
  registerForm: FormGroup;
  selectedFile: File | null = null;
  verificationTypes = Object.values(VerificationType);
  errorMessage: string = '';
  successMessage: string = '';

  countries: any[] = [];
  states: any[] = [];

  // Backend hata kodlarını Türkçeye çeviren sözlük
  private errorMessages: { [key: string]: string } = {
    INVALID_TC_NUMBER: 'TC Kimlik Numarası doğrulanamadı (Algoritma hatası).',
    INVALID_TC_FORMAT: 'TC Kimlik Numarası formatı hatalı.',
    EMAIL_ALREADY_EXISTS: 'Bu e-posta adresi zaten kayıtlı.',
    PHONE_ALREADY_EXISTS: 'Bu telefon numarası zaten kayıtlı.',
    TC_ALREADY_EXISTS: 'Bu TC Kimlik Numarası zaten kayıtlı.',
    WEAK_PASSWORD:
      'Şifreniz çok zayıf. En az bir büyük harf, bir sayı ve özel karakter içermelidir.',
    EMAIL_SEND_FAILED: 'Kayıt yapıldı ancak doğrulama maili gönderilemedi.',
    VALIDATION_ERROR: 'Lütfen formdaki hatalı alanları düzeltin.',
  };

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private addressService: AddressService,
    private route: ActivatedRoute,
    private router: Router,
  ) {
    this.registerForm = this.fb.group({
      tc: ['', [Validators.required, Validators.pattern(/^[1-9][0-9]{10}$/)]],
      fullName: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      phone: ['', [Validators.required, Validators.pattern(/^[0-9]{10}$/)]],
      password: ['', [Validators.required, Validators.minLength(8)]],
      verificationType: ['EMAIL', Validators.required],
      addressRequest: this.fb.group({
        countryId: [null, Validators.required],
        cityId: [null, Validators.required],
        addressText: ['', Validators.required],
      }),
    });
  }

  ngOnInit(): void {
    this.loadCountries();
  }

  onlyNumbers(event: any): void {
    const input = event.target as HTMLInputElement;
    input.value = input.value.replace(/[^0-9]/g, '');
    const controlName = input.getAttribute('formControlName');
    if (controlName) {
      this.registerForm.get(controlName)?.setValue(input.value);
    }
  }

  isFieldInvalid(fieldName: string): boolean {
    const field = this.registerForm.get(fieldName);
    return !!(field?.invalid && (field?.dirty || field?.touched));
  }

  loadCountries() {
    this.addressService.getCountries().subscribe({
      next: (res: any) => {
        this.countries = res.data || res;
      },
      error: (err) => console.error('Ülkeler yüklenemedi', err),
    });
  }

  onCountryChange() {
    const countryId = this.registerForm.get('addressRequest.countryId')?.value;
    this.states = [];
    this.registerForm.get('addressRequest.cityId')?.setValue(null);

    if (countryId) {
      this.addressService.getStatesByCountry(countryId).subscribe({
        next: (res: any) => {
          this.states = res.data || res;
        },
        error: (err) => console.error('Şehirler yüklenemedi', err),
      });
    }
  }

  onFileSelected(event: any) {
    if (event.target.files && event.target.files.length > 0) {
      this.selectedFile = event.target.files[0];
    }
  }

  onSubmit() {
    if (this.registerForm.invalid || !this.selectedFile) {
      this.errorMessage = 'Lütfen tüm alanları doldurun ve fotoğraf seçin.';
      this.registerForm.markAllAsTouched();
      return;
    }

    this.errorMessage = '';

    const formData = this.registerForm.value;
    if (formData.phone.startsWith('0')) {
      formData.phone = formData.phone.substring(1);
    }

    this.authService.register(formData, this.selectedFile).subscribe({
      next: (response: any) => {
        // AuthController -> return Map.of("userId", user.getId())
        const userId = response.userId;
        const type = this.registerForm.get('verificationType')?.value;

        if (userId) {
          // Başarılı, doğrulama sayfasına git
          this.router.navigate(['/verify'], {
            queryParams: { userId: userId, type: type },
          });
        }
      },
      error: (err) => {
        console.error('Kayıt Hatası:', err);

        // 1. Backend'den gelen mesaj kodunu al (Örn: INVALID_TC_NUMBER)
        const errorCode = err.error?.message || 'UNKNOWN_ERROR';

        // 2. Türkçeye çevir
        this.errorMessage =
          this.errorMessages[errorCode] || err.error?.message || 'Sunucu hatası oluştu.';

        // 3. Validasyon Hataları (Hangi input hatalı?)
        if (err.error?.data) {
          const validationErrors = err.error.data;
          Object.keys(validationErrors).forEach((key) => {
            let control = this.registerForm.get(key);
            // Nested form (adres) kontrolü
            if (!control) control = this.registerForm.get('addressRequest.' + key);

            if (control) {
              control.setErrors({ serverError: validationErrors[key] });
              control.markAsTouched();
            }
          });
        }
      },
    });
  }
}

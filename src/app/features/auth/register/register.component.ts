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

      password: ['', [Validators.required, Validators.minLength(6)]],
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

  // Hata kontrolü için yardımcı fonksiyon (HTML'i temiz tutar)
  isFieldInvalid(fieldName: string): boolean {
    const field = this.registerForm.get(fieldName);
    // Hata varsa VE (kullanıcı dokunduysa VEYA form gönderildiyse) true döner
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
      this.errorMessage = 'Lütfen tüm alanları doğru şekilde doldurun ve fotoğraf seçin.';
      this.registerForm.markAllAsTouched();
      return;
    }

    this.errorMessage = '';
    this.successMessage = '';

    const formData = { ...this.registerForm.value };

    formData.phone = '0' + formData.phone;

    this.authService.register(this.registerForm.value, this.selectedFile).subscribe({
      next: (response: any) => {
        const userId = response.userId || (response.data && response.data.userId);
        const selectedType = this.registerForm.value.verificationType;

        if (userId) {
          this.router.navigate(['/verify'], {
            queryParams: { userId: userId, type: selectedType },
          });
        } else {
          this.successMessage = 'Kayıt başarılı! Lütfen giriş yapın.';
          setTimeout(() => this.router.navigate(['/login']), 2000);
        }
      },
      error: (err) => {
        console.error('Kayıt Hatası:', err);
        this.errorMessage = 'Kayıt başarısız: ' + (err.error?.message || 'Sunucu hatası.');
      },
    });
  }
}

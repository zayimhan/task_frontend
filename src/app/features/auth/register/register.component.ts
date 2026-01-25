import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router'; // RouterLink eklendi
import { AuthService } from '../../../core/services/auth.service';
import { AddressService } from '../../../core/services/address.service'; // AddressService eklendi
import { VerificationType } from '../../../models/register-request';

@Component({
  selector: 'app-register',
  imports: [CommonModule, ReactiveFormsModule, RouterLink], // RouterLink HTML'deki link için lazım
  templateUrl: './register.component.html',
  styleUrl: './register.component.css',
})
export class RegisterComponent implements OnInit {
  registerForm: FormGroup;
  selectedFile: File | null = null;
  verificationTypes = Object.values(VerificationType);
  errorMessage: string = '';
  successMessage: string = '';

  // Dropdown Listeleri
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

      // Adres Grubu
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

  // 1. Ülkeleri Backend'den Çek
  loadCountries() {
    this.addressService.getCountries().subscribe({
      next: (res: any) => {
        // Backend yapına göre: res.data veya direkt res
        this.countries = res.data || res;
      },
      error: (err) => {
        console.error('Ülkeler yüklenemedi', err);
        // Hata durumunda kullanıcıya hissettirmemek için boş dizi kalabilir veya log basılabilir
      },
    });
  }

  // 2. Ülke Değiştiğinde Şehirleri Çek
  onCountryChange() {
    const countryId = this.registerForm.get('addressRequest.countryId')?.value;

    // Şehir listesini ve seçili değeri sıfırla
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

  // Dosya Seçimi
  onFileSelected(event: any) {
    if (event.target.files && event.target.files.length > 0) {
      this.selectedFile = event.target.files[0];
    }
  }

  // Form Gönderme
  onSubmit() {
    if (this.registerForm.invalid || !this.selectedFile) {
      this.errorMessage = 'Lütfen tüm alanları doldurun ve profil fotoğrafı seçin.';
      // Formdaki hatalı alanları kırmızı yakmak için touch edebilirsin (Opsiyonel)
      this.registerForm.markAllAsTouched();
      return;
    }

    this.errorMessage = '';
    this.successMessage = '';

    this.authService.register(this.registerForm.value, this.selectedFile).subscribe({
      next: (response: any) => {
        // Backend'den dönen userId'yi yakala
        // response.data?.userId veya direkt response.userId olabilir, backend yapına göre değişir.
        const userId = response.userId || (response.data && response.data.userId);

        const selectedType = this.registerForm.value.verificationType;

        if (userId) {
          // Verify sayfasına yönlendir
          this.router.navigate(['/verify'], {
            queryParams: { userId: userId, type: selectedType },
          });
        } else {
          // ID dönmezse login sayfasına atabilirsin
          this.successMessage = 'Kayıt başarılı! Lütfen giriş yapın.';
          setTimeout(() => this.router.navigate(['/login']), 2000);
        }
      },
      error: (err) => {
        console.error('Kayıt Hatası:', err);
        this.errorMessage =
          'Kayıt başarısız: ' + (err.error?.message || 'Sunucu hatası, lütfen tekrar deneyin.');
      },
    });
  }
}

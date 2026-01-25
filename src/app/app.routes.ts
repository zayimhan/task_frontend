import { Routes } from '@angular/router';
import { RegisterComponent } from './features/auth/register/register.component';
import { VerifyComponent } from './features/auth/verify/verify.component';
import { LoginComponent } from './features/auth/login/login.component';
import { DashboardComponent } from './features/dashboard/dashboard.component';

export const routes: Routes = [
  // 1. Kayıt Sayfası
  { path: 'register', component: RegisterComponent },

  // 2. Doğrulama Sayfası (URL'de ?userId=... parametresi alacak)
  { path: 'verify', component: VerifyComponent },

  // 3. Varsayılan Rota: Kullanıcı siteye girince direkt Register'a gitsin
  { path: '', redirectTo: 'register', pathMatch: 'full' },

  // İPUCU: VerifyComponent içinde '/login'e yönlendiriyoruz ama henüz yapmadık.
  // Login componentini oluşturunca şu satırı ekleyeceksin:
  { path: 'login', component: LoginComponent },

  { path: 'home', component: DashboardComponent }, // /home -> Dashboard
];

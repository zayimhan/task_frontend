import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../core/services/auth.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-dashboard',
  imports: [CommonModule],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.css',
})
export class DashboardComponent implements OnInit {
  user: any = null;
  token: string | null = null;
  loading: boolean = true;

  constructor(
    private authService: AuthService,
    private router: Router,
    private cdr: ChangeDetectorRef,
  ) {}

  ngOnInit(): void {
    // Token'ı gösterim amaçlı alıyoruz
    this.token = this.authService.getToken();

    // Profil isteği atıyoruz
    this.authService.getProfile().subscribe({
      next: (response: any) => {
        // Senin JSON formatın: { success: true, data: { ... } }
        this.user = response.data;
        this.loading = false;
        console.log('Gelen Kullanıcı:', this.user);
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Profil alınamadı:', err);
        this.loading = false;
        // Token süresi dolduysa login'e atabilirsin
        this.cdr.detectChanges();
        this.router.navigate(['/login']);
      },
    });
  }

  logout() {
    this.authService.logout();
  }
}

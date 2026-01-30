import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { catchError, throwError } from 'rxjs';
import { inject } from '@angular/core';

export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      let errorMessage = 'Beklenmeyen bir hata oluştu.';

      if (error.error instanceof ErrorEvent) {
        // İstemci (Client) taraflı hata (Ağ kopması vs.)
        errorMessage = `Hata: ${error.error.message}`;
      } else {
        if (error.error && error.error.message) {
          errorMessage = error.error.message;
        } else {
          // Standart HTTP hata mesajı
          errorMessage = `Hata Kodu: ${error.status}\nMesaj: ${error.message}`;
        }
      }

      // Hata mesajını konsola bas (İleride buraya ToastrService ekleyebilirsin)
      console.warn('🛑 Yakalanan Hata:', errorMessage);

      // Hatayı bileşene (Component) geri fırlat ki orada da işlenebilsin
      return throwError(() => error);
    }),
  );
};

import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../enviroments/enviroment.prod';

@Injectable({
  providedIn: 'root',
})
export class AddressService {
  private apiUrl = `${environment.apiUrl}/address`;

  constructor(private http: HttpClient) {}

  getCountries(): Observable<any> {
    return this.http.get(`${this.apiUrl}/countries`);
  }

  getStatesByCountry(countryId: number): Observable<any> {
    return this.http.get(`${this.apiUrl}/states/${countryId}`);
  }
}

import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { environment } from '../../../enviroments/enviroment.prod';
import { ADDRESS_DATA } from '../constants/address-data';

@Injectable({
  providedIn: 'root',
})
export class AddressService {
  /*private apiUrl = `${environment.apiUrl}/address`;

  constructor(private http: HttpClient) {}

  getCountries(): Observable<any> {
    return this.http.get(`${this.apiUrl}/countries`);
  }

  getStatesByCountry(countryId: number): Observable<any> {
    return this.http.get(`${this.apiUrl}/states/${countryId}`);
  }*/
  getCountries(): Observable<any[]> {
    return of(ADDRESS_DATA);
  }

  getStatesByCountry(countryId: number): Observable<any[]> {
    const country = ADDRESS_DATA.find((c) => c.id == countryId);
    return of(country ? country.states : []);
  }
}

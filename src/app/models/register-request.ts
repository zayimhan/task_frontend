export enum VerificationType {
  SMS = 'SMS',
  EMAIL = 'EMAIL',
}

export interface AddressRequest {
  cityId: number | null; // Form ilk açıldığında null olabilir
  addressText: string;
}

export interface RegisterRequest {
  tc: string;
  fullName: string;
  email: string;
  phone: string;
  password: string;
  verificationType: VerificationType;
  addressRequest: AddressRequest;
}

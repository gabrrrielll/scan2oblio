export interface OblioConfig {
  email: string;
  apiSecret: string;
  cif: string; // Company CIF
  seriesName: string; // Invoice series
}

export interface OblioTokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
  scope?: string;
}

export interface OblioProduct {
  name: string;
  code: string; // Cod CPV
  productCode?: string; // Cod produs (EAN - 13 cifre)
  price: number;
  measuringUnit: string;
  vatPercentage: number;
  currency?: string;
  stock: number; // Current inventory quantity
}

export interface ProductItem {
  id: string;
  name: string;
  barcode: string | null;
  quantity: number;
  price: number;
  vatPercentage: number;
  unit: string;
}

export enum AppStatus {
  IDLE = 'IDLE',
  SCANNING = 'SCANNING',
  SENDING_OBLIO = 'SENDING_OBLIO',
  SUCCESS = 'SUCCESS',
  WARNING = 'WARNING',
  ERROR = 'ERROR'
}

export interface ScanResult {
  rawValue: string;
  format: string;
}
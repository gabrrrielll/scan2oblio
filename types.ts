export interface OblioConfig {
  email: string;
  apiSecret: string;
  cif: string; // Company CIF
  seriesName: string; // Invoice series
  workStation?: string; // Warehouse/Management location (optional)
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

export interface OblioClient {
  id: string;
  name: string;
  cif: string;
  rc?: string;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  email?: string;
  phone?: string;
  iban?: string;
  bank?: string;
  contact?: string;
  vatPayer?: boolean;
}

export interface InvoiceFormData {
  // Client
  client: OblioClient | null;

  // Dates
  issueDate: string;
  dueDate?: string;
  deliveryDate?: string;
  collectDate?: string;

  // Document info
  seriesName: string;
  workStation: string;
  language: string;
  currency: string;

  // Products
  products: ProductItem[];

  // Additional info
  mentions?: string;
  internalNote?: string;
  issuerName?: string;
  issuerId?: string;
  deputyName?: string;
  deputyIdentityCard?: string;
  deputyAuto?: string;
  salesAgent?: string;
  noticeNumber?: string;
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

export interface Person {
  id: string;
  name: string;
  type: 'issuer' | 'deputy' | 'salesAgent';
  // Câmpuri specifice
  cnp?: string;          // Pentru emitent
  identityCard?: string; // Pentru delegat
  auto?: string;         // Pentru delegat (mașina)
  lastUsed?: string;     // Pentru sortare
}

export interface StoredPersons {
  issuers: Person[];
  deputies: Person[];
  salesAgents: Person[];
}
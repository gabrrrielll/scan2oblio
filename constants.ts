// API endpoints - acum folosite doar pentru referință
// Toate apelurile se fac prin backend PHP (api.php)
export const API_ENDPOINTS = {
  BASE_URL: 'https://www.oblio.eu/api/v1',
  AUTH_URL: 'https://www.oblio.eu/api/authorize/token',
  PRODUCTS: '/nomenclatures/products',
  INVOICE: '/docs/invoice',
};

export const STORAGE_KEYS = {
  CONFIG: 'oblio_config',
  // Token-urile nu mai sunt stocate în localStorage, sunt gestionate de backend PHP
};

export const DEFAULT_VAT_PERCENTAGE = 19;
export const DEFAULT_CURRENCY = 'RON';
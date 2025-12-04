import { OblioConfig, ProductItem, OblioProduct } from '../types';
import { API_ENDPOINTS } from '../constants';

// Backend PHP endpoint (relativ la domeniul aplicației)
const PHP_BACKEND_URL = './api.php';

/**
 * Fetch Products from Oblio via PHP backend
 */
export const getProductsFromOblio = async (config: OblioConfig): Promise<OblioProduct[]> => {
  console.log("Fetching inventory from Oblio via PHP backend...");
  
  if (!config.email || !config.apiSecret || !config.cif) {
    throw new Error("Credențiale Oblio lipsă (Email, Secret, CIF).");
  }

  const safeCif = encodeURIComponent(config.cif.trim());
  const safeEmail = encodeURIComponent(config.email.trim());
  const safeSecret = encodeURIComponent(config.apiSecret.trim());

  const targetUrl = `${PHP_BACKEND_URL}?action=products&email=${safeEmail}&apiSecret=${safeSecret}&cif=${safeCif}`;

  try {
    const response = await fetch(targetUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    });

    const json = await response.json();

    if (!json.success) {
      throw new Error(json.error || "Eroare la obținerea produselor din Oblio.");
    }

    if (!json.data || !Array.isArray(json.data)) {
      console.warn("Unexpected API response format:", json);
      return [];
    }

    // Datele vin deja mapate corect din PHP
    return json.data as OblioProduct[];

  } catch (error: any) {
    console.error("Oblio API Fetch Error:", error);
    if (error.message.includes('Failed to fetch')) {
      throw new Error("Eroare Conexiune. Verificați că backend-ul PHP este accesibil.");
    }
    throw error;
  }
};

/**
 * Create Invoice in Oblio via PHP backend
 */
export const createInvoiceInOblio = async (config: OblioConfig, products: ProductItem[]): Promise<any> => {
  const payload = {
    email: config.email.trim(),
    apiSecret: config.apiSecret.trim(),
    cif: config.cif.trim(),
    seriesName: config.seriesName?.trim() || '',
    products: products.map(p => ({
      name: p.name,
      barcode: p.barcode,
      unit: p.unit,
      quantity: p.quantity,
      price: p.price,
      vatPercentage: p.vatPercentage
    }))
  };

  try {
    const response = await fetch(PHP_BACKEND_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        action: 'invoice',
        ...payload
      })
    });

    const json = await response.json();

    if (!json.success) {
      throw new Error(json.error || "Eroare la generarea facturii.");
    }

    return {
      status: json.status || 200,
      message: json.message || "Factura a fost emisă cu succes!",
      link: json.link
    };

  } catch (error: any) {
    console.error("Oblio Invoice Create Error:", error);
    if (error.message.includes('Failed to fetch')) {
      throw new Error("Eroare Conexiune. Verificați că backend-ul PHP este accesibil.");
    }
    throw error;
  }
};
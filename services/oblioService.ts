import { OblioConfig, ProductItem, OblioProduct, OblioClient } from '../types';
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
  const safeWorkStation = config.workStation ? encodeURIComponent(config.workStation.trim()) : '';

  const targetUrl = `${PHP_BACKEND_URL}?action=products&email=${safeEmail}&apiSecret=${safeSecret}&cif=${safeCif}&management=${safeWorkStation}`;

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

    // Debug: log primul produs pentru a vedea structura
    if (json.data.length > 0) {
      console.log("First product from API:", json.data[0]);
      console.log("Product keys:", Object.keys(json.data[0]));
      console.log("All products sample (first 3):", json.data.slice(0, 3));
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
 * Fetch Clients from Oblio via PHP backend
 */
export const getClientsFromOblio = async (config: OblioConfig): Promise<OblioClient[]> => {
  console.log("Fetching clients from Oblio via PHP backend...");

  if (!config.email || !config.apiSecret || !config.cif) {
    throw new Error("Credențiale Oblio lipsă (Email, Secret, CIF).");
  }

  const safeCif = encodeURIComponent(config.cif.trim());
  const safeEmail = encodeURIComponent(config.email.trim());
  const safeSecret = encodeURIComponent(config.apiSecret.trim());

  const targetUrl = `${PHP_BACKEND_URL}?action=clients&email=${safeEmail}&apiSecret=${safeSecret}&cif=${safeCif}`;

  try {
    const response = await fetch(targetUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    });

    const json = await response.json();

    if (!json.success) {
      throw new Error(json.error || "Eroare la obținerea clienților din Oblio.");
    }

    if (!json.data || !Array.isArray(json.data)) {
      console.warn("Unexpected API response format:", json);
      return [];
    }

    console.log("Clients fetched:", json.data.length);
    return json.data as OblioClient[];

  } catch (error: any) {
    console.error("Oblio Clients Fetch Error:", error);
    if (error.message.includes('Failed to fetch')) {
      throw new Error("Eroare Conexiune. Verificați că backend-ul PHP este accesibil.");
    }
    throw error;
  }
};


/**
 * Create Client in Oblio via PHP backend
 */
export const createClientInOblio = async (
  config: OblioConfig,
  client: Partial<OblioClient>
): Promise<any> => {
  const payload = {
    email: config.email.trim(),
    apiSecret: config.apiSecret.trim(),
    cif: config.cif.trim(),
    client: client
  };

  try {
    const response = await fetch(PHP_BACKEND_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        action: 'createClient',
        ...payload
      })
    });

    const json = await response.json();

    if (!json.success) {
      throw new Error(json.error || "Eroare la crearea clientului.");
    }

    return {
      status: json.status || 200,
      message: json.message || "Clientul a fost creat cu succes!",
      data: json.data
    };

  } catch (error: any) {
    console.error("Oblio Client Create Error:", error);
    if (error.message.includes('Failed to fetch')) {
      throw new Error("Eroare Conexiune. Verificați că backend-ul PHP este accesibil.");
    }
    throw error;
  }
};

/**
 * Create Invoice in Oblio via PHP backend
 */
export const createInvoiceInOblio = async (
  config: OblioConfig,
  invoiceData: {
    client?: any;
    issueDate?: string;
    dueDate?: string;
    deliveryDate?: string;
    collectDate?: string;
    seriesName?: string;
    workStation?: string;
    language?: string;
    currency?: string;
    products: ProductItem[];
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
): Promise<any> => {
  const payload: any = {
    email: config.email.trim(),
    apiSecret: config.apiSecret.trim(),
    cif: config.cif.trim(),
    seriesName: invoiceData.seriesName || config.seriesName?.trim() || '',
    workStation: invoiceData.workStation || config.workStation?.trim() || 'Sediu',
    products: invoiceData.products.map(p => ({
      name: p.name,
      barcode: p.barcode,
      unit: p.unit,
      quantity: p.quantity,
      price: p.price,
      vatPercentage: p.vatPercentage
    }))
  };

  // Add client data if provided
  if (invoiceData.client) {
    payload.client = invoiceData.client;
  }

  // Add dates if provided
  if (invoiceData.issueDate) payload.issueDate = invoiceData.issueDate;
  if (invoiceData.dueDate) payload.dueDate = invoiceData.dueDate;
  if (invoiceData.deliveryDate) payload.deliveryDate = invoiceData.deliveryDate;
  if (invoiceData.collectDate) payload.collectDate = invoiceData.collectDate;

  // Add language and currency
  if (invoiceData.language) payload.language = invoiceData.language;
  if (invoiceData.currency) payload.currency = invoiceData.currency;

  // Add mentions and notes
  if (invoiceData.mentions) payload.mentions = invoiceData.mentions;
  if (invoiceData.internalNote) payload.internalNote = invoiceData.internalNote;

  // Add issuer data
  if (invoiceData.issuerName) payload.issuerName = invoiceData.issuerName;
  if (invoiceData.issuerId) payload.issuerId = invoiceData.issuerId;

  // Add deputy data
  if (invoiceData.deputyName) payload.deputyName = invoiceData.deputyName;
  if (invoiceData.deputyIdentityCard) payload.deputyIdentityCard = invoiceData.deputyIdentityCard;
  if (invoiceData.deputyAuto) payload.deputyAuto = invoiceData.deputyAuto;

  // Add sales agent
  if (invoiceData.salesAgent) payload.salesAgent = invoiceData.salesAgent;

  // Add notice number
  if (invoiceData.noticeNumber) payload.noticeNumber = invoiceData.noticeNumber;

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

/**
 * Get Nomenclature (generic)
 */
export const getNomenclature = async (
  config: OblioConfig,
  type: 'management' | 'work_stations' | 'vat_rates' | 'languages' | 'currencies'
): Promise<any[]> => {
  if (!config.email || !config.apiSecret || !config.cif) {
    console.warn("Credentials missing for nomenclature fetch");
    return [];
  }

  const safeCif = encodeURIComponent(config.cif.trim());
  const safeEmail = encodeURIComponent(config.email.trim());
  const safeSecret = encodeURIComponent(config.apiSecret.trim());
  const safeType = encodeURIComponent(type);

  const targetUrl = `${PHP_BACKEND_URL}?action=nomenclature&email=${safeEmail}&apiSecret=${safeSecret}&cif=${safeCif}&type=${safeType}`;

  try {
    const response = await fetch(targetUrl);
    const json = await response.json();

    if (!json.success) {
      console.warn(`Failed to fetch nomenclature ${type}:`, json.error);
      return [];
    }

    return json.data || [];
  } catch (error) {
    console.error(`Error fetching nomenclature ${type}:`, error);
    return [];
  }
};

/**
 * Get Work Stations (Puncte de lucru)
 */
export const getWorkStations = async (config: OblioConfig): Promise<any[]> => {
  return await getNomenclature(config, 'work_stations');
};

/**
 * Get Management Units (Gestiuni)
 */
export const getManagementUnits = async (config: OblioConfig): Promise<any[]> => {
  return await getNomenclature(config, 'management');
};
<?php

/**
 * Backend PHP pentru Scan2Oblio
 * Rezolvă problema CORS prin proxy pentru API-ul Oblio
 */

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

// Handle preflight requests
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

// Configurare API Oblio
define('OBLIO_AUTH_URL', 'https://www.oblio.eu/api/authorize/token');
define('OBLIO_BASE_URL', 'https://www.oblio.eu/api');

// Cache pentru token-uri (în producție, folosiți Redis sau alt sistem de cache)
$tokenCache = [];

/**
 * Obține token de acces de la Oblio
 */
function getAccessToken($email, $apiSecret)
{
    global $tokenCache;

    $cacheKey = md5($email . $apiSecret);

    // Verifică cache-ul (în producție, folosiți un sistem persistent)
    if (isset($tokenCache[$cacheKey])) {
        $cached = $tokenCache[$cacheKey];
        if (time() < $cached['expires_at']) {
            return $cached['token'];
        }
    }

    $ch = curl_init(OBLIO_AUTH_URL);
    curl_setopt_array($ch, [
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_POST => true,
        CURLOPT_POSTFIELDS => http_build_query([
            'client_id' => $email,
            'client_secret' => $apiSecret,
            'grant_type' => 'client_credentials'
        ]),
        CURLOPT_HTTPHEADER => [
            'Content-Type: application/x-www-form-urlencoded'
        ]
    ]);

    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    $error = curl_error($ch);
    curl_close($ch);

    if ($error) {
        throw new Exception("Eroare conexiune: " . $error);
    }

    if ($httpCode !== 200) {
        if ($httpCode === 401) {
            throw new Exception("Autentificare eșuată. Verificați Email-ul și API Secret.");
        }
        throw new Exception("Eroare Autentificare: HTTP $httpCode");
    }

    $data = json_decode($response, true);

    if (!isset($data['access_token'])) {
        throw new Exception("Răspuns invalid de la Oblio API");
    }

    // Salvează în cache (expiră cu 60s înainte de expirarea reală)
    $tokenCache[$cacheKey] = [
        'token' => $data['access_token'],
        'expires_at' => time() + $data['expires_in'] - 60
    ];

    return $data['access_token'];
}

/**
 * Obține clienții din Oblio cu paginare
 */
function getClients($email, $apiSecret, $cif)
{
    $token = getAccessToken($email, $apiSecret);

    $allClients = [];
    $limitPerPage = 250; // Maxim permis de API
    $offset = 0;
    $hasMore = true;

    error_log("=== FETCHING ALL CLIENTS WITH PAGINATION ===");

    while ($hasMore) {
        $url = OBLIO_BASE_URL . '/nomenclature/clients?cif=' . urlencode($cif) .
               '&limitPerPage=' . $limitPerPage .
               '&offset=' . $offset;

        $ch = curl_init($url);
        curl_setopt_array($ch, [
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_HTTPHEADER => [
                'Authorization: Bearer ' . $token,
                'X-Oblio-Email: ' . $email,
                'Content-Type: application/json'
            ]
        ]);

        $response = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        $error = curl_error($ch);
        curl_close($ch);

        if ($error) {
            throw new Exception("Eroare conexiune: " . $error);
        }

        if ($httpCode === 401) {
            throw new Exception("Token expirat sau invalid. Reîncercați.");
        }

        if ($httpCode === 404) {
            throw new Exception("Nu s-au găsit clienți (CIF incorect?).");
        }

        if ($httpCode !== 200) {
            throw new Exception("Eroare API Oblio: HTTP $httpCode");
        }

        $data = json_decode($response, true);

        if (!isset($data['data']) || !is_array($data['data'])) {
            $hasMore = false;
            break;
        }

        $pageClients = $data['data'];
        $allClients = array_merge($allClients, $pageClients);

        error_log("Fetched " . count($pageClients) . " clients (total so far: " . count($allClients) . ")");

        if (count($pageClients) < $limitPerPage) {
            $hasMore = false;
        } else {
            $offset += $limitPerPage;
        }
    }

    error_log("=== TOTAL CLIENTS FETCHED: " . count($allClients) . " ===");

    // Mapează clienții la formatul așteptat
    $clients = [];
    foreach ($allClients as $c) {
        $clients[] = [
            'id' => $c['id'] ?? '',
            'name' => $c['name'] ?? '',
            'cif' => $c['cif'] ?? '',
            'rc' => $c['rc'] ?? '',
            'address' => $c['address'] ?? '',
            'city' => $c['city'] ?? '',
            'state' => $c['state'] ?? '',
            'country' => $c['country'] ?? '',
            'email' => $c['email'] ?? '',
            'phone' => $c['phone'] ?? '',
            'iban' => $c['iban'] ?? '',
            'bank' => $c['bank'] ?? '',
            'contact' => $c['contact'] ?? '',
            'vatPayer' => $c['vatPayer'] ?? false
        ];
    }

    return $clients;
}

/**
 * Obține produsele din Oblio cu paginare pentru a obține TOATE produsele
 */
function getProducts($email, $apiSecret, $cif, $management = null)
{
    $token = getAccessToken($email, $apiSecret);

    // Conform documentației Oblio API, folosim paginare pentru a obține toate produsele
    // limitPerPage: maxim 250 (conform documentației)
    // offset: pentru paginare
    $allProducts = [];
    $limitPerPage = 250; // Maxim permis de API
    $offset = 0;
    $hasMore = true;

    error_log("=== FETCHING ALL PRODUCTS WITH PAGINATION (Management: " . ($management ?? 'ALL') . ") ===");

    while ($hasMore) {
        // Construiește URL cu parametri de paginare
        // Conform documentației Oblio API, parametrii pot fi în query string sau în filters
        $url = OBLIO_BASE_URL . '/nomenclature/products?cif=' . urlencode($cif) .
               '&limitPerPage=' . $limitPerPage .
               '&offset=' . $offset;
        
        // Adaugă filtru de gestiune dacă este specificat
        if (!empty($management)) {
            $url .= '&management=' . urlencode($management);
        }

        error_log("=== PAGINATION REQUEST ===");
        error_log("URL: " . $url);
        error_log("Offset: $offset, Limit: $limitPerPage");
        error_log("Full URL: " . $url);

        // Încearcă să obțină detalii complete pentru fiecare produs folosind endpoint-ul individual
        // Dacă endpoint-ul de listă nu returnează codul de produs

        $ch = curl_init($url);
        curl_setopt_array($ch, [
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_HTTPHEADER => [
                'Authorization: Bearer ' . $token,
                'X-Oblio-Email: ' . $email,
                'Content-Type: application/json'
            ]
        ]);

        $response = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        $error = curl_error($ch);
        curl_close($ch);

        if ($error) {
            throw new Exception("Eroare conexiune: " . $error);
        }

        if ($httpCode === 401) {
            throw new Exception("Token expirat sau invalid. Reîncercați.");
        }

        if ($httpCode === 404) {
            throw new Exception("Nu s-au găsit date (CIF incorect?).");
        }

        if ($httpCode !== 200) {
            throw new Exception("Eroare API Oblio: HTTP $httpCode");
        }

        $data = json_decode($response, true);

        if (!isset($data['data']) || !is_array($data['data'])) {
            $hasMore = false;
            break;
        }

        $pageProducts = $data['data'];
        $allProducts = array_merge($allProducts, $pageProducts);

        error_log("Fetched " . count($pageProducts) . " products (total so far: " . count($allProducts) . ")");

        // Verifică dacă mai sunt produse de obținut
        // Dacă am primit mai puțin decât limitPerPage, înseamnă că am ajuns la final
        if (count($pageProducts) < $limitPerPage) {
            $hasMore = false;
        } else {
            $offset += $limitPerPage;
        }
    }

    error_log("=== TOTAL PRODUCTS FETCHED: " . count($allProducts) . " ===");

    // Folosește toate produsele obținute
    $data = ['data' => $allProducts];

    if (empty($data['data'])) {
        return [];
    }

    // Debug: log primul produs RAW din Oblio API pentru a vedea toate câmpurile disponibile
    if (!empty($data['data'])) {
        $firstProductRaw = $data['data'][0];
        error_log("Oblio API RAW First Product Keys: " . json_encode(array_keys($firstProductRaw)));
        error_log("Oblio API RAW First Product Full: " . json_encode($firstProductRaw));

        // Caută produsul specific cu ID 93841541 și codul 10000000000001
        $targetProductId = '93841541';
        $targetProductCode = '10000000000001';

        // Caută în lista de produse din răspunsul inițial
        $foundInList = false;
        foreach ($data['data'] as $product) {
            if (isset($product['id']) && $product['id'] == $targetProductId) {
                error_log("=== FOUND TARGET PRODUCT IN INITIAL LIST (ID: $targetProductId) ===");
                error_log("Target Product Keys: " . json_encode(array_keys($product)));
                error_log("Target Product Full: " . json_encode($product));
                error_log("Target Product 'code' field: " . (isset($product['code']) ? $product['code'] : 'NOT SET'));
                $foundInList = true;
                break;
            }
        }

        if (!$foundInList) {
            error_log("Target product ID $targetProductId NOT FOUND in initial list");
            error_log("Available IDs in initial list: " . json_encode(array_column($data['data'], 'id')));
        }

        // Încearcă să obțină detalii complete pentru produsul specific folosind ID-ul
        // Poate că există un endpoint diferit pentru un singur produs
        $detailUrl = OBLIO_BASE_URL . '/nomenclature/products/' . urlencode($targetProductId) . '?cif=' . urlencode($cif);

        error_log("=== FETCHING PRODUCT DETAILS ===");
        error_log("Detail URL: " . $detailUrl);

        $chDetail = curl_init($detailUrl);
        curl_setopt_array($chDetail, [
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_HTTPHEADER => [
                'Authorization: Bearer ' . $token,
                'X-Oblio-Email: ' . $email,
                'Content-Type: application/json'
            ]
        ]);

        $detailResponse = curl_exec($chDetail);
        $detailHttpCode = curl_getinfo($chDetail, CURLINFO_HTTP_CODE);
        $detailError = curl_error($chDetail);
        curl_close($chDetail);

        error_log("Detail HTTP Code: " . $detailHttpCode);
        if ($detailError) {
            error_log("Detail CURL Error: " . $detailError);
        }
        error_log("Detail Response: " . $detailResponse);

        if ($detailHttpCode === 200) {
            $detailData = json_decode($detailResponse, true);
            error_log("=== PRODUCT DETAIL RESPONSE ===");
            error_log("Product Detail Response Structure Keys: " . json_encode(array_keys($detailData)));

            // Caută produsul specific cu ID 93841541 în array-ul de produse
            if (isset($detailData['data']) && is_array($detailData['data'])) {
                $foundProduct = null;
                foreach ($detailData['data'] as $product) {
                    if (isset($product['id']) && $product['id'] == $targetProductId) {
                        $foundProduct = $product;
                        break;
                    }
                }

                if ($foundProduct) {
                    error_log("=== FOUND TARGET PRODUCT IN DETAIL RESPONSE (ID: $targetProductId) ===");
                    error_log("Target Product Keys: " . json_encode(array_keys($foundProduct)));
                    error_log("Target Product Full: " . json_encode($foundProduct));

                    // Caută codul de produs în toate câmpurile posibile
                    $allFields = array_keys($foundProduct);
                    foreach ($allFields as $field) {
                        $value = $foundProduct[$field];
                        if (!empty($value) && is_string($value) && strlen($value) >= 8) {
                            error_log("Field '$field' has value: " . $value);
                        }
                    }

                    // Verifică câmpurile specifice
                    if (isset($foundProduct['productCode'])) {
                        error_log("Found productCode in detail: " . $foundProduct['productCode']);
                    }
                    if (isset($foundProduct['code'])) {
                        error_log("Found code in detail: " . $foundProduct['code']);
                    }
                    if (isset($foundProduct['ean'])) {
                        error_log("Found ean in detail: " . $foundProduct['ean']);
                    }
                    if (isset($foundProduct['barcode'])) {
                        error_log("Found barcode in detail: " . $foundProduct['barcode']);
                    }
                    if (isset($foundProduct['catalogNumber'])) {
                        error_log("Found catalogNumber in detail: " . $foundProduct['catalogNumber']);
                    }
                } else {
                    error_log("Target product ID $targetProductId NOT FOUND in detail response");
                    error_log("Available product IDs in response: " . json_encode(array_column($detailData['data'], 'id')));
                }
            } else {
                error_log("Detail response does not contain 'data' array");
                error_log("Detail response structure: " . json_encode($detailData));
            }
        } else {
            error_log("Failed to fetch product details. HTTP Code: " . $detailHttpCode);
        }
    }

    // Mapează produsele la formatul așteptat
    $products = [];
    foreach ($data['data'] as $p) {
        // Extrage informații din stock array
        $stockData = null;
        $totalStock = 0;
        $price = 0;
        $vatPercentage = 19;
        $currency = 'RON';

        if (isset($p['stock']) && is_array($p['stock']) && !empty($p['stock'])) {
            // Folosește primul element din stock array pentru preț și TVA
            $stockData = $p['stock'][0];
            $price = floatval($stockData['price'] ?? 0);
            $vatPercentage = floatval($stockData['vatPercentage'] ?? 19);
            $currency = $stockData['currency'] ?? 'RON';

            // Sumă stocul din toate locațiile
            foreach ($p['stock'] as $stockItem) {
                $totalStock += floatval($stockItem['quantity'] ?? 0);
            }
        } elseif (isset($p['quantity'])) {
            // Fallback: dacă nu există array stock, folosește câmpul quantity direct
            $totalStock = floatval($p['quantity'] ?? 0);
            $price = floatval($p['price'] ?? 0);
            $vatPercentage = floatval($p['vatPercentage'] ?? 19);
            $currency = $p['currency'] ?? 'RON';
        } elseif (isset($p['stock']) && is_numeric($p['stock'])) {
            // Fallback: dacă stock este un număr direct, nu un array
            $totalStock = floatval($p['stock']);
            $price = floatval($p['price'] ?? 0);
            $vatPercentage = floatval($p['vatPercentage'] ?? 19);
            $currency = $p['currency'] ?? 'RON';
        }

        // Conform documentației API Oblio, câmpul 'code' este codul produsului (EAN)
        // CPV-ul ar putea fi în alt câmp sau nu există pentru toate produsele
        $productCode = ''; // Cod produs (EAN) - din câmpul 'code'
        $code = ''; // Cod CPV - dacă există

        // Câmpul 'code' din API Oblio conține codul produsului (EAN)
        if (isset($p['code']) && !empty($p['code']) && trim($p['code']) !== '') {
            $productCode = trim($p['code']);
        }

        // Verifică câmpurile pentru codul CPV (dacă există)
        $possibleCpvFields = ['cpv', 'cpvCode', 'cpvCode'];
        foreach ($possibleCpvFields as $field) {
            if (isset($p[$field]) && !empty($p[$field]) && trim($p[$field]) !== '') {
                $code = trim($p[$field]);
                break;
            }
        }

        // Dacă nu am găsit CPV, dar avem productCode, folosește productCode pentru code (compatibilitate)
        if (empty($code) && !empty($productCode)) {
            $code = $productCode;
        }

        $products[] = [
            'name' => $p['name'] ?? 'Produs fără nume',
            'code' => $code, // Cod CPV (dacă există) sau cod produs pentru compatibilitate
            'productCode' => $productCode, // Cod produs (EAN) - din câmpul 'code' al API-ului
            'price' => $price,
            'measuringUnit' => $p['measuringUnit'] ?? 'buc',
            'vatPercentage' => $vatPercentage,
            'currency' => $currency,
            'stock' => $totalStock,
            'raw_stock' => $p['stock'] ?? [] // Adăugăm datele brute de stoc pentru debugging
        ];
    }

    return $products;
}

/**
 * Obține nomenclatoare din Oblio (generic)
 */
function getNomenclature($email, $apiSecret, $cif, $type)
{
    $token = getAccessToken($email, $apiSecret);

    // Type poate fi: management, work_stations, etc.
    $url = OBLIO_BASE_URL . '/nomenclature/' . urlencode($type) . '?cif=' . urlencode($cif);

    $ch = curl_init($url);
    curl_setopt_array($ch, [
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_HTTPHEADER => [
            'Authorization: Bearer ' . $token,
            'X-Oblio-Email: ' . $email,
            'Content-Type: application/json'
        ]
    ]);

    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    $error = curl_error($ch);
    curl_close($ch);

    if ($error) {
        throw new Exception("Eroare conexiune: " . $error);
    }

    if ($httpCode !== 200) {
        throw new Exception("Eroare API Oblio ($type): HTTP $httpCode");
    }

    $data = json_decode($response, true);

    return $data['data'] ?? [];
}

/**
 * Creează factură în Oblio
 */
function createInvoice($email, $apiSecret, $cif, $invoiceData)
{
    $token = getAccessToken($email, $apiSecret);

    $url = OBLIO_BASE_URL . '/docs/invoice';

    // Build payload with all provided data
    $payload = [
        'cif' => $cif,
        'client' => $invoiceData['client'] ?? [
            'cif' => '',
            'name' => 'Client Scan2Oblio',
            'email' => ''
        ],
        'issueDate' => $invoiceData['issueDate'] ?? date('Y-m-d'),
        'seriesName' => $invoiceData['seriesName'] ?? '',
        'workStation' => $invoiceData['workStation'] ?? 'Sediu',
        'products' => array_map(function ($p) {
            return [
                'name' => $p['name'],
                'code' => $p['barcode'],
                'measuringUnit' => $p['unit'],
                'currency' => 'RON',
                'quantity' => $p['quantity'],
                'price' => $p['price'],
                'vatPercentage' => $p['vatPercentage'],
                'management' => 'DEPOZIT',
                'saveProduct' => false
            ];
        }, $invoiceData['products'] ?? [])
    ];

    // Add optional dates (only if not empty after trim)
    if (!empty($invoiceData['dueDate']) && trim($invoiceData['dueDate']) !== '') {
        $payload['dueDate'] = trim($invoiceData['dueDate']);
    }
    if (!empty($invoiceData['deliveryDate']) && trim($invoiceData['deliveryDate']) !== '') {
        $payload['deliveryDate'] = trim($invoiceData['deliveryDate']);
    }
    if (!empty($invoiceData['collectDate']) && trim($invoiceData['collectDate']) !== '') {
        $payload['collectDate'] = trim($invoiceData['collectDate']);
    }

    // Add language and currency
    if (!empty($invoiceData['language'])) {
        $payload['language'] = $invoiceData['language'];
    }
    if (!empty($invoiceData['currency'])) {
        $payload['currency'] = $invoiceData['currency'];
    }

    // Add mentions and notes
    if (!empty($invoiceData['mentions'])) {
        $payload['mentions'] = $invoiceData['mentions'];
    }
    if (!empty($invoiceData['internalNote'])) {
        $payload['internalNote'] = $invoiceData['internalNote'];
    }

    // Add issuer data
    if (!empty($invoiceData['issuerName'])) {
        $payload['issuerName'] = $invoiceData['issuerName'];
    }
    if (!empty($invoiceData['issuerId'])) {
        $payload['issuerId'] = $invoiceData['issuerId'];
    }

    // Add deputy data
    if (!empty($invoiceData['deputyName'])) {
        $payload['deputyName'] = $invoiceData['deputyName'];
    }
    if (!empty($invoiceData['deputyIdentityCard'])) {
        $payload['deputyIdentityCard'] = $invoiceData['deputyIdentityCard'];
    }
    if (!empty($invoiceData['deputyAuto'])) {
        $payload['deputyAuto'] = $invoiceData['deputyAuto'];
    }

    // Add sales agent
    if (!empty($invoiceData['salesAgent'])) {
        $payload['salesAgent'] = $invoiceData['salesAgent'];
    }

    // Add notice number
    if (!empty($invoiceData['noticeNumber'])) {
        $payload['noticeNumber'] = $invoiceData['noticeNumber'];
    }

    // Log payload pentru debugging
    error_log("=== OBLIO INVOICE CREATE REQUEST ===");
    error_log("URL: " . $url);
    error_log("Payload: " . json_encode($payload, JSON_PRETTY_PRINT));

    $ch = curl_init($url);
    curl_setopt_array($ch, [
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_POST => true,
        CURLOPT_POSTFIELDS => json_encode($payload),
        CURLOPT_HTTPHEADER => [
            'Authorization: Bearer ' . $token,
            'X-Oblio-Email: ' . $email,
            'Content-Type: application/json'
        ]
    ]);

    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    $error = curl_error($ch);
    curl_close($ch);

    // Log response pentru debugging
    error_log("=== OBLIO INVOICE CREATE RESPONSE ===");
    error_log("HTTP Code: " . $httpCode);
    error_log("Response: " . $response);
    if ($error) {
        error_log("CURL Error: " . $error);
    }

    if ($error) {
        throw new Exception("Eroare conexiune: " . $error);
    }

    $data = json_decode($response, true);

    if ($httpCode !== 200) {
        // Include mai multe detalii din răspunsul Oblio pentru debugging
        $message = $data['message'] ?? "Eroare $httpCode la generarea facturii.";
        
        // Dacă există statusMessage sau alte detalii, include-le
        if (isset($data['statusMessage'])) {
            $message .= " - " . $data['statusMessage'];
        }
        
        // Log full error response
        error_log("Invoice creation failed: " . json_encode($data));
        
        throw new Exception($message);
    }

    return [
        'status' => 200,
        'message' => 'Factura a fost emisă cu succes!',
        'link' => $data['link'] ?? null
    ];
}

/**
 * Creează client în Oblio
 */
function createClient($email, $apiSecret, $cif, $clientData)
{
    $token = getAccessToken($email, $apiSecret);

    // Pass Issuer CIF in URL
    $url = OBLIO_BASE_URL . '/nomenclature/clients?cif=' . urlencode($cif);

    // Build payload
    $payload = [
        'name' => $clientData['name'],
        'vatPayer' => $clientData['vatPayer'] ?? false,
        'homeCurrency' => 'RON',
    ];

    // Only add CIF and Code if present
    if (!empty($clientData['cif'])) {
        $payload['cif'] = $clientData['cif'];
        $payload['code'] = $clientData['cif'];
    }

    // Optional fields
    $optionalFields = [
        'rc', 'address', 'city', 'state', 'country', 
        'email', 'phone', 'iban', 'bank', 'contact'
    ];

    foreach ($optionalFields as $field) {
        if (!empty($clientData[$field])) {
            $payload[$field] = $clientData[$field];
        }
    }

    // Log payload
    error_log("=== OBLIO CLIENT CREATE REQUEST ===");
    error_log("URL: " . $url);
    error_log("Payload: " . json_encode($payload, JSON_PRETTY_PRINT));

    $ch = curl_init($url);
    curl_setopt_array($ch, [
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_POST => true,
        CURLOPT_POSTFIELDS => json_encode($payload),
        CURLOPT_HTTPHEADER => [
            'Authorization: Bearer ' . $token,
            'X-Oblio-Email: ' . $email,
            'Content-Type: application/json'
        ]
    ]);

    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    $error = curl_error($ch);
    curl_close($ch);

    // Log response
    error_log("=== OBLIO CLIENT CREATE RESPONSE ===");
    error_log("HTTP Code: " . $httpCode);
    error_log("Response: " . $response);

    if ($error) {
        throw new Exception("Eroare conexiune: " . $error);
    }

    $data = json_decode($response, true);

    if ($httpCode !== 200 && $httpCode !== 201) {
        $message = $data['message'] ?? "Eroare $httpCode la crearea clientului.";
        if (isset($data['statusMessage'])) {
            $message .= " - " . $data['statusMessage'];
        }
        throw new Exception($message);
    }

    return [
        'status' => 200,
        'message' => 'Clientul a fost adăugat cu succes!',
        'data' => $data['data'] ?? null
    ];
}

// Procesează cererea
try {
    // Pentru cererile POST cu JSON body, citește action din JSON
    $action = $_GET['action'] ?? $_POST['action'] ?? '';
    
    // Dacă nu găsim action în GET/POST, verifică în JSON body
    if (empty($action) && $_SERVER['REQUEST_METHOD'] === 'POST') {
        $rawInput = file_get_contents('php://input');
        if (!empty($rawInput)) {
            $jsonData = json_decode($rawInput, true);
            if (json_last_error() === JSON_ERROR_NONE && isset($jsonData['action'])) {
                $action = $jsonData['action'];
            }
        }
    }

    if (empty($action)) {
        throw new Exception("Parametrul 'action' este obligatoriu");
    }

    switch ($action) {
        case 'auth':
            // Obține token (folosit intern, nu expus direct)
            $email = $_POST['email'] ?? '';
            $apiSecret = $_POST['apiSecret'] ?? '';

            if (empty($email) || empty($apiSecret)) {
                throw new Exception("Email și API Secret sunt obligatorii");
            }

            $token = getAccessToken($email, $apiSecret);
            echo json_encode(['success' => true, 'token' => $token]);
            break;

        case 'products':
            $email = $_GET['email'] ?? $_POST['email'] ?? '';
            $apiSecret = $_GET['apiSecret'] ?? $_POST['apiSecret'] ?? '';
            $cif = $_GET['cif'] ?? $_POST['cif'] ?? '';
            $management = $_GET['management'] ?? $_POST['management'] ?? '';

            if (empty($email) || empty($apiSecret) || empty($cif)) {
                throw new Exception("Email, API Secret și CIF sunt obligatorii");
            }

            $products = getProducts($email, $apiSecret, $cif, $management);
            echo json_encode(['success' => true, 'data' => $products]);
            break;

        case 'clients':
            $email = $_GET['email'] ?? $_POST['email'] ?? '';
            $apiSecret = $_GET['apiSecret'] ?? $_POST['apiSecret'] ?? '';
            $cif = $_GET['cif'] ?? $_POST['cif'] ?? '';

            if (empty($email) || empty($apiSecret) || empty($cif)) {
                throw new Exception("Email, API Secret și CIF sunt obligatorii");
            }

            $clients = getClients($email, $apiSecret, $cif);
            echo json_encode(['success' => true, 'data' => $clients]);
            break;

        case 'get_stocks_file':
            $file = 'stocuri.json';
            if (file_exists($file)) {
                $content = file_get_contents($file);
                // Verificăm dacă fișierul este gol
                if (empty(trim($content))) {
                    echo json_encode(['success' => true, 'data' => []]);
                } else {
                    $json = json_decode($content, true);
                    if (json_last_error() !== JSON_ERROR_NONE) {
                         // Dacă JSON-ul e corupt, returnăm array gol
                        echo json_encode(['success' => true, 'data' => []]);
                    } else {
                        echo json_encode(['success' => true, 'data' => $json]);
                    }
                }
            } else {
                echo json_encode(['success' => true, 'data' => []]);
            }
            break;

        case 'save_stocks_file':
            $rawInput = file_get_contents('php://input');
            $input = json_decode($rawInput, true);
            
            if (!isset($input['data'])) {
                throw new Exception("Date lipsă");
            }
            
            $file = 'stocuri.json';
            if (file_put_contents($file, json_encode($input['data'], JSON_PRETTY_PRINT)) === false) {
                 throw new Exception("Eroare la scrierea fișierului pe server");
            }
            
            echo json_encode(['success' => true]);
            break;

        case 'invoice':
            $rawInput = file_get_contents('php://input');
            $input = json_decode($rawInput, true);

            if (json_last_error() !== JSON_ERROR_NONE) {
                throw new Exception("Date JSON invalide: " . json_last_error_msg());
            }

            if (!$input || !is_array($input)) {
                throw new Exception("Date invalide sau format incorect");
            }

            $email = $input['email'] ?? '';
            $apiSecret = $input['apiSecret'] ?? '';
            $cif = $input['cif'] ?? '';
            $products = $input['products'] ?? [];

            if (empty($email) || empty($apiSecret) || empty($cif)) {
                throw new Exception("Email, API Secret și CIF sunt obligatorii");
            }

            if (empty($products)) {
                throw new Exception("Lista de produse este goală");
            }

            // Pass all invoice data to createInvoice
            $result = createInvoice($email, $apiSecret, $cif, $input);
            echo json_encode(array_merge(['success' => true], $result));
            break;

        case 'nomenclature':
            $email = $_GET['email'] ?? $_POST['email'] ?? '';
            $apiSecret = $_GET['apiSecret'] ?? $_POST['apiSecret'] ?? '';
            $cif = $_GET['cif'] ?? $_POST['cif'] ?? '';
            $type = $_GET['type'] ?? $_POST['type'] ?? '';

            if (empty($email) || empty($apiSecret) || empty($cif) || empty($type)) {
                throw new Exception("Email, API Secret, CIF și Type sunt obligatorii");
            }

            $data = getNomenclature($email, $apiSecret, $cif, $type);
            echo json_encode(['success' => true, 'data' => $data]);
            break;

        case 'createClient':
            $rawInput = file_get_contents('php://input');
            $input = json_decode($rawInput, true);

            if (json_last_error() !== JSON_ERROR_NONE) {
                throw new Exception("Date JSON invalide");
            }

            $email = $input['email'] ?? '';
            $apiSecret = $input['apiSecret'] ?? '';
            $cif = $input['cif'] ?? '';
            $clientData = $input['client'] ?? [];

            if (empty($email) || empty($apiSecret) || empty($cif)) {
                throw new Exception("Email, API Secret și CIF sunt obligatorii");
            }

            if (empty($clientData) || empty($clientData['name'])) {
                throw new Exception("Datele clientului (nume) sunt obligatorii");
            }

            $result = createClient($email, $apiSecret, $cif, $clientData);
            echo json_encode(array_merge(['success' => true], $result));
            break;

        default:
            throw new Exception("Acțiune necunoscută: $action");
    }

} catch (Exception $e) {
    http_response_code(400);
    echo json_encode([
        'success' => false,
        'error' => $e->getMessage()
    ]);
}

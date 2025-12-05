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
function getAccessToken($email, $apiSecret) {
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
 * Obține produsele din Oblio
 */
function getProducts($email, $apiSecret, $cif) {
    $token = getAccessToken($email, $apiSecret);
    
    $url = OBLIO_BASE_URL . '/nomenclature/products?cif=' . urlencode($cif);
    
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
        return [];
    }
    
    // Mapează produsele la formatul așteptat
    $products = [];
    foreach ($data['data'] as $p) {
        $products[] = [
            'name' => $p['name'] ?? 'Produs fără nume',
            'code' => $p['code'] ?? '', // Cod CPV
            'productCode' => $p['productCode'] ?? $p['ean'] ?? $p['barcode'] ?? '', // Cod produs (EAN)
            'price' => floatval($p['price'] ?? 0),
            'measuringUnit' => $p['measuringUnit'] ?? 'buc',
            'vatPercentage' => floatval($p['vatPercentage'] ?? 19),
            'currency' => $p['currency'] ?? 'RON',
            'stock' => floatval($p['stock'] ?? $p['quantity'] ?? 0)
        ];
    }
    
    return $products;
}

/**
 * Creează factură în Oblio
 */
function createInvoice($email, $apiSecret, $cif, $seriesName, $products) {
    $token = getAccessToken($email, $apiSecret);
    
    $url = OBLIO_BASE_URL . '/docs/invoice';
    
    $payload = [
        'cif' => $cif,
        'client' => [
            'cif' => '',
            'name' => 'Client Scan2Oblio',
            'email' => ''
        ],
        'issueDate' => date('Y-m-d'),
        'seriesName' => $seriesName ?: '',
        'products' => array_map(function($p) {
            return [
                'name' => $p['name'],
                'code' => $p['barcode'],
                'measuringUnit' => $p['unit'],
                'currency' => 'RON',
                'quantity' => $p['quantity'],
                'price' => $p['price'],
                'vatPercentage' => $p['vatPercentage'],
                'saveProduct' => false
            ];
        }, $products)
    ];
    
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
    
    if ($error) {
        throw new Exception("Eroare conexiune: " . $error);
    }
    
    $data = json_decode($response, true);
    
    if ($httpCode !== 200) {
        $message = $data['message'] ?? "Eroare $httpCode la generarea facturii.";
        throw new Exception($message);
    }
    
    return [
        'status' => 200,
        'message' => 'Factura a fost emisă cu succes!',
        'link' => $data['link'] ?? null
    ];
}

// Procesează cererea
try {
    $action = $_GET['action'] ?? $_POST['action'] ?? '';
    
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
            
            if (empty($email) || empty($apiSecret) || empty($cif)) {
                throw new Exception("Email, API Secret și CIF sunt obligatorii");
            }
            
            $products = getProducts($email, $apiSecret, $cif);
            echo json_encode(['success' => true, 'data' => $products]);
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
            $seriesName = $input['seriesName'] ?? '';
            $products = $input['products'] ?? [];
            
            if (empty($email) || empty($apiSecret) || empty($cif)) {
                throw new Exception("Email, API Secret și CIF sunt obligatorii");
            }
            
            if (empty($products)) {
                throw new Exception("Lista de produse este goală");
            }
            
            $result = createInvoice($email, $apiSecret, $cif, $seriesName, $products);
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


import React, { useState, useEffect, useCallback } from 'react';
import {
  ScanLine,
  Settings as SettingsIcon,
  Plus,
  Trash2,
  Send,
  ShoppingBag,
  CheckCircle2,
  Database,
  AlertTriangle,
  Keyboard,
  AlertCircle,
  Beaker,
  X,
  Copy,
  FileText
} from 'lucide-react';
import { ProductItem, OblioConfig, AppStatus, OblioProduct } from './types';
import Scanner from './components/Scanner';
import Settings from './components/Settings';
import InventoryModal from './components/InventoryModal';
import InvoiceEditor from './components/InvoiceEditor';
import ProductListModal from './components/ProductListModal';
import WorkStationSelector from './components/WorkStationSelector';
import { createInvoiceInOblio, getProductsFromOblio } from './services/oblioService';
import { STORAGE_KEYS } from './constants';

// Initial Mock Config
const DEFAULT_CONFIG: OblioConfig = {
  email: '',
  apiSecret: '',
  cif: '',
  seriesName: '',
  workStation: 'Sediu'
};

const App: React.FC = () => {
  // State
  // Robustly load config from localStorage to ensure settings persist across refreshes
  const [config, setConfig] = useState<OblioConfig>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.CONFIG);
      // Merge with DEFAULT_CONFIG to ensure all fields exist even if saved data is partial
      return saved ? { ...DEFAULT_CONFIG, ...JSON.parse(saved) } : DEFAULT_CONFIG;
    } catch (error) {
      console.error("Eroare la încărcarea configurării din localStorage:", error);
      return DEFAULT_CONFIG;
    }
  });

  const [items, setItems] = useState<ProductItem[]>([]);
  const [inventory, setInventory] = useState<OblioProduct[]>([]);
  const [isInventoryLoading, setIsInventoryLoading] = useState(false);
  const [showInventoryList, setShowInventoryList] = useState(false);
  const [showInvoiceEditor, setShowInvoiceEditor] = useState(false);

  const [isScanning, setIsScanning] = useState(false);
  // TEST MODE STATE
  const [isTestScanning, setIsTestScanning] = useState(false);
  const [testResult, setTestResult] = useState<string | null>(null);

  const [showSettings, setShowSettings] = useState(false);
  const [status, setStatus] = useState<AppStatus>(AppStatus.IDLE);
  const [statusMessage, setStatusMessage] = useState<string>('');

  const [manualCode, setManualCode] = useState('');
  const [connectionError, setConnectionError] = useState<string | null>(null);

  // Persist config to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.CONFIG, JSON.stringify(config));
  }, [config]);

  // Load Inventory from Oblio (Real)
  useEffect(() => {
    const validateAndLoadInventory = async () => {
      // 1. Validate Config
      const missingFields = [];
      if (!config.email) missingFields.push("Email");
      if (!config.apiSecret) missingFields.push("API Secret");
      if (!config.cif) missingFields.push("CIF");

      if (missingFields.length > 0) {
        setConnectionError(`Configurare incompletă. Lipsesc: ${missingFields.join(', ')}.`);
        setInventory([]);
        return;
      }

      // 2. Load Inventory if config looks okay
      setConnectionError(null);
      setIsInventoryLoading(true);
      try {
        const products = await getProductsFromOblio(config);
        setInventory(products);
        console.log("Inventory loaded:", products.length, "items");
      } catch (error: any) {
        console.error("Failed to load inventory", error);
        setStatus(AppStatus.ERROR);
        // Show the real error message from the service
        setConnectionError(error.message || "Eroare necunoscută la conectarea cu Oblio.");
        setInventory([]);
      } finally {
        setIsInventoryLoading(false);
      }
    };

    validateAndLoadInventory();
  }, [config]);

  // Show temporary status message
  const showStatus = (type: AppStatus, msg: string, duration = 3000) => {
    setStatus(type);
    setStatusMessage(msg);
    if (duration > 0) {
      setTimeout(() => {
        setStatus(AppStatus.IDLE);
        setStatusMessage("");
      }, duration);
    }
  };

  // Handlers
  const handleScan = useCallback((code: string) => {
    const trimmedCode = code.trim();
    console.log("handleScan called with code:", code, "trimmed:", trimmedCode);
    console.log("Inventory length:", inventory.length);

    // Debug: log primul produs pentru a vedea structura
    if (inventory.length > 0) {
      const firstProduct = inventory[0];
      console.log("First product sample:", {
        name: firstProduct.name,
        code: firstProduct.code,
        productCode: firstProduct.productCode,
        codeType: typeof firstProduct.code,
        productCodeType: typeof firstProduct.productCode
      });

      // Caută specific codul 10000000000001
      if (trimmedCode === '10000000000001') {
        console.log("Searching for code 10000000000001 in inventory...");
        inventory.forEach((p, idx) => {
          console.log(`Product ${idx}:`, {
            name: p.name,
            code: p.code,
            productCode: p.productCode,
            codeMatch: p.code === trimmedCode,
            productCodeMatch: p.productCode === trimmedCode,
            codeTrimMatch: p.code?.trim() === trimmedCode,
            productCodeTrimMatch: p.productCode?.trim() === trimmedCode
          });
        });
      }
    }

    // 1. STRICT LOOKUP: Check if item exists in Inventory FIRST
    // Caută după codul de produs (EAN) sau codul CPV
    // productCode = EAN (din câmpul 'code' al API-ului)
    // code = CPV (dacă există)
    const productInStock = inventory.find(p => {
      // Caută după EAN (productCode) sau CPV (code)
      const matchesEAN = p.productCode && p.productCode.trim() === trimmedCode;
      const matchesCPV = p.code && p.code.trim() === trimmedCode && p.code !== p.productCode;
      return matchesEAN || matchesCPV;
    });

    console.log("Product found:", productInStock ? productInStock.name : "NOT FOUND");

    if (!productInStock) {
      if (navigator.vibrate) navigator.vibrate([200, 100, 200]);
      showStatus(AppStatus.ERROR, `Codul ${code} nu a fost găsit în inventarul Oblio.`);
      return;
    }

    // 2. Check stock status
    const isStockZero = productInStock.stock <= 0;

    // 3. Check if already in cart
    // Caută în coș după codul scanat (poate fi EAN sau CPV)
    const existingIndex = items.findIndex(i => {
      return i.barcode === code ||
        (productInStock.productCode && i.barcode === productInStock.productCode) ||
        (productInStock.code && i.barcode === productInStock.code);
    });

    if (existingIndex >= 0) {
      setItems(prev => {
        const newItems = [...prev];
        newItems[existingIndex].quantity += 1;
        return newItems;
      });

      // Feedback based on stock
      if (isStockZero) {
        if (navigator.vibrate) navigator.vibrate([100, 50, 100]);
        showStatus(AppStatus.WARNING, "Cantitate actualizată (Atenție: Stoc 0 în Oblio)", 4000);
      } else {
        if (navigator.vibrate) navigator.vibrate(50);
        showStatus(AppStatus.SUCCESS, "Cantitate actualizată (+1)");
      }

    } else {
      // 4. Add new item
      const newItem: ProductItem = {
        id: Date.now().toString(),
        name: productInStock.name,
        barcode: productInStock.productCode || productInStock.code, // Preferă codul de produs (EAN)
        quantity: 1,
        price: productInStock.price,
        vatPercentage: productInStock.vatPercentage,
        unit: productInStock.measuringUnit
      };
      setItems(prev => [...prev, newItem]);

      // Close scanner after successful add
      setIsScanning(false);

      // Feedback based on stock
      if (isStockZero) {
        if (navigator.vibrate) navigator.vibrate([100, 50, 100]);
        showStatus(AppStatus.WARNING, "Produs adăugat (Atenție: Stoc 0 în Oblio)", 4000);
      } else {
        if (navigator.vibrate) navigator.vibrate([50, 50, 50]);
        showStatus(AppStatus.SUCCESS, "Produs adăugat din stoc");
      }
    }
  }, [items, inventory, showStatus]);

  const handleTestScan = (code: string) => {
    console.log("handleTestScan called with code:", code);
    if (navigator.vibrate) navigator.vibrate([50, 50, 50]);
    setIsTestScanning(false);
    setTestResult(code);
  };

  const handleManualCodeSubmit = () => {
    if (!manualCode.trim()) return;
    // Call scan logic with manually entered code
    handleScan(manualCode.trim());
    setManualCode('');
  };

  const handleManualAdd = () => {
    // Strictly pick from inventory
    if (inventory.length === 0) {
      showStatus(AppStatus.ERROR, "Inventarul nu este încărcat.");
      return;
    }

    const query = prompt("Caută produs în stoc (Nume sau Cod):");
    if (!query) return;

    // Check if query matches inventory (Code, ProductCode or Name)
    const lowerQuery = query.toLowerCase();
    const match = inventory.find(p => {
      const matchesEAN = p.productCode && p.productCode.trim() === query.trim();
      const matchesCPV = p.code && p.code.trim() === query.trim() && p.code !== p.productCode;
      const matchesName = p.name.toLowerCase().includes(lowerQuery);
      return matchesEAN || matchesCPV || matchesName;
    });

    if (match) {
      const isStockZero = match.stock <= 0;

      // Check if already in cart to update qty or add new
      // Folosește productCode (EAN) sau code pentru căutare în coș
      const matchBarcode = match.productCode || match.code;
      const existingIndex = items.findIndex(i => i.barcode === matchBarcode || i.barcode === match.code || i.barcode === match.productCode);
      if (existingIndex >= 0) {
        setItems(prev => {
          const newItems = [...prev];
          newItems[existingIndex].quantity += 1;
          return newItems;
        });
        if (isStockZero) {
          showStatus(AppStatus.WARNING, "Cantitate actualizată (Atenție: Stoc 0)", 4000);
        } else {
          showStatus(AppStatus.SUCCESS, "Cantitate actualizată (+1)");
        }
      } else {
        const newItem: ProductItem = {
          id: Date.now().toString(),
          name: match.name,
          barcode: match.productCode || match.code, // Preferă codul de produs (EAN)
          quantity: 1,
          price: match.price,
          vatPercentage: match.vatPercentage,
          unit: match.measuringUnit
        };
        setItems(prev => [...prev, newItem]);

        if (isStockZero) {
          showStatus(AppStatus.WARNING, "Produs adăugat (Atenție: Stoc 0)", 4000);
        } else {
          showStatus(AppStatus.SUCCESS, "Produs adăugat din stoc");
        }
      }
    } else {
      alert(`Produsul "${query}" nu a fost găsit în stocul Oblio. Vă rugăm să verificați inventarul.`);
    }
  };

  const updateQuantity = (id: string, delta: number) => {
    setItems(prev => prev.map(item => {
      if (item.id === id) {
        return { ...item, quantity: Math.max(1, item.quantity + delta) };
      }
      return item;
    }));
  };

  const removeItem = (id: string) => {
    setItems(prev => prev.filter(i => i.id !== id));
  };

  const handleCreateInvoice = () => {
    if (items.length === 0) return;
    if (!config.email || !config.apiSecret) {
      setShowSettings(true);
      return;
    }
    setShowInvoiceEditor(true);
  };

  const handleInvoiceSuccess = () => {
    setShowInvoiceEditor(false);
    showStatus(AppStatus.SUCCESS, "Factura a fost emisă cu succes!", 5000);
    // Clear cart
    setTimeout(() => {
      setItems([]);
    }, 2000);
  };

  const calculateTotal = () => {
    return items.reduce((sum, item) => sum + (item.price * item.quantity), 0).toFixed(2);
  };

  const handleAddToCartFromInventory = (product: OblioProduct, quantity: number) => {
    const isStockZero = product.stock <= 0;

    // Check if already in cart
    const matchBarcode = product.productCode || product.code;
    const existingIndex = items.findIndex(i => i.barcode === matchBarcode || i.barcode === product.code || i.barcode === product.productCode);

    if (existingIndex >= 0) {
      setItems(prev => {
        const newItems = [...prev];
        newItems[existingIndex].quantity += quantity;
        return newItems;
      });
      showStatus(AppStatus.SUCCESS, `Cantitate actualizată (+${quantity})`);
    } else {
      const newItem: ProductItem = {
        id: Date.now().toString(),
        name: product.name,
        barcode: product.productCode || product.code,
        quantity: quantity,
        price: product.price,
        vatPercentage: product.vatPercentage,
        unit: product.measuringUnit
      };
      setItems(prev => [...prev, newItem]);
      showStatus(AppStatus.SUCCESS, `Produs adăugat în coș (+${quantity})`);
    }

    if (isStockZero) {
      setTimeout(() => {
        showStatus(AppStatus.WARNING, "Atenție: Stoc 0 în Oblio", 3000);
      }, 1500);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 pb-24 relative overflow-hidden font-sans">

      {/* Top Bar */}
      <header className="sticky top-0 z-40 bg-slate-900/90 backdrop-blur-md border-b border-slate-800 px-4 py-3 flex justify-between items-center shadow-md">
        <div className="flex items-center gap-3">
          <div className="bg-emerald-500 p-2 rounded-lg shadow-emerald-500/20 shadow-lg">
            <ScanLine className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-white leading-tight">Scan2Oblio</h1>
            <div
              onClick={() => inventory.length > 0 && setShowInventoryList(true)}
              className={`flex items-center gap-1.5 transition-all active:scale-95 ${inventory.length > 0 ? 'cursor-pointer hover:opacity-80' : 'opacity-70'}`}
            >
              <div className={`w-2 h-2 rounded-full ${isInventoryLoading ? 'bg-yellow-400 animate-pulse' : inventory.length > 0 ? 'bg-emerald-400' : 'bg-red-400'}`} />
              <span className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">
                {isInventoryLoading ? 'Se încarcă...' : inventory.length > 0 ? `${inventory.length} Produse Stoc` : 'Deconectat'}
              </span>
              {inventory.length > 0 && <span className="text-[9px] text-slate-600 ml-1">(Vezi)</span>}
            </div>
          </div>
        </div>
        <button
          onClick={() => setShowSettings(!showSettings)}
          className="p-2 text-slate-400 hover:text-white transition-colors bg-slate-800 rounded-full hover:bg-slate-700"
        >
          <SettingsIcon className="w-5 h-5" />
        </button>
      </header>

      {/* Main Content */}
      <main className="p-4 max-w-2xl mx-auto space-y-4">

        {/* Settings Modal */}
        {showSettings && (
          <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
            <Settings
              config={config}
              onSave={(newConfig) => {
                setConfig(newConfig);
                setShowSettings(false);
              }}
              onClose={() => setShowSettings(false)}
            />
          </div>
        )}

        {/* Inventory Modal */}
        {showInventoryList && (
          <InventoryModal
            inventory={inventory}
            onClose={() => setShowInventoryList(false)}
            onAddToCart={handleAddToCartFromInventory}
          />
        )}

        {/* Test Result Modal */}
        {testResult && (
          <div className="fixed inset-0 z-[60] bg-black/80 backdrop-blur-sm flex items-center justify-center p-6 animate-in fade-in zoom-in duration-200">
            <div className="bg-slate-900 border border-slate-700 rounded-xl p-6 w-full max-w-sm shadow-2xl relative">
              <button
                onClick={() => setTestResult(null)}
                className="absolute top-4 right-4 p-1 hover:bg-slate-800 rounded-full transition-colors text-slate-400"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="flex flex-col items-center text-center gap-4">
                <div className="w-16 h-16 bg-blue-500/10 rounded-full flex items-center justify-center">
                  <Beaker className="w-8 h-8 text-blue-400" />
                </div>
                <div>
                  <h3 className="text-white text-lg font-bold mb-1">Rezultat Scanare Test</h3>
                  <p className="text-slate-400 text-sm">Acesta este numărul decodat din imagine:</p>
                </div>

                <div className="bg-black/50 border border-slate-700 rounded-lg p-4 w-full flex items-center justify-between gap-3">
                  <code className="text-emerald-400 font-mono text-xl font-bold tracking-wider truncate">
                    {testResult}
                  </code>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(testResult);
                      showStatus(AppStatus.SUCCESS, "Copiat!", 1500);
                    }}
                    className="p-2 hover:bg-slate-800 rounded text-slate-500 hover:text-white transition-colors"
                  >
                    <Copy className="w-4 h-4" />
                  </button>
                </div>

                <button
                  onClick={() => setTestResult(null)}
                  className="w-full py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-semibold transition-colors mt-2"
                >
                  Închide
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Connection Error Banner */}
        {connectionError && (
          <div className="bg-red-500/10 border border-red-500/50 rounded-xl p-4 flex items-start gap-3 shadow-lg">
            <div className="bg-red-500/20 p-2 rounded-full shrink-0">
              <AlertTriangle className="w-5 h-5 text-red-400" />
            </div>
            <div className="flex-1">
              <h3 className="text-red-200 font-bold text-sm">Eroare Conexiune Oblio</h3>
              <p className="text-red-300/80 text-xs mt-1 leading-relaxed">{connectionError}</p>
              <button
                onClick={() => setShowSettings(true)}
                className="mt-3 text-xs font-semibold bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-400 transition-colors shadow-lg shadow-red-900/20"
              >
                Verifică Setările
              </button>
            </div>
          </div>
        )}

        {/* Product List */}
        {items.length === 0 ? (
          <div className="flex flex-col items-center justify-center mt-8 text-slate-500 gap-6 px-8 text-center">
            <div className="w-24 h-24 bg-slate-800 rounded-full flex items-center justify-center mb-2 relative">
              <ShoppingBag className="w-10 h-10 text-slate-600" />
              <div className={`absolute bottom-0 right-0 p-2 rounded-full border-4 border-slate-900 ${connectionError ? 'bg-red-500' : 'bg-emerald-500'}`}>
                {connectionError ? <AlertTriangle className="w-4 h-4 text-white" /> : <Database className="w-4 h-4 text-white" />}
              </div>
            </div>
            <div>
              <h3 className="text-white text-lg font-medium mb-2">Coșul este gol</h3>
              <p className="text-sm">
                {connectionError
                  ? "Rezolvați eroarea de conexiune pentru a continua."
                  : "Scanați produse pentru a le căuta în inventarul Oblio."}
              </p>
            </div>

            <button
              onClick={() => setIsScanning(true)}
              disabled={inventory.length === 0}
              className={`mt-2 px-8 py-3.5 rounded-xl font-bold shadow-lg transition-all flex items-center gap-2 transform active:scale-95 w-full max-w-xs justify-center
                 ${inventory.length > 0 ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-500/20' : 'bg-slate-700 text-slate-400 cursor-not-allowed'}
              `}
            >
              <ScanLine className="w-5 h-5" />
              {inventory.length > 0 ? 'Începe Scanarea' : 'Conectare necesară'}
            </button>

            {/* Test Button - Available even without connection */}
            <button
              onClick={() => setIsTestScanning(true)}
              className="w-full max-w-xs py-2 px-4 rounded-lg border border-blue-500/30 bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 transition-colors text-sm font-medium flex items-center justify-center gap-2"
            >
              <Beaker className="w-4 h-4" />
              Test Scanner (Fără Oblio)
            </button>

            {/* Quick Add By Code Input - Empty State */}
            {inventory.length > 0 && (
              <div className="flex items-center gap-2 w-full max-w-xs">
                <div className="relative flex-1">
                  <input
                    type="text"
                    value={manualCode}
                    onChange={(e) => setManualCode(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleManualCodeSubmit()}
                    placeholder="Sau introdu cod manual..."
                    className="w-full bg-slate-800 border border-slate-700 text-white rounded-lg py-3 pl-10 pr-4 focus:ring-2 focus:ring-emerald-500 outline-none placeholder:text-slate-500 text-sm"
                  />
                  <Keyboard className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                </div>
                <button
                  onClick={handleManualCodeSubmit}
                  disabled={!manualCode}
                  className="bg-slate-700 hover:bg-slate-600 text-white p-3 rounded-lg border border-slate-600 transition-colors disabled:opacity-50"
                >
                  <Plus className="w-5 h-5" />
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-3 pb-8">

            {/* Quick Add By Code Input - List State */}
            <div className="flex items-center gap-2 mb-4 bg-slate-800/80 backdrop-blur p-2 rounded-xl border border-slate-700 shadow-sm sticky top-0 z-10">
              <Keyboard className="w-5 h-5 text-emerald-500 ml-2" />
              <input
                value={manualCode}
                onChange={e => setManualCode(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleManualCodeSubmit()}
                placeholder="Adaugă rapid un produs după cod..."
                className="flex-1 bg-transparent text-white border-none focus:outline-none placeholder:text-slate-500 text-sm h-8"
              />
              <button
                onClick={handleManualCodeSubmit}
                disabled={!manualCode}
                className="bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-700 text-white p-1.5 rounded-lg transition-colors"
              >
                <Plus className="w-5 h-5" />
              </button>
            </div>

            {items.map((item) => (
              <div key={item.id} className="group bg-slate-800 hover:bg-slate-750 transition-colors rounded-xl p-4 flex items-center justify-between shadow-lg border border-slate-700/50">
                <div className="flex-1 min-w-0 pr-4">
                  <div className="flex items-start justify-between mb-1">
                    <h3 className="font-semibold text-white truncate text-base leading-tight">{item.name}</h3>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-slate-400">
                    {item.barcode ? (
                      <span className="bg-slate-900 px-1.5 py-0.5 rounded text-slate-300 font-mono tracking-wide">{item.barcode}</span>
                    ) : (
                      <span className="bg-emerald-500/10 text-emerald-300 px-1.5 py-0.5 rounded flex items-center gap-1">Manual</span>
                    )}
                    <span>|</span>
                    <span>{item.price} RON</span>
                    <span>|</span>
                    <span>TVA {item.vatPercentage}%</span>
                  </div>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  <div className="flex items-center bg-slate-900 rounded-lg border border-slate-700 h-9">
                    <button
                      onClick={() => updateQuantity(item.id, -1)}
                      className="w-8 h-full flex items-center justify-center text-slate-400 hover:text-white hover:bg-slate-700 rounded-l-lg transition-colors"
                    >
                      -
                    </button>
                    <span className="w-8 text-center text-sm font-bold text-white tabular-nums">{item.quantity}</span>
                    <button
                      onClick={() => updateQuantity(item.id, 1)}
                      className="w-8 h-full flex items-center justify-center text-slate-400 hover:text-white hover:bg-slate-700 rounded-r-lg transition-colors"
                    >
                      +
                    </button>
                  </div>
                  <button
                    onClick={() => removeItem(item.id)}
                    className="w-9 h-9 flex items-center justify-center text-red-400 hover:text-red-300 bg-red-500/10 hover:bg-red-500/20 rounded-lg transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}

            {/* Total Card */}
            <div className="mt-6 bg-gradient-to-r from-slate-800 to-slate-800/80 rounded-xl p-5 border border-slate-700 shadow-xl">
              <div className="flex justify-between items-center">
                <span className="text-slate-400 font-medium">Total Estimativ</span>
                <span className="text-2xl font-bold text-white tracking-tight">{calculateTotal()} <span className="text-sm font-normal text-emerald-400">RON</span></span>
              </div>
            </div>
          </div>
        )}

      </main>

      {/* Floating Action Bar */}
      <div className="fixed bottom-0 left-0 right-0 bg-slate-900/95 backdrop-blur-md border-t border-slate-800 p-4 safe-area-pb z-30">
        <div className="max-w-2xl mx-auto flex gap-3">
          <button
            onClick={() => setIsScanning(true)}
            disabled={inventory.length === 0}
            className={`flex-1 py-3.5 rounded-xl font-bold flex items-center justify-center gap-2 transition-all active:scale-[0.98] border border-slate-700
                    ${inventory.length > 0 ? 'bg-slate-800 text-white hover:bg-slate-700' : 'bg-slate-800/50 text-slate-600 cursor-not-allowed'}
                `}
          >
            <ScanLine className={`w-5 h-5 ${inventory.length > 0 ? 'text-emerald-400' : 'text-slate-600'}`} />
            Scan
          </button>
          <button
            onClick={handleManualAdd}
            className="px-4 bg-slate-800 text-white rounded-xl font-medium border border-slate-700 hover:bg-slate-700 flex items-center justify-center transition-all active:scale-[0.98]"
            aria-label="Adaugă Manual"
          >
            <Plus className="w-6 h-6 text-slate-300" />
          </button>
          <button
            onClick={handleCreateInvoice}
            disabled={items.length === 0}
            className={`flex-[2] py-3.5 rounded-xl font-bold flex items-center justify-center gap-2 transition-all active:scale-[0.98]
                    ${items.length === 0 ? 'bg-slate-800 text-slate-600 cursor-not-allowed border border-slate-700' : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-500/25 border border-emerald-500'}
                `}
          >
            <FileText className="w-5 h-5" />
            Creează Factură
          </button>
        </div>
      </div>

      {/* Full Screen Scanner Overlay - Shared for both Business Scan and Test Scan */}
      {(isScanning || isTestScanning) && (
        <Scanner
          onScan={isTestScanning ? handleTestScan : handleScan}
          onClose={() => {
            setIsScanning(false);
            setIsTestScanning(false);
          }}
        />
      )}


      {/* Invoice Editor Modal */}
      {showInvoiceEditor && (
        <InvoiceEditor
          config={config}
          initialProducts={items}
          onClose={() => setShowInvoiceEditor(false)}
          onSuccess={handleInvoiceSuccess}
        />
      )}

      {/* Status Toasts */}
      {(status !== AppStatus.IDLE && status !== AppStatus.SENDING_OBLIO) && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-[60] flex justify-center w-full px-4 pointer-events-none">
          <div className={`
                pointer-events-auto max-w-sm w-full p-4 rounded-xl shadow-2xl flex items-center gap-3 backdrop-blur-md border animate-in slide-in-from-top-5 fade-in duration-300
                ${status === AppStatus.SUCCESS ? 'bg-emerald-900/90 border-emerald-500/50 text-emerald-50' : ''}
                ${status === AppStatus.WARNING ? 'bg-amber-900/90 border-amber-500/50 text-amber-50' : ''}
                ${status === AppStatus.ERROR ? 'bg-red-900/90 border-red-500/50 text-red-50' : ''}
            `}>
            {status === AppStatus.SUCCESS && <CheckCircle2 className="w-6 h-6 text-emerald-400 shrink-0" />}
            {status === AppStatus.WARNING && <AlertCircle className="w-6 h-6 text-amber-400 shrink-0" />}
            {status === AppStatus.ERROR && <AlertTriangle className="w-6 h-6 text-red-400 shrink-0" />}

            <div className="flex-1">
              <p className="text-sm font-medium leading-snug">{statusMessage}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
import React, { useState, useEffect, useMemo } from 'react';
import { OblioConfig, OblioProduct, StockItem } from '../types';
import { getProductsFromOblio } from '../services/oblioService';
import { fetchStocksFromFile, saveStocksToFile, getExportStocksXlsUrl } from '../services/stockFileService';
import Scanner from './Scanner';
import StockEditModal from './StockEditModal';
import { Search, Download, Upload, Plus, Edit2, Loader2, Save, Trash2, ScanLine } from 'lucide-react';

interface StocksViewProps {
    config: OblioConfig;
}

const StocksView: React.FC<StocksViewProps> = ({ config }) => {
    const [stocks, setStocks] = useState<StockItem[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [editingProduct, setEditingProduct] = useState<StockItem | null>(null);
    const [isNewProduct, setIsNewProduct] = useState(false);
    const [isImporting, setIsImporting] = useState(false);
    const [isScanning, setIsScanning] = useState(false);

    const formatDate = () => {
        const now = new Date();
        const dd = String(now.getDate()).padStart(2, '0');
        const mm = String(now.getMonth() + 1).padStart(2, '0');
        const yy = String(now.getFullYear()).slice(-2);
        const HH = String(now.getHours()).padStart(2, '0');
        const min = String(now.getMinutes()).padStart(2, '0');
        return `${dd}:${mm}:${yy} ${HH}:${min}`;
    };

    // Initial load
    useEffect(() => {
        loadStocks();
    }, []);

    const loadStocks = async () => {
        setLoading(true);
        setError(null);
        try {
            const data = await fetchStocksFromFile();
            setStocks(data);
        } catch (err: any) {
            setError(err.message || 'Eroare la încărcarea stocurilor.');
        } finally {
            setLoading(false);
        }
    };

    const handleImportFromOblio = async () => {
        if (!config.email || !config.apiSecret || !config.cif) {
            setError("Configurare Oblio incompletă (Email, Secret, CIF).");
            return;
        }

        if (!confirm("Atenție! Această acțiune va prelua produsele din Oblio și va înițializa/suprascrie baza de date locală de pe server. Doriți să continuați?")) {
            return;
        }

        setIsImporting(true);
        setError(null);
        try {
            // Fetch from Oblio
            const obProducts: OblioProduct[] = await getProductsFromOblio(config);

            // Map to StockItem format
            const mappedStocks: StockItem[] = obProducts.map(p => ({
                "Denumire produs": p.name,
                "Tip": "Marfa", // Default assumption
                "Cod produs": p.productCode || p.code || "",
                "Stoc": p.stock,
                "U.M.": p.measuringUnit,
                "Cost achizitie fara TVA": 0, // Not available in basic API response usually
                "Moneda achizitie": "RON",
                "Pret vanzare": p.price,
                "Cota TVA": p.vatPercentage,
                "TVA inclus": "DA",
                "Moneda vanzare": p.currency || "RON",
                "Furnizor": "",
                "sidesType": "6 LATURI",
                "woodColor": "RESPETĂ",
                "material": "BRAD"
            }));

            // Save to file
            await saveStocksToFile(mappedStocks);
            setStocks(mappedStocks);
            alert(`Import efectuat cu succes! ${mappedStocks.length} produse importate.`);
        } catch (err: any) {
            console.error("Import error:", err);
            setError(`Eroare la import: ${err.message}`);
        } finally {
            setIsImporting(false);
        }
    };

    const handleExport = () => {
        const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify({ data: stocks }, null, 2));
        const downloadAnchorNode = document.createElement('a');
        downloadAnchorNode.setAttribute("href", dataStr);
        downloadAnchorNode.setAttribute("download", "stocuri.json");
        document.body.appendChild(downloadAnchorNode); // required for firefox
        downloadAnchorNode.click();
        downloadAnchorNode.remove();
    };

    const handleSaveProduct = async (product: StockItem) => {
        try {
            const productWithDate = { ...product, lastEdit: formatDate() };
            let newStocks = [...stocks];

            if (isNewProduct) {
                // Check for duplicates
                if (stocks.some(s => s["Cod produs"] === product["Cod produs"])) {
                    alert("Există deja un produs cu acest cod!");
                    return;
                }
                newStocks.push(productWithDate);
            } else {
                // Update existing
                const index = newStocks.findIndex(s => s["Cod produs"] === product["Cod produs"]);
                if (index !== -1) {
                    newStocks[index] = productWithDate;
                }
            }

            // Optimistic update
            setStocks(newStocks);
            setEditingProduct(null);

            // Save to server
            await saveStocksToFile(newStocks);
        } catch (err: any) {
            setError(`Eroare la salvare: ${err.message}`);
            // Revert logic could be added here
            loadStocks();
        }
    };

    const handleDeleteProduct = async (productCode: string) => {
        try {
            const newStocks = stocks.filter(s => s["Cod produs"] !== productCode);
            setStocks(newStocks);
            setEditingProduct(null);
            await saveStocksToFile(newStocks);
        } catch (err: any) {
            setError(`Eroare la ștergere: ${err.message}`);
            loadStocks();
        }
    };

    const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = async (e) => {
            try {
                const text = e.target?.result as string;
                const json = JSON.parse(text);

                // Basic validation - check if it looks like our structure or just an array
                let dataToSave: StockItem[] = [];

                if (Array.isArray(json)) {
                    dataToSave = json;
                } else if (json.data && Array.isArray(json.data)) {
                    dataToSave = json.data;
                } else {
                    throw new Error("Format JSON invalid. Se așteaptă un array de produse.");
                }

                if (!confirm(`Sunteți sigur că doriți să importați ${dataToSave.length} produse? Aceasta va suprascrie stocul existent.`)) {
                    // Reset input matches
                    event.target.value = '';
                    return;
                }

                setLoading(true);
                await saveStocksToFile(dataToSave);
                setStocks(dataToSave);
                alert("Stocuri importate cu succes!");
            } catch (err: any) {
                console.error("Upload error:", err);
                alert(`Eroare la import: ${err.message}`);
            } finally {
                setLoading(false);
                // Reset input
                event.target.value = '';
            }
        };
        reader.readAsText(file);
    };

    const handleScan = (code: string) => {
        setSearchQuery(code);
        setIsScanning(false);
        if (navigator.vibrate) navigator.vibrate(50);
    };

    const filteredStocks = useMemo(() => {
        if (!searchQuery) return stocks;
        const lowerQ = searchQuery.toLowerCase();
        return stocks.filter(s =>
            s["Denumire produs"].toLowerCase().includes(lowerQ) ||
            s["Cod produs"].toLowerCase().includes(lowerQ)
        );
    }, [stocks, searchQuery]);

    return (
        <div className="flex flex-col h-full space-y-4">
            {/* Toolbar */}
            <div className="bg-slate-800 p-4 rounded-xl border border-slate-700 flex flex-col gap-4 shadow-lg">
                {/* Row 1: Search & Scan */}
                <div className="flex gap-2 w-full">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 w-4 h-4" />
                        <input
                            type="text"
                            placeholder="Caută produse (Nume sau Cod)..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full bg-slate-900 border border-slate-700 rounded-lg pl-10 pr-4 py-2 text-white focus:ring-2 focus:ring-emerald-500 outline-none placeholder:text-slate-600"
                        />
                    </div>
                    <button
                        onClick={() => setIsScanning(true)}
                        className="bg-slate-700 hover:bg-slate-600 text-white p-2 rounded-lg border border-slate-600 transition-colors"
                        title="Scanează pentru căutare"
                    >
                        <ScanLine className="w-5 h-5" />
                    </button>
                </div>

                {/* Row 2: Import/Export Actions */}
                <div className="flex gap-2 w-full overflow-x-auto pb-1 md:pb-0">
                    <button
                        onClick={handleImportFromOblio}
                        disabled={isImporting}
                        className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-blue-600/20 text-blue-400 border border-blue-500/30 rounded-lg hover:bg-blue-600/30 transition-colors whitespace-nowrap"
                    >
                        {isImporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                        Import Sincronizare
                    </button>

                    {/* Hidden File Input for JSON Upload */}
                    <input
                        type="file"
                        accept=".json"
                        id="json-upload"
                        className="hidden"
                        onChange={handleFileUpload}
                    />
                    <label
                        htmlFor="json-upload"
                        className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-slate-700 text-slate-300 border border-slate-600 rounded-lg hover:bg-slate-600 transition-colors whitespace-nowrap cursor-pointer"
                    >
                        <Upload className="w-4 h-4" />
                        Upload JSON
                    </label>

                    <button
                        onClick={() => {
                            window.location.href = getExportStocksXlsUrl();
                        }}
                        className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-emerald-700/50 text-emerald-100 border border-emerald-600/50 rounded-lg hover:bg-emerald-600/50 transition-colors whitespace-nowrap"
                        title="Descarcă format Excel"
                    >
                        <Download className="w-4 h-4" />
                        Export XLS
                    </button>

                    <button
                        onClick={handleExport}
                        className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-slate-700 text-slate-300 border border-slate-600 rounded-lg hover:bg-slate-600 transition-colors whitespace-nowrap"
                        title="Descarcă format JSON"
                    >
                        <Download className="w-4 h-4" />
                        Export JSON
                    </button>
                </div>

                {/* Row 3: Add Product (Full Width) */}
                <button
                    onClick={() => {
                        setEditingProduct(null);
                        setIsNewProduct(true);
                        setEditingProduct({} as StockItem);
                    }}
                    className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-emerald-600 text-white rounded-lg hover:bg-emerald-500 transition-colors font-bold shadow-lg shadow-emerald-500/20"
                >
                    <Plus className="w-5 h-5" />
                    Produs Nou
                </button>
            </div>

            {/* Error Message */}
            {error && (
                <div className="bg-red-500/10 border border-red-500/50 p-4 rounded-xl text-red-200 text-sm">
                    {error}
                </div>
            )}

            {/* Product List */}
            <div className="flex-1 overflow-y-auto bg-slate-800/50 backdrop-blur rounded-xl border border-slate-700/50">
                {loading ? (
                    <div className="flex items-center justify-center h-64">
                        <Loader2 className="w-8 h-8 text-emerald-500 animate-spin" />
                    </div>
                ) : filteredStocks.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-64 text-slate-500">
                        <p>Nu există produse.</p>
                        <p className="text-sm mt-1">Importați din Oblio sau adăugați manual.</p>
                    </div>
                ) : (
                    <div className="divide-y divide-slate-700/50">
                        {filteredStocks.map((item, idx) => (
                            <div
                                key={idx}
                                className="p-2 hover:bg-slate-700/50 transition-colors flex items-center justify-between group"
                            >
                                <div
                                    className="flex-1 min-w-0 cursor-pointer"
                                    onClick={() => {
                                        setEditingProduct(item);
                                        setIsNewProduct(false);
                                    }}
                                >
                                    <div className="flex items-center gap-3 mb-1">
                                        <span className="font-semibold text-white text-lg truncate">{item["Denumire produs"]}</span>
                                        <span className={`px-2 py-0.5 rounded textxs font-bold ${item["Stoc"] > 0 ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'}`}>
                                            {item["Stoc"]} {item["U.M."]}
                                        </span>
                                    </div>
                                    <div className="flex gap-4 text-xs text-slate-400">
                                        <span className="font-mono bg-slate-900 px-1.5 rounded">{item["Cod produs"]}</span>
                                        <span>Preț de vânzare: <span className="text-emerald-300 font-bold">{item["Pret vanzare"]} {item["Moneda vanzare"]}</span></span>
                                        <span>Preț achiziție: <span className="text-blue-300 font-bold">{item["Cost achizitie fara TVA"]} {item["Moneda achizitie"]}</span></span>
                                        {item.lastEdit && <span className="text-slate-500 italic">Editat: {item.lastEdit}</span>}
                                    </div>
                                </div>

                                <div className="flex flex-col md:flex-row items-center gap-2 px-2">
                                    <button
                                        onClick={() => {
                                            setEditingProduct(item);
                                            setIsNewProduct(false);
                                        }}
                                        className="p-2 hover:bg-slate-600 rounded-lg text-slate-400 hover:text-white transition-colors"
                                        title="Editează"
                                    >
                                        <Edit2 className="w-4 h-4" />
                                    </button>
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            if (confirm('Sigur doriți să ștergeți acest produs?')) {
                                                handleDeleteProduct(item["Cod produs"]);
                                            }
                                        }}
                                        className="p-2 hover:bg-red-500/20 rounded-lg text-slate-400 hover:text-red-400 transition-colors"
                                        title="Șterge"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Edit Modal */}
            {editingProduct && (
                <StockEditModal
                    product={isNewProduct ? null : editingProduct}
                    isNew={isNewProduct}
                    onClose={() => setEditingProduct(null)}
                    onSave={handleSaveProduct}
                    onDelete={handleDeleteProduct}
                />
            )}

            {/* Scanner Overlay */}
            {isScanning && (
                <Scanner
                    onScan={handleScan}
                    onClose={() => setIsScanning(false)}
                />
            )}
        </div>
    );
};

export default StocksView;

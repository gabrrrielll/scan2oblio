import React, { useState, useEffect, useMemo } from 'react';
import { OblioConfig, OblioProduct, StockItem } from '../types';
import { getProductsFromOblio } from '../services/oblioService';
import { fetchStocksFromFile, saveStocksToFile, getExportStocksXlsUrl } from '../services/stockFileService';
import { generateEAN13 } from '../services/productUtils';
import Scanner from './Scanner';
import StockEditModal from './StockEditModal';
import { Search, Download, Upload, Plus, Edit2, Loader2, Save, Trash2, ScanLine, CheckCircle2, CheckSquare, Square, Filter, Circle } from 'lucide-react';

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
    const [filterStatus, setFilterStatus] = useState<'all' | 'in_stock' | 'out_of_stock'>('all');
    const [selectedProducts, setSelectedProducts] = useState<Set<string>>(new Set());

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

    const handleSaveProduct = async (product: StockItem, originalCode?: string) => {
        try {
            const productWithDate = { ...product, lastEdit: formatDate() };
            let newStocks = [...stocks];

            const searchCode = originalCode || product["Cod produs"];
            let index = -1;

            if (isNewProduct) {
                // Determine if there's a strict existing product to prevent overwrite
                // Actually, for new products, we just append, BUT we check collisions
                if (stocks.some(s => s["Cod produs"] === product["Cod produs"])) {
                    // This is where we might auto-correct OR alert.
                    // User asked to auto-correct "rest of products with same code".
                    // But if I am adding a NEW product that collides, maybe I should auto-correct the NEW one?
                    // User specific request: "when I save a product... modification rest of products with same code"
                    // This implies I want THIS product to have THIS code, and OTHERS should move away.
                    // So we proceed, and subsequent logic will fix the others.
                }
                newStocks.push(productWithDate);
                index = newStocks.length - 1; // It's the last one
            } else {
                // Update existing
                index = newStocks.findIndex(s => s["Cod produs"] === searchCode);

                if (index !== -1) {
                    newStocks[index] = productWithDate;
                } else {
                    // Fallback: Code might have been changed in UI but original not passed or bad state
                    // Try to find by ID if we had one, but we don't.
                    // Try to find strict match on new code? No, that would overwrite another.
                    console.error("Could not find original product to update:", searchCode);
                    setError("Eroare internă: Produsul original nu a fost găsit pentru actualizare.");
                    return;
                }
            }

            // AUTO-RESOLVE DUPLICATES
            // We want to ensure 'productWithDate' keeps its code 'productWithDate["Cod produs"]'.
            // Any OTHER product in newStocks that has the same code must be changed.
            const targetCode = productWithDate["Cod produs"];
            let conflictsFixed = 0;

            // We iterate all stocks. If we find a stock that is NOT our current index (or same object ref)
            // but HAS the same code, we regenerate its code.
            // Note: 'index' points to our just-updated product in 'newStocks'.
            newStocks = newStocks.map((s, idx) => {
                if (idx !== index && s["Cod produs"] === targetCode) {
                    conflictsFixed++;
                    return { ...s, "Cod produs": generateEAN13(), lastEdit: formatDate() };
                }
                return s;
            });

            if (conflictsFixed > 0) {
                alert(`Atenție: Au fost găsite ${conflictsFixed} alte produse cu același cod (${targetCode}). Acestea au fost actualizate automat cu coduri EAN13 noi pentru a elimina duplicatele.`);
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
            // Also remove from selection if present
            if (selectedProducts.has(productCode)) {
                const newSelection = new Set(selectedProducts);
                newSelection.delete(productCode);
                setSelectedProducts(newSelection);
            }
            await saveStocksToFile(newStocks);
        } catch (err: any) {
            setError(`Eroare la ștergere: ${err.message}`);
            loadStocks();
        }
    };

    const toggleVerified = async (productCode: string, e: React.MouseEvent) => {
        e.stopPropagation();
        const newStocks = stocks.map(s =>
            s["Cod produs"] === productCode
                ? { ...s, verified: !s.verified }
                : s
        );
        // Optimistic update
        setStocks(newStocks);
        try {
            await saveStocksToFile(newStocks);
        } catch (err: any) {
            setError(`Eroare la salvare status: ${err.message}`);
            // Revert on error? For now just reload
            loadStocks();
        }
    };

    const toggleSelect = (productCode: string, e: React.MouseEvent) => {
        e.stopPropagation();
        const newSelection = new Set(selectedProducts);
        if (newSelection.has(productCode)) {
            newSelection.delete(productCode);
        } else {
            newSelection.add(productCode);
        }
        setSelectedProducts(newSelection);
    };

    const toggleSelectAll = () => {
        if (selectedProducts.size === filteredStocks.length) {
            setSelectedProducts(new Set());
        } else {
            const allCodes = new Set(filteredStocks.map(s => s["Cod produs"]));
            setSelectedProducts(allCodes);
        }
    };

    const handleDeleteSelected = async () => {
        if (selectedProducts.size === 0) return;
        if (!confirm(`Sigur doriți să ștergeți ${selectedProducts.size} produse selectate?`)) return;

        try {
            const newStocks = stocks.filter(s => !selectedProducts.has(s["Cod produs"]));
            setStocks(newStocks);
            setSelectedProducts(new Set());
            await saveStocksToFile(newStocks);
        } catch (err: any) {
            setError(`Eroare la ștergere multiplă: ${err.message}`);
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
        let result = stocks;

        // Apply Search
        if (searchQuery) {
            const lowerQ = searchQuery.toLowerCase();
            result = result.filter(s =>
                s["Denumire produs"].toLowerCase().includes(lowerQ) ||
                s["Cod produs"].toLowerCase().includes(lowerQ)
            );
        }

        // Apply Filter
        if (filterStatus === 'in_stock') {
            result = result.filter(s => s["Stoc"] > 0);
        } else if (filterStatus === 'out_of_stock') {
            result = result.filter(s => s["Stoc"] <= 0);
        }

        return result;
    }, [stocks, searchQuery, filterStatus]);

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

                {/* Row 2.5: Filters & Bulk Actions */}
                <div className="flex flex-col md:flex-row gap-2 justify-between items-center bg-slate-700/30 p-2 rounded-lg">
                    {/* Filters */}
                    <div className="flex gap-1 w-full md:w-auto overflow-x-auto">
                        <button
                            onClick={() => setFilterStatus('all')}
                            className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors whitespace-nowrap ${filterStatus === 'all' ? 'bg-slate-600 text-white shadow' : 'text-slate-400 hover:bg-slate-700/50'}`}
                        >
                            Toate ({stocks.length})
                        </button>
                        <button
                            onClick={() => setFilterStatus('in_stock')}
                            className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors whitespace-nowrap ${filterStatus === 'in_stock' ? 'bg-emerald-600/50 text-emerald-100 shadow' : 'text-slate-400 hover:bg-slate-700/50'}`}
                        >
                            În Stoc
                        </button>
                        <button
                            onClick={() => setFilterStatus('out_of_stock')}
                            className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors whitespace-nowrap ${filterStatus === 'out_of_stock' ? 'bg-red-600/50 text-red-100 shadow' : 'text-slate-400 hover:bg-slate-700/50'}`}
                        >
                            Fără Stoc
                        </button>
                    </div>

                    {/* Bulk Actions */}
                    {selectedProducts.size > 0 ? (
                        <div className="flex items-center gap-3 w-full md:w-auto justify-end animate-in fade-in bg-red-900/20 px-3 py-1 rounded-md border border-red-900/30">
                            <span className="text-xs text-red-200 font-semibold">{selectedProducts.size} selectate</span>
                            <button
                                onClick={handleDeleteSelected}
                                className="flex items-center gap-1.5 px-3 py-1.5 bg-red-600 text-white rounded hover:bg-red-500 text-sm transition-colors"
                            >
                                <Trash2 className="w-3.5 h-3.5" />
                                Șterge Selectate
                            </button>
                        </div>
                    ) : (
                        // Select All Toggle (Visible when no selection active for easier access)
                        filteredStocks.length > 0 && (
                            <button
                                onClick={toggleSelectAll}
                                className="hidden md:flex items-center gap-2 px-3 py-1.5 text-slate-400 hover:text-white transition-colors text-sm"
                            >
                                {selectedProducts.size === filteredStocks.length ? <CheckSquare className="w-4 h-4" /> : <Square className="w-4 h-4" />}
                                Selectează Tot
                            </button>
                        )
                    )}
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
                                        <div
                                            onClick={(e) => toggleSelect(item["Cod produs"], e)}
                                            className="text-slate-500 hover:text-slate-300 transition-colors cursor-pointer"
                                        >
                                            {selectedProducts.has(item["Cod produs"])
                                                ? <CheckSquare className="w-5 h-5 text-emerald-500" />
                                                : <Square className="w-5 h-5" />
                                            }
                                        </div>

                                        <div className="flex-1 min-w-0 flex items-center gap-2">
                                            <span className={`font-semibold text-lg truncate ${item.verified ? 'text-emerald-400' : 'text-white'}`}>
                                                {item["Denumire produs"]}
                                            </span>
                                            {item.verified && <CheckCircle2 className="w-4 h-4 text-emerald-500" />}
                                        </div>

                                        <span className={`px-2 py-0.5 rounded text-xs font-bold ${item["Stoc"] > 0 ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'}`}>
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
                                        onClick={(e) => toggleVerified(item["Cod produs"], e)}
                                        className={`p-2 rounded-lg transition-colors ${item.verified ? 'text-emerald-500 hover:bg-emerald-500/10' : 'text-slate-600 hover:bg-slate-600 hover:text-slate-300'}`}
                                        title={item.verified ? "Debifează ca verificat" : "Bifează ca verificat"}
                                    >
                                        {item.verified ? <CheckCircle2 className="w-4 h-4 fill-emerald-500/20" /> : <Circle className="w-4 h-4" />}
                                    </button>
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

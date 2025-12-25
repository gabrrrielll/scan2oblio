import React, { useState, useEffect, useMemo } from 'react';
import { OblioConfig, OblioProduct, StockItem } from '../types';
import { getProductsFromOblio } from '../services/oblioService';
import { fetchStocksFromFile, saveStocksToFile } from '../services/stockFileService';
import StockEditModal from './StockEditModal';
import { Search, Download, Upload, Plus, Edit2, Loader2, Save } from 'lucide-react';

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
            let newStocks = [...stocks];

            if (isNewProduct) {
                // Check for duplicates
                if (stocks.some(s => s["Cod produs"] === product["Cod produs"])) {
                    alert("Există deja un produs cu acest cod!");
                    return;
                }
                newStocks.push(product);
            } else {
                // Update existing
                const index = newStocks.findIndex(s => s["Cod produs"] === product["Cod produs"]);
                if (index !== -1) {
                    newStocks[index] = product;
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
            <div className="bg-slate-800 p-4 rounded-xl border border-slate-700 flex flex-col md:flex-row gap-4 items-center justify-between shadow-lg">
                <div className="relative w-full md:w-96">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 w-4 h-4" />
                    <input
                        type="text"
                        placeholder="Caută produse (Nume sau Cod)..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg pl-10 pr-4 py-2 text-white focus:ring-2 focus:ring-emerald-500 outline-none placeholder:text-slate-600"
                    />
                </div>

                <div className="flex gap-2 w-full md:w-auto overflow-x-auto pb-1 md:pb-0">
                    <button
                        onClick={handleImportFromOblio}
                        disabled={isImporting}
                        className="flex items-center gap-2 px-4 py-2 bg-blue-600/20 text-blue-400 border border-blue-500/30 rounded-lg hover:bg-blue-600/30 transition-colors whitespace-nowrap"
                    >
                        {isImporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                        Import Sincronizare
                    </button>

                    <button
                        onClick={handleExport}
                        className="flex items-center gap-2 px-4 py-2 bg-slate-700 text-slate-300 border border-slate-600 rounded-lg hover:bg-slate-600 transition-colors whitespace-nowrap"
                    >
                        <Download className="w-4 h-4" />
                        Export
                    </button>

                    <button
                        onClick={() => {
                            setEditingProduct(null); // Clear previous selection to ensure clean state
                            setIsNewProduct(true);
                            // Need to handle state update delay, so we pass a dummy object slightly later or handle in Modal
                            // Actually StockEditModal handles null product as "new/empty" but we set isNew=true
                            setEditingProduct({} as StockItem); // Hack to trigger modal open
                        }}
                        className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-500 transition-colors font-medium whitespace-nowrap shadow-lg shadow-emerald-500/20"
                    >
                        <Plus className="w-4 h-4" />
                        Produs Nou
                    </button>
                </div>
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
                                onClick={() => {
                                    setEditingProduct(item);
                                    setIsNewProduct(false);
                                }}
                                className="p-4 hover:bg-slate-700/50 transition-colors cursor-pointer flex items-center justify-between group"
                            >
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-3 mb-1">
                                        <span className="font-semibold text-white text-lg truncate">{item["Denumire produs"]}</span>
                                        <span className={`px-2 py-0.5 rounded textxs font-bold ${item["Stoc"] > 0 ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'}`}>
                                            {item["Stoc"]} {item["U.M."]}
                                        </span>
                                    </div>
                                    <div className="flex gap-4 text-xs text-slate-400">
                                        <span className="font-mono bg-slate-900 px-1.5 rounded">{item["Cod produs"]}</span>
                                        <span>Preț: <span className="text-emerald-300 font-bold">{item["Pret vanzare"]} {item["Moneda vanzare"]}</span></span>
                                        <span>Tip: {item["Tip"]}</span>
                                    </div>
                                </div>

                                <div className="opacity-0 group-hover:opacity-100 transition-opacity px-2">
                                    <Edit2 className="w-4 h-4 text-slate-400" />
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
        </div>
    );
};

export default StocksView;

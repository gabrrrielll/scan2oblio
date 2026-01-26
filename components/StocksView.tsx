import React, { useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { OblioConfig, OblioProduct, StockItem } from '../types';
import { getProductsFromOblio } from '../services/oblioService';
import { fetchStocksFromFile, saveStocksToFile, getExportStocksXlsUrl } from '../services/stockFileService';
import { generateEAN13, mapOblioToStockItems } from '../services/productUtils';
import Scanner from './Scanner';
import StockEditModal from './StockEditModal';
import { Search, Download, Upload, Plus, Edit2, Loader2, Trash2, ScanLine, CheckCircle2, CheckSquare, Square, Circle, ClipboardList, StopCircle, X, Printer } from 'lucide-react';

interface StocksViewProps {
    config: OblioConfig;
}

type InventoryDiffStatus = 'new' | 'more' | 'less' | 'missing' | 'unknown';

interface InventoryDiffItem {
    key: string;
    name: string;
    code: string;
    expected: number;
    counted: number;
    delta: number;
    status: InventoryDiffStatus;
}

const StocksView: React.FC<StocksViewProps> = ({ config }) => {
    const [stocks, setStocks] = useState<StockItem[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [editingProduct, setEditingProduct] = useState<StockItem | null>(null);
    const [isNewProduct, setIsNewProduct] = useState(false);
    const [isScanning, setIsScanning] = useState(false);
    const [isInventoryActive, setIsInventoryActive] = useState(false);
    const [isInventoryScanning, setIsInventoryScanning] = useState(false);
    const [isInventoryLoading, setIsInventoryLoading] = useState(false);
    const [filterStatus, setFilterStatus] = useState<'all' | 'in_stock' | 'out_of_stock'>('all');
    const [selectedProducts, setSelectedProducts] = useState<Set<string>>(new Set());
    const [inventorySnapshot, setInventorySnapshot] = useState<OblioProduct[]>([]);
    const [inventoryCounts, setInventoryCounts] = useState<Record<string, number>>({});
    const [inventoryUnknownCounts, setInventoryUnknownCounts] = useState<Record<string, number>>({});
    const [inventoryDiffs, setInventoryDiffs] = useState<InventoryDiffItem[]>([]);
    const [inventoryMatches, setInventoryMatches] = useState<InventoryDiffItem[]>([]);
    const [showInventoryDiffs, setShowInventoryDiffs] = useState(false);
    const [lastInventoryScan, setLastInventoryScan] = useState<{ name: string; code: string } | null>(null);
    const [inventoryEditingProduct, setInventoryEditingProduct] = useState<OblioProduct | null>(null);
    const [inventorySearchQuery, setInventorySearchQuery] = useState('');
    const [inventoryTempCount, setInventoryTempCount] = useState<number>(0);
    const [inventoryFinishedAt, setInventoryFinishedAt] = useState<Date | null>(null);
    const [inventoryPrintMode, setInventoryPrintMode] = useState<'none' | 'diffs' | 'matches' | 'all'>('none');

    // Temporarily removed useEffect as initialization is handled in handleInventoryScan

    const formatDate = () => {
        const now = new Date();
        const dd = String(now.getDate()).padStart(2, '0');
        const mm = String(now.getMonth() + 1).padStart(2, '0');
        const yy = String(now.getFullYear()).slice(-2);
        const HH = String(now.getHours()).padStart(2, '0');
        const min = String(now.getMinutes()).padStart(2, '0');
        return `${dd}:${mm}:${yy} ${HH}:${min}`;
    };

    const managementLabel = config.workStation?.trim() || 'Sediu';


    const getProductKey = (product: OblioProduct): string => {
        const ean = product.productCode?.trim();
        if (ean) return ean;
        const cpv = product.code?.trim();
        if (cpv) return cpv;
        return product.name;
    };

    const findProductByCode = (code: string, products: OblioProduct[]) => {
        const trimmed = code.trim();
        return products.find(p =>
            (p.productCode && p.productCode.trim() === trimmed) ||
            (p.code && p.code.trim() === trimmed)
        );
    };

    const buildInventoryDiffs = (
        snapshot: OblioProduct[],
        counts: Record<string, number>,
        unknownCounts: Record<string, number>
    ): { diffs: InventoryDiffItem[], matches: InventoryDiffItem[] } => {
        const diffs: InventoryDiffItem[] = [];
        const matches: InventoryDiffItem[] = [];

        snapshot.forEach(product => {
            const key = getProductKey(product);
            const expected = Number(product.stock) || 0;
            const counted = counts[key] || 0;

            const item: InventoryDiffItem = {
                key,
                name: product.name,
                code: product.productCode?.trim() || product.code?.trim() || '',
                expected,
                counted,
                delta: counted - expected,
                status: 'unknown' // Placeholder
            };

            if (counted === expected) {
                matches.push(item);
            } else {
                let status: InventoryDiffStatus = 'less';
                if (expected === 0 && counted > 0) {
                    status = 'new';
                } else if (counted > expected) {
                    status = 'more';
                } else if (counted === 0) {
                    status = 'missing';
                }
                item.status = status;
                diffs.push(item);
            }
        });

        Object.entries(unknownCounts).forEach(([code, counted]) => {
            if (counted > 0) {
                diffs.push({
                    key: code,
                    name: 'Cod necunoscut',
                    code,
                    expected: 0,
                    counted,
                    delta: counted,
                    status: 'unknown'
                });
            }
        });

        return {
            diffs: diffs.sort((a, b) => Math.abs(b.delta) - Math.abs(a.delta)),
            matches: matches.sort((a, b) => a.name.localeCompare(b.name))
        };
    };

    const searchedInventory = useMemo(() => {
        if (!inventorySearchQuery.trim()) return [];
        const query = inventorySearchQuery.toLowerCase();
        return inventorySnapshot.filter(p =>
            p.name.toLowerCase().includes(query) ||
            p.code?.toLowerCase().includes(query) ||
            p.productCode?.toLowerCase().includes(query)
        ).slice(0, 5); // Limit results for UI clarity
    }, [inventorySnapshot, inventorySearchQuery]);

    const diffBadgeConfig: Record<InventoryDiffStatus, { label: string; className: string }> = {
        new: { label: 'Stoc 0 → apare', className: 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30' },
        more: { label: 'Mai multe', className: 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30' },
        less: { label: 'Mai puține', className: 'bg-amber-500/10 text-amber-300 border-amber-500/30' },
        missing: { label: 'Lipsă', className: 'bg-red-500/10 text-red-300 border-red-500/30' },
        unknown: { label: 'Cod necunoscut', className: 'bg-slate-500/10 text-slate-300 border-slate-500/30' }
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


    const handleStartInventory = async () => {
        if (!config.email || !config.apiSecret || !config.cif) {
            setError("Configurare Oblio incompletă (Email, Secret, CIF).");
            return;
        }

        if (!confirm(`Se va porni inventarul pentru gestiunea "${managementLabel}". Continuați?`)) {
            return;
        }

        setIsInventoryLoading(true);
        setError(null);
        setInventoryCounts({});
        setInventoryUnknownCounts({});
        setInventoryDiffs([]);
        setShowInventoryDiffs(false);
        setLastInventoryScan(null);

        try {
            const obProducts = await getProductsFromOblio(config);
            setInventorySnapshot(obProducts);
            setIsInventoryActive(true);
            setIsInventoryScanning(true);
        } catch (err: any) {
            console.error("Inventory start error:", err);
            setError(`Eroare la pornirea inventarului: ${err.message}`);
        } finally {
            setIsInventoryLoading(false);
        }
    };

    const handleStopInventory = () => {
        setIsInventoryActive(false);
        setIsInventoryScanning(false);

        const result = buildInventoryDiffs(inventorySnapshot, inventoryCounts, inventoryUnknownCounts);
        setInventoryDiffs(result.diffs);
        setInventoryMatches(result.matches);
        setShowInventoryDiffs(true);
        setInventoryFinishedAt(new Date());
    };

    const handlePrintInventory = (mode: 'diffs' | 'matches' | 'all') => {
        setInventoryPrintMode(mode);
        // Wait for portal to render
        setTimeout(() => {
            window.print();
            setInventoryPrintMode('none');
        }, 300);
    };

    const handleInventoryScan = (code: string) => {
        const trimmedCode = code.trim();
        if (!trimmedCode) return;

        if (inventorySnapshot.length === 0) {
            setError("Inventarul Oblio nu este încărcat.");
            return;
        }

        const product = findProductByCode(trimmedCode, inventorySnapshot);
        if (product) {
            const key = getProductKey(product);

            // Increment the count immediately using functional update for concurrency safety
            setInventoryCounts(prev => {
                const newCount = (prev[key] || 0) + 1;
                setInventoryTempCount(newCount); // Sync UI temp count
                return { ...prev, [key]: newCount };
            });

            setInventoryEditingProduct(product);
            setInventorySearchQuery(''); // Clear search if any
        } else {
            // Increment unknown counts as well
            setInventoryUnknownCounts(prev => {
                const currentCount = prev[trimmedCode] || 0;
                return { ...prev, [trimmedCode]: currentCount + 1 };
            });
            setLastInventoryScan({ name: 'Cod necunoscut', code: trimmedCode });
        }

        if (navigator.vibrate) navigator.vibrate(50);
    };

    const handleSaveInventoryCount = () => {
        if (!inventoryEditingProduct) return;
        const key = getProductKey(inventoryEditingProduct);
        setInventoryCounts(prev => ({ ...prev, [key]: inventoryTempCount }));
        setLastInventoryScan({
            name: inventoryEditingProduct.name,
            code: inventoryEditingProduct.productCode?.trim() || inventoryEditingProduct.code?.trim() || ''
        });
        setInventoryEditingProduct(null);
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

    const { furnizorOptions, materialOptions, woodColorOptions, sidesTypeOptions, umOptions, vatRateOptions } = useMemo(() => {
        const f = new Set<string>();
        const m = new Set<string>();
        const wc = new Set<string>();
        const st = new Set<string>();
        const u = new Set<string>();
        const v = new Set<string>();

        stocks.forEach(s => {
            if (s["Furnizor"]) f.add(String(s["Furnizor"]));
            if (s["material"]) m.add(String(s["material"]));
            if (s["woodColor"]) wc.add(String(s["woodColor"]));
            if (s["sidesType"]) st.add(String(s["sidesType"]));
            if (s["U.M."]) u.add(String(s["U.M."]));
            if (s["Cota TVA"] !== undefined) v.add(String(s["Cota TVA"]));
        });

        return {
            furnizorOptions: Array.from(f).sort(),
            materialOptions: Array.from(m).sort(),
            woodColorOptions: Array.from(wc).sort(),
            sidesTypeOptions: Array.from(st).sort(),
            umOptions: Array.from(u).sort(),
            vatRateOptions: Array.from(v).sort((a, b) => parseFloat(a) - parseFloat(b))
        };
    }, [stocks]);

    const inventoryTotals = useMemo(() => {
        const totalKnown = (Object.values(inventoryCounts) as number[]).reduce((sum, count) => sum + count, 0);
        const totalUnknown = (Object.values(inventoryUnknownCounts) as number[]).reduce((sum, count) => sum + count, 0);
        const uniqueKnown = Object.keys(inventoryCounts).length;
        const uniqueUnknown = Object.keys(inventoryUnknownCounts).length;

        return {
            totalScanned: totalKnown + totalUnknown,
            uniqueScanned: uniqueKnown + uniqueUnknown,
            totalKnown,
            totalUnknown
        };
    }, [inventoryCounts, inventoryUnknownCounts]);

    const inventoryDiffSummary = useMemo(() => {
        return inventoryDiffs.reduce((acc, item) => {
            acc[item.status] = (acc[item.status] || 0) + 1;
            acc.total += 1;
            return acc;
        }, { total: 0, new: 0, more: 0, less: 0, missing: 0, unknown: 0 } as Record<string, number>);
    }, [inventoryDiffs]);

    const filteredStocks = useMemo(() => {
        let result = stocks;

        // Apply Search
        if (searchQuery) {
            const lowerQ = searchQuery.toLowerCase();
            result = result.filter(s =>
                s["Denumire produs"].toLowerCase().includes(lowerQ) ||
                s["Cod produs"].toLowerCase().includes(lowerQ) ||
                (s["Furnizor"] && s["Furnizor"].toLowerCase().includes(lowerQ))
            );
        }

        // Apply Filter
        if (filterStatus === 'in_stock') {
            result = result.filter(s => s["Stoc"] > 0);
        } else if (filterStatus === 'out_of_stock') {
            result = result.filter(s => s["Stoc"] <= 0);
        }

        // Sort alphabetically by product name
        return [...result].sort((a, b) =>
            a["Denumire produs"].localeCompare(b["Denumire produs"], 'ro', { sensitivity: 'base' })
        );
    }, [stocks, searchQuery, filterStatus]);

    return (
        <div className="flex flex-col h-full space-y-4">
            {/* Toolbar */}
            <div className="bg-slate-800 p-3 sm:p-4 rounded-xl border border-slate-700 flex flex-col gap-4 shadow-lg">
                {/* Row 1: Search & Scan */}
                <div className="flex gap-2 w-full">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 w-4 h-4" />
                        <input
                            type="text"
                            placeholder="Caută produse (Nume, Cod, Furnizor)..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full bg-slate-900 border border-slate-700 rounded-lg pl-10 pr-4 py-2 text-white focus:ring-2 focus:ring-emerald-500 outline-none placeholder:text-slate-600"
                        />
                    </div>
                    <button
                        onClick={() => setIsScanning(true)}
                        disabled={isInventoryActive}
                        className={`bg-slate-700 text-white p-2 rounded-lg border border-slate-600 transition-colors ${isInventoryActive ? 'opacity-50 cursor-not-allowed' : 'hover:bg-slate-600'}`}
                        title={isInventoryActive ? "Inventar activ: scanarea este folosită pentru inventar" : "Scanează pentru căutare"}
                    >
                        <ScanLine className="w-5 h-5" />
                    </button>
                </div>

                {/* Row 2: Import/Export Actions */}
                <div className="flex gap-2 w-full overflow-x-auto pb-1 md:pb-0">

                    <button
                        onClick={isInventoryActive ? handleStopInventory : handleStartInventory}
                        disabled={isInventoryLoading}
                        className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg transition-colors whitespace-nowrap border ${isInventoryActive
                            ? 'bg-red-600/20 text-red-300 border-red-500/30 hover:bg-red-600/30'
                            : 'bg-emerald-600/20 text-emerald-300 border-emerald-500/30 hover:bg-emerald-600/30'
                            }`}
                    >
                        {isInventoryLoading ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                        ) : isInventoryActive ? (
                            <StopCircle className="w-4 h-4" />
                        ) : (
                            <ClipboardList className="w-4 h-4" />
                        )}
                        {isInventoryActive ? 'Stop inventar' : 'Start inventar'}
                    </button>

                    <button
                        onClick={() => {
                            if (selectedProducts.size === 0) {
                                alert("Vă rugăm să selectați produsele pe care doriți să le exportați din listă.");
                                return;
                            }
                            const codes = Array.from(selectedProducts).join(',');
                            window.location.href = `${getExportStocksXlsUrl()}&codes=${encodeURIComponent(codes)}`;
                        }}
                        className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-emerald-700/50 text-emerald-100 border border-emerald-600/50 rounded-lg hover:bg-emerald-600/50 transition-colors whitespace-nowrap"
                        title="Descarcă format Excel"
                    >
                        <Download className="w-4 h-4" />
                        Export XLS
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
                        <div className="flex items-center gap-3 w-full md:w-auto justify-end animate-in fade-in bg-blue-900/20 px-3 py-1 rounded-md border border-blue-900/30">
                            <span className="text-xs text-blue-200 font-semibold">{selectedProducts.size} selectate</span>
                            <button
                                onClick={() => setSelectedProducts(new Set())}
                                className="text-xs text-blue-300 hover:text-white underline decoration-blue-500/50 underline-offset-4 transition-colors px-2 py-1"
                            >
                                Resetează
                            </button>
                            <div className="w-px h-4 bg-blue-900/40 mx-1"></div>
                            <button
                                onClick={handleDeleteSelected}
                                className="flex items-center gap-1.5 px-3 py-1.5 bg-red-600 text-white rounded hover:bg-red-500 text-sm transition-colors shadow-lg shadow-red-900/20"
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

                {/* Row 2.8: Inventory Status */}
                {isInventoryActive && (
                    <div className="flex flex-col md:flex-row gap-3 items-start md:items-center bg-amber-900/20 border border-amber-700/30 rounded-lg p-3">
                        <div className="flex-1">
                            <div className="text-amber-200 text-sm font-semibold">Inventar activ</div>
                            <div className="text-xs text-amber-200/80">
                                Gestiune: {managementLabel} • Scanate: {inventoryTotals.totalScanned} ({inventoryTotals.uniqueScanned} unice)
                                {inventoryTotals.totalUnknown > 0 && ` • Necunoscute: ${inventoryTotals.totalUnknown}`}
                            </div>
                            {lastInventoryScan && (
                                <div className="text-[11px] text-amber-200/80 mt-1">
                                    Ultimul: {lastInventoryScan.name} ({lastInventoryScan.code})
                                </div>
                            )}
                        </div>
                        <button
                            onClick={() => setIsInventoryScanning(true)}
                            disabled={isInventoryScanning}
                            className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-semibold border transition-colors ${isInventoryScanning
                                ? 'bg-amber-900/40 text-amber-200 border-amber-700/40 cursor-not-allowed'
                                : 'bg-amber-600/20 text-amber-200 border-amber-500/30 hover:bg-amber-600/30'
                                }`}
                        >
                            <ScanLine className="w-4 h-4" />
                            {isInventoryScanning ? 'Scanner activ' : 'Scanează inventar'}
                        </button>
                    </div>
                )}

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
            {
                error && (
                    <div className="bg-red-500/10 border border-red-500/50 p-4 rounded-xl text-red-200 text-sm">
                        {error}
                    </div>
                )
            }

            {/* Inventory Differences */}
            {
                showInventoryDiffs && (
                    <div className="bg-slate-800/60 border border-slate-700 rounded-xl p-4">
                        <div className="flex flex-wrap items-center justify-between gap-3">
                            <div className="flex items-center gap-2">
                                <ClipboardList className="w-5 h-5 text-emerald-400" />
                                <div className="text-white font-semibold">Diferențe inventar</div>
                                <span className="text-xs bg-slate-700 text-slate-300 px-2 py-0.5 rounded-full border border-slate-600">
                                    {inventoryDiffSummary.total} poziții
                                </span>
                            </div>

                            <div className="flex bg-slate-700/50 rounded-lg p-1 border border-slate-600 shadow-inner">
                                <button
                                    onClick={() => handlePrintInventory('diffs')}
                                    className="px-3 py-1 text-[11px] font-bold text-slate-300 hover:text-white flex items-center gap-1.5 transition-all active:scale-95"
                                    title="Printează doar diferențele"
                                >
                                    <Printer className="w-3.5 h-3.5" /> Diferențe
                                </button>
                                <div className="w-[1px] bg-slate-600 mx-1"></div>
                                <button
                                    onClick={() => handlePrintInventory('matches')}
                                    className="px-3 py-1 text-[11px] font-bold text-slate-300 hover:text-white flex items-center gap-1.5 transition-all active:scale-95"
                                    title="Printează doar produsele corecte"
                                >
                                    <Printer className="w-3.5 h-3.5" /> Corecte
                                </button>
                                <div className="w-[1px] bg-slate-600 mx-1"></div>
                                <button
                                    onClick={() => handlePrintInventory('all')}
                                    className="px-3 py-1 text-[11px] font-bold text-emerald-400 hover:text-emerald-300 flex items-center gap-1.5 transition-all active:scale-95"
                                    title="Printează tot raportul"
                                >
                                    <Printer className="w-3.5 h-3.5" /> TOT
                                </button>
                            </div>
                        </div>

                        {inventoryDiffs.length === 0 ? (
                            <div className="text-sm text-slate-400 mt-3">Nu există diferențe față de stocul din Oblio.</div>
                        ) : (
                            <div className="mt-3 space-y-2">
                                {inventoryDiffs.map(item => {
                                    const badge = diffBadgeConfig[item.status];
                                    const codeLabel = item.code || item.key;
                                    return (
                                        <div
                                            key={`${item.key}-${item.status}`}
                                            className="flex flex-col md:flex-row md:items-center justify-between gap-3 bg-slate-900/60 border border-slate-700/50 rounded-lg p-3"
                                        >
                                            <div className="min-w-0">
                                                <div className="text-sm text-white truncate">{item.name}</div>
                                                <div className="text-xs text-slate-400 font-mono">{codeLabel}</div>
                                            </div>
                                            <div className="flex flex-wrap items-center gap-3 justify-between md:justify-end">
                                                <span className={`text-[11px] px-2 py-0.5 rounded-full border ${badge.className}`}>
                                                    {badge.label}
                                                </span>
                                                <div className="text-xs text-slate-400">
                                                    Oblio: <span className="text-slate-200 font-semibold">{item.expected}</span>
                                                </div>
                                                <div className="text-xs text-slate-400">
                                                    Inventar: <span className="text-slate-200 font-semibold">{item.counted}</span>
                                                </div>
                                                <div className={`text-sm font-semibold ${item.delta >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                                                    {item.delta > 0 ? `+${item.delta}` : item.delta}
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                                <div className="mt-4 pt-4 border-t border-slate-700/50 flex justify-end">
                                    <button
                                        onClick={() => handlePrintInventory('diffs')}
                                        className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-500 transition-colors font-bold text-sm shadow-lg shadow-emerald-900/40"
                                    >
                                        <Printer className="w-4 h-4" /> Imprimă Tabel Diferențe
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* Inventory Matches */}
                        {inventoryMatches.length > 0 && (
                            <div className="mt-8">
                                <div className="flex items-center gap-2 mb-4">
                                    <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                                    <div className="text-white font-semibold">Produse corecte (fără diferențe)</div>
                                    <span className="text-xs bg-slate-700 text-slate-300 px-2 py-0.5 rounded-full border border-slate-600">
                                        {inventoryMatches.length} poziții
                                    </span>
                                </div>
                                <div className="space-y-2 max-h-96 overflow-y-auto pr-2 custom-scrollbar">
                                    {inventoryMatches.map(item => (
                                        <div
                                            key={item.key}
                                            className="flex flex-col md:flex-row md:items-center justify-between gap-3 bg-slate-900/40 border border-slate-700/30 rounded-lg p-3 opacity-80 hover:opacity-100 transition-opacity"
                                        >
                                            <div className="min-w-0">
                                                <div className="text-sm text-slate-300 truncate">{item.name}</div>
                                                <div className="text-xs text-slate-500 font-mono">{item.code || item.key}</div>
                                            </div>
                                            <div className="flex items-center gap-4 justify-between md:justify-end">
                                                <div className="text-xs text-slate-500">
                                                    Stoc: <span className="text-emerald-500/80 font-semibold">{item.counted}</span>
                                                </div>
                                                <div className="text-xs bg-emerald-500/10 text-emerald-500/70 px-2 py-0.5 rounded border border-emerald-500/20">
                                                    CONFIRMAT
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                )
            }

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
                                className="p-1 sm:p-2 hover:bg-slate-700/50 transition-colors flex items-center justify-between group"
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
            {
                editingProduct && (
                    <StockEditModal
                        product={editingProduct}
                        isNew={isNewProduct}
                        onClose={() => setEditingProduct(null)}
                        onSave={handleSaveProduct}
                        onDelete={handleDeleteProduct}
                        options={{
                            furnizor: furnizorOptions,
                            material: materialOptions,
                            woodColor: woodColorOptions,
                            sidesType: sidesTypeOptions,
                            um: umOptions,
                            vatRate: vatRateOptions
                        }}
                    />
                )
            }

            {/* Scanner Overlay */}
            {
                (isScanning || isInventoryScanning) && (
                    <Scanner
                        onScan={isInventoryScanning ? handleInventoryScan : handleScan}
                        onClose={() => {
                            setIsScanning(false);
                            setIsInventoryScanning(false);
                            setInventoryEditingProduct(null);
                        }}
                        allowDuplicates={isInventoryScanning}
                        duplicateDelayMs={2000}
                    >
                        {isInventoryScanning && (
                            <div className="w-full flex flex-col gap-3">
                                {/* Inventory Search / Quick Add */}
                                {!inventoryEditingProduct && (
                                    <div className="relative w-full max-w-sm mx-auto">
                                        <div className="relative">
                                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 w-4 h-4" />
                                            <input
                                                type="text"
                                                placeholder="Caută/Adaugă: Nume, Cod, Furnizor..."
                                                value={inventorySearchQuery}
                                                onChange={(e) => setInventorySearchQuery(e.target.value)}
                                                className="w-full bg-slate-900/90 backdrop-blur border border-slate-700 rounded-xl pl-10 pr-4 py-3 text-white focus:ring-2 focus:ring-emerald-500 outline-none text-sm"
                                            />
                                            {inventorySearchQuery && (
                                                <button
                                                    onClick={() => setInventorySearchQuery('')}
                                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white"
                                                >
                                                    <X className="w-4 h-4" />
                                                </button>
                                            )}
                                        </div>

                                        {searchedInventory.length > 0 && (
                                            <div className="absolute bottom-full left-0 right-0 mb-2 bg-slate-800 border border-slate-700 rounded-xl shadow-2xl overflow-hidden max-h-48 overflow-y-auto animate-in slide-in-from-bottom-2 duration-200">
                                                {searchedInventory.map((p) => (
                                                    <button
                                                        key={getProductKey(p)}
                                                        onClick={() => handleInventoryScan(p.productCode || p.code || p.name)}
                                                        className="w-full text-left p-3 hover:bg-slate-700 transition-colors border-b border-slate-700 last:border-0 flex flex-col gap-0.5"
                                                    >
                                                        <span className="text-xs font-bold text-white truncate">{p.name}</span>
                                                        <span className="text-[10px] text-slate-400 font-mono italic">{p.productCode || p.code}</span>
                                                    </button>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                )}

                                {/* Inventory Product Detail / Count Editor */}
                                {inventoryEditingProduct && (
                                    <div className="w-full max-w-sm mx-auto bg-slate-800 border border-slate-700 rounded-2xl p-4 shadow-2xl animate-in zoom-in duration-200">
                                        <div className="flex justify-between items-start mb-3">
                                            <div className="min-w-0 pr-4">
                                                <h3 className="text-emerald-400 font-bold text-sm leading-tight truncate">
                                                    {inventoryEditingProduct.name}
                                                </h3>
                                                <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                                                    {inventoryEditingProduct.productCode || inventoryEditingProduct.code}
                                                </div>
                                            </div>
                                            <button
                                                onClick={() => setInventoryEditingProduct(null)}
                                                className="text-slate-500 hover:text-white p-1"
                                            >
                                                <X className="w-4 h-4" />
                                            </button>
                                        </div>

                                        <div className="flex items-center justify-between gap-4">
                                            <div className="flex items-center gap-2 bg-slate-900 p-1.5 rounded-xl border border-slate-700">
                                                <button
                                                    onClick={() => setInventoryTempCount(Math.max(0, inventoryTempCount - 1))}
                                                    className="w-10 h-10 flex items-center justify-center bg-slate-800 rounded-lg hover:bg-slate-700 text-slate-300"
                                                >
                                                    -
                                                </button>
                                                <input
                                                    type="number"
                                                    value={inventoryTempCount}
                                                    onChange={(e) => setInventoryTempCount(Number(e.target.value))}
                                                    className="w-14 bg-transparent text-center font-bold text-white outline-none text-lg"
                                                    onFocus={(e) => e.target.select()}
                                                />
                                                <button
                                                    onClick={() => setInventoryTempCount(inventoryTempCount + 1)}
                                                    className="w-10 h-10 flex items-center justify-center bg-slate-800 rounded-lg hover:bg-slate-700 text-slate-300"
                                                >
                                                    +
                                                </button>
                                            </div>

                                            <button
                                                onClick={handleSaveInventoryCount}
                                                className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white py-3 px-4 rounded-xl font-bold transition-all shadow-lg shadow-emerald-900/20"
                                            >
                                                SALVEAZĂ
                                            </button>
                                        </div>

                                        <div className="mt-3 grid grid-cols-2 gap-2">
                                            <button onClick={() => setInventoryTempCount(prev => prev + 1)} className="text-[10px] bg-slate-700/50 hover:bg-slate-700 py-1.5 rounded text-slate-300 transition-colors uppercase font-bold">+1 buc</button>
                                            <button onClick={() => setInventoryTempCount(prev => prev + 5)} className="text-[10px] bg-slate-700/50 hover:bg-slate-700 py-1.5 rounded text-slate-300 transition-colors uppercase font-bold">+5 buc</button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                    </Scanner>
                )
            }
            {/* Inventory Print Report Portal */}
            {inventoryPrintMode !== 'none' && (
                <InventoryPrintReport
                    diffs={inventoryDiffs}
                    matches={inventoryMatches}
                    mode={inventoryPrintMode}
                    finishedAt={inventoryFinishedAt}
                />
            )}
        </div >
    );
};

interface InventoryPrintReportProps {
    diffs: InventoryDiffItem[];
    matches: InventoryDiffItem[];
    mode: 'diffs' | 'matches' | 'all';
    finishedAt: Date | null;
}

const InventoryPrintReport: React.FC<InventoryPrintReportProps> = ({ diffs, matches, mode, finishedAt }) => {
    if (mode === 'none') return null;

    const showDiffs = mode === 'diffs' || mode === 'all';
    const showMatches = mode === 'matches' || mode === 'all';
    const dateStr = finishedAt ? finishedAt.toLocaleString('ro-RO') : new Date().toLocaleString('ro-RO');

    return createPortal(
        <div className="print-area inventory-print-report">
            <div className="report-header">
                <h1>Raport Inventar</h1>
                <div className="report-meta">
                    <div><strong>Data și ora finalizării:</strong> {dateStr}</div>
                </div>
            </div>

            {showDiffs && diffs.length > 0 && (
                <div className="report-section">
                    <h2>Diferențe detectate</h2>
                    <table>
                        <thead>
                            <tr>
                                <th>Produs</th>
                                <th>Cod</th>
                                <th>Status</th>
                                <th>Oblio</th>
                                <th>Inventar</th>
                                <th>Dif.</th>
                            </tr>
                        </thead>
                        <tbody>
                            {diffs.map(item => (
                                <tr key={item.key}>
                                    <td>{item.name}</td>
                                    <td>{item.code || item.key}</td>
                                    <td className="font-bold">{item.status.toUpperCase()}</td>
                                    <td>{item.expected}</td>
                                    <td className="font-bold">{item.counted}</td>
                                    <td className={`font-bold ${item.delta > 0 ? 'text-green' : 'text-red'}`}>
                                        {item.delta > 0 ? `+${item.delta}` : item.delta}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {showMatches && matches.length > 0 && (
                <div className="report-section">
                    <h2>Produse conforme (stoc corect)</h2>
                    <table>
                        <thead>
                            <tr>
                                <th>Produs</th>
                                <th>Cod</th>
                                <th>Cantitate</th>
                                <th>Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            {matches.map(item => (
                                <tr key={item.key}>
                                    <td>{item.name}</td>
                                    <td>{item.code || item.key}</td>
                                    <td className="font-bold">{item.counted}</td>
                                    <td className="text-green font-bold">OK</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>,
        document.body
    );
};

export default StocksView;

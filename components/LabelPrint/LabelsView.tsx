import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Product, TemplateStyle } from '../../types/labelTypes';
import { EditProductModal } from './EditProductModal';
import { PrintLayout } from './PrintLayout';
import { EMPTY_PRODUCT, SIZE_CLASSES } from '../../services/labelConstants';
import { generateEAN13 } from '../../utils/labelUtils';
import { OblioProduct, StockItem } from '../../types';
import { fetchStocksFromFile, saveStocksToFile, getExportStocksXlsUrl } from '../../services/stockFileService';
import { mapOblioToStockItems, mapProductToStockItem } from '../../services/productUtils';

interface LabelsViewProps {
    inventory: OblioProduct[];
}

const KNOWN_MATERIALS = ['BRAD', 'FAG', 'STEJAR', 'FRASIN', 'PIN', 'TEI', 'CIRES', 'WENGE', 'ALB', 'NEGRU'];
const KNOWN_SIDES = ['4 LATURI', '6 LATURI', '8 LATURI', 'PATRU LATURI', 'SASE LATURI'];

// Icons from FontAwesome
const Icons = {
    Print: () => <i className="fa-solid fa-print text-lg"></i>,
    Pdf: () => <i className="fa-solid fa-file-pdf"></i>,
    Download: () => <i className="fa-solid fa-download"></i>,
    Logo: () => <i className="fa-solid fa-id-card text-blue-500"></i>,
    Cloud: () => <i className="fa-solid fa-cloud-arrow-down"></i>,
    Upload: () => <i className="fa-solid fa-upload"></i>,
    Database: () => <i className="fa-solid fa-database text-amber-500"></i>,
    Spinner: () => <i className="fa-solid fa-spinner fa-spin"></i>,
    Import: () => <i className="fa-solid fa-file-import"></i>,
    Recovery: () => <i className="fa-solid fa-clock-rotate-left"></i>,
    Palette: () => <i className="fa-solid fa-palette text-pink-500"></i>,
    Search: () => <i className="fa-solid fa-magnifying-glass absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"></i>,
    LayerGroup: () => <i className="fa-solid fa-layer-group text-6xl mb-4 opacity-10"></i>,
    Barcode: () => <i className="fa-solid fa-barcode text-[8px]"></i>,
    Minus: () => <i className="fa-solid fa-minus text-xs"></i>,
    Plus: () => <i className="fa-solid fa-plus text-xs"></i>,
    Edit: () => <i className="fa-solid fa-pen-to-square"></i>,
    Copy: () => <i className="fa-solid fa-copy"></i>,
    Trash: () => <i className="fa-solid fa-trash"></i>,
    Close: () => <i className="fa-solid fa-x"></i>,
    Settings: () => <i className="fa-solid fa-cog"></i>,
    ChevronDown: () => <i className="fa-solid fa-chevron-down"></i>,
    ChevronUp: () => <i className="fa-solid fa-chevron-up"></i>
};

export const LabelsView: React.FC<LabelsViewProps> = ({ inventory }) => {
    const [products, setProducts] = useState<Product[]>([]);
    const [selectedQuantities, setSelectedQuantities] = useState<Record<string, number>>({});
    const [logoUrl, setLogoUrl] = useState<string | null>('https://ai24stiri.ro/scan/public/logo-transparent.png');
    const [template, setTemplate] = useState<TemplateStyle>(TemplateStyle.ELEGANT);
    const [showImages, setShowImages] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [editingProduct, setEditingProduct] = useState<Product | null>(null);
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);
    const [remoteLogoUrl, setRemoteLogoUrl] = useState('https://ai24stiri.ro/scan/public/logo-transparent.png');

    const fileInputRef = useRef<HTMLInputElement>(null);
    const recoveryInputRef = useRef<HTMLInputElement>(null);
    const logoInputRef = useRef<HTMLInputElement>(null);

    const processImportedProducts = useCallback((incomingProducts: any[], currentProducts: Product[]): { processed: Product[], duplicatesSkipped: number } => {
        if (!Array.isArray(incomingProducts)) return { processed: [], duplicatesSkipped: 0 };
        const existingCodes = new Set(currentProducts.map(p => p.code));
        const newlyAddedCodes = new Set<string>();
        const processed: Product[] = [];
        let duplicatesSkipped = 0;

        incomingProducts.forEach((p, index) => {
            let foundCode = p.productCode || p.code || p["Cod produs"];
            const finalCode = foundCode ? String(foundCode).replace(/\s/g, '') : generateEAN13();

            if (existingCodes.has(finalCode) || newlyAddedCodes.has(finalCode)) {
                duplicatesSkipped++;
                return;
            }
            newlyAddedCodes.add(finalCode);

            const modelName = p.name || p["Denumire produs"] || p.modelName || "";
            const price = Number(p.Pret || p.price || p["Pret vanzare"] || 0);
            const currency = p.Moneda || p.currency || p["Moneda vanzare"] || "RON";

            const upperName = modelName.toUpperCase();
            let material = p.material || KNOWN_MATERIALS.find(m => upperName.includes(m)) || "BRAD";
            let sidesType = p.sidesType || KNOWN_SIDES.find(s => upperName.includes(s)) || "4 LATURI";
            let woodColor = p.woodColor || (upperName.includes("MAHON") ? "MAHON" : "NUC");
            let furnizor = p.furnizor || "Diverse";
            let sizeClass = p.sizeClass || "L";
            let weightCapacityMax = Number(p.weightCapacityMax || 0);
            let dimensions = { ...EMPTY_PRODUCT.dimensions };

            const descriptionField = p.Descriere || p.description;
            if (descriptionField) {
                const lines = descriptionField.split('\n').map((l: string) => l.trim()).filter((l: string) => l !== "");
                if (lines.length >= 1) furnizor = lines[0];
                if (lines.length >= 2) material = lines[1];
                if (lines.length >= 3) woodColor = lines[2];
                if (lines.length >= 4) {
                    const sizeStr = lines[3].trim();
                    const dimMatch = sizeStr.match(/^(\d+)\s*[xX]\s*(\d+)\s*[xX]\s*(\d+)$/);

                    if (dimMatch) {
                        dimensions = {
                            length: parseInt(dimMatch[1]),
                            width: parseInt(dimMatch[2]),
                            height: parseInt(dimMatch[3])
                        };
                        sizeClass = "";
                    } else {
                        const parsedSize = sizeStr.toUpperCase();
                        const matchedSize = SIZE_CLASSES.find(sc => sc.id === parsedSize);
                        if (matchedSize) {
                            sizeClass = matchedSize.id;
                            dimensions = { ...matchedSize.dims };
                            weightCapacityMax = matchedSize.weight;
                        } else {
                            sizeClass = sizeStr;
                        }
                    }
                }
                if (lines.length >= 5) {
                    const weightVal = parseFloat(lines[4].replace(/[^\d.]/g, ''));
                    if (!isNaN(weightVal)) weightCapacityMax = weightVal;
                }
                if (lines.length >= 6) {
                    p.isSmallLabel = lines[5].includes("SMALL: DA");
                }
            }

            const finalId = `id-${Date.now()}-${index}-${Math.random().toString(36).substr(2, 5)}`;
            processed.push({
                ...EMPTY_PRODUCT,
                ...p,
                modelName,
                price,
                furnizor,
                currency,
                code: finalCode,
                id: finalId,
                sidesType,
                woodColor,
                material,
                sizeClass,
                weightCapacityMax,
                dimensions,
                isSmallLabel: p.isSmallLabel || false,
                rawStockData: p
            });
        });
        return { processed, duplicatesSkipped };
    }, []);

    useEffect(() => {
        const initializeWorkspace = async () => {
            let serverStocks: StockItem[] = [];
            try {
                serverStocks = await fetchStocksFromFile();
            } catch (err) {
                console.error("Could not fetch server stocks:", err);
            }
            const serverLabelProducts = processImportedProducts(serverStocks, []).processed;
            if (inventory.length > 0) {
                const { processed: freshOblioProducts } = processImportedProducts(inventory, serverLabelProducts);
                setProducts([...serverLabelProducts, ...freshOblioProducts]);
            } else if (serverLabelProducts.length > 0) {
                setProducts(serverLabelProducts);
            }
        };
        initializeWorkspace();
    }, [inventory, processImportedProducts]);

    const handleSyncToServer = async () => {
        if (products.length === 0) return;
        if (!confirm("Sigur doriți să actualizați descrierile de pe server cu datele din acest Workspace?")) return;
        try {
            const serverStocks = await fetchStocksFromFile();
            const updatedStocks = [...serverStocks];
            products.forEach(p => {
                const updatedStockItem = mapProductToStockItem(p);
                const index = updatedStocks.findIndex(s => s["Cod produs"] === p.code);
                if (index !== -1) {
                    updatedStocks[index] = {
                        ...updatedStocks[index],
                        ...updatedStockItem,
                        "Stoc": updatedStocks[index]["Stoc"]
                    };
                } else {
                    updatedStocks.push(updatedStockItem);
                }
            });
            await saveStocksToFile(updatedStocks);
            alert("Datele au fost salvate pe server!");
        } catch (err: any) {
            alert("Eroare la salvare: " + err.message);
        }
    };

    const handleImportFromOblioToServer = async () => {
        if (inventory.length === 0) return;
        if (!confirm(`Importați ${inventory.length} produse din Oblio?`)) return;
        try {
            const serverStocks = await fetchStocksFromFile();
            const freshOblioStocks = mapOblioToStockItems(inventory);
            const updatedStocks = [...serverStocks];
            freshOblioStocks.forEach(freshItem => {
                const index = updatedStocks.findIndex(s => s["Cod produs"] === freshItem["Cod produs"]);
                if (index !== -1) {
                    updatedStocks[index] = {
                        ...updatedStocks[index],
                        "Stoc": freshItem["Stoc"],
                        "Pret": freshItem["Pret"],
                        "Denumire produs": freshItem["Denumire produs"],
                        "Cota TVA": freshItem["Cota TVA"]
                    };
                } else {
                    updatedStocks.push(freshItem);
                }
            });
            await saveStocksToFile(updatedStocks);
            const { processed } = processImportedProducts(updatedStocks, []);
            setProducts(processed);
            alert("Sincronizare finalizată!");
        } catch (err: any) {
            alert("Eroare: " + err.message);
        }
    };

    const toggleProductSelection = (id: string) => {
        setSelectedQuantities(prev => {
            const next = { ...prev };
            if (next[id] !== undefined) delete next[id];
            else next[id] = 1;
            return next;
        });
    };

    const updateQuantity = (id: string, delta: number) => {
        setSelectedQuantities(prev => {
            const current = prev[id] || 0;
            const nextQty = Math.max(0, current + delta);
            const next = { ...prev };
            if (nextQty === 0) delete next[id];
            else next[id] = nextQty;
            return next;
        });
    };

    const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => setLogoUrl(reader.result as string);
            reader.readAsDataURL(file);
        }
    };

    const handleLoadRemoteLogo = () => {
        if (!remoteLogoUrl) return;
        setLogoUrl(remoteLogoUrl);
    };

    const handleHtmlRecovery = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (!files || files.length === 0) return;
        let recoveredRaw: any[] = [];
        for (let i = 0; i < files.length; i++) {
            const text = await files[i].text();
            const parser = new DOMParser();
            const doc = parser.parseFromString(text, 'text/html');
            const metadataScript = doc.getElementById('label-metadata');
            if (metadataScript) {
                try {
                    const data = JSON.parse(metadataScript.textContent || '[]');
                    recoveredRaw = [...recoveredRaw, ...data];
                } catch (err) { }
            }
        }
        const { processed } = processImportedProducts(recoveredRaw, products);
        if (processed.length > 0) setProducts(prev => [...prev, ...processed]);
    };

    const handleExportWorkspace = () => {
        if (products.length === 0) return;
        const mappedProducts = products.map(p => ({
            "Denumire produs": p.modelName,
            "Cod produs": p.code,
            "Pret": p.price,
            "Moneda": p.currency,
            "Descriere": p.rawStockData?.Descriere || ""
        }));
        const blob = new Blob([JSON.stringify(mappedProducts, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `gestiune_${new Date().toISOString().slice(0, 10)}.json`;
        a.click();
        URL.revokeObjectURL(url);
    };

    const handleExportHtml = () => {
        const printArea = document.querySelector('.print-area');
        if (!printArea) return;
        const selectedForMeta = products.filter(p => (selectedQuantities[p.id] || 0) > 0);
        const metadata = JSON.stringify(selectedForMeta);
        const htmlContent = `<!DOCTYPE html><html lang="ro"><head><meta charset="UTF-8"><title>Export Etichete</title><script src="https://cdn.tailwindcss.com"></script><link href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css" rel="stylesheet" /><link href="https://fonts.googleapis.com/css2?family=Cinzel:wght@400;700&family=Playfair+Display:ital,wght@0,400;0,700;1,400&family=Roboto:wght@300;400;700&family=Libre+Barcode+EAN13&family=Libre+Barcode+EAN13+Text&display=swap" rel="stylesheet"><style>@media print {@page {size: A4; margin: 0; } body {margin: 0; padding: 0; -webkit-print-color-adjust: exact; } } body {background: white; font-family: 'Roboto', sans-serif; } .label-page {page-break-after: always; height: 297mm; width: 210mm; display: grid; grid-template-rows: 1fr 1fr; padding: 10mm; gap: 17mm; box-sizing: border-box; } .label-container {display: flex; align-items: center; justify-content: center; overflow: hidden; width: 100%; height: 100%; } .label-container:nth-child(1) {border-bottom: none; } * {-webkit-print-color-adjust: exact !important; }</style></head><body><script id="label-metadata" type="application/json">${metadata}</script><div class="print-area">${printArea.innerHTML}</div><script>window.onload = function() {setTimeout(function () { window.print(); }, 1000); };</script></body></html>`;
        const blob = new Blob([htmlContent], { type: 'text/html' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `etichete_${new Date().toISOString().slice(0, 10)}.html`;
        a.click();
        URL.revokeObjectURL(url);
    };

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (event) => {
            try {
                const json = JSON.parse(event.target?.result as string);
                const { processed } = processImportedProducts(json, products);
                if (processed.length > 0) setProducts(prev => [...prev, ...processed]);
            } catch (err) { }
        };
        reader.readAsText(file);
    };

    const selectAll = () => {
        const all: Record<string, number> = {};
        products.forEach(p => all[p.id] = 1);
        setSelectedQuantities(all);
    };
    const deselectAll = () => setSelectedQuantities({});

    const handlePrint = () => {
        if (Object.keys(selectedQuantities).length === 0) return;
        window.print();
    };

    const handleSaveProduct = async (updated: Product) => {
        setProducts(prev => prev.map(p => p.id === updated.id ? updated : p));
        setEditingProduct(null);
        try {
            const serverStocks = await fetchStocksFromFile();
            const updatedStockItem = mapProductToStockItem(updated);
            const index = serverStocks.findIndex(s => s["Cod produs"] === updated.code);
            if (index !== -1) serverStocks[index] = { ...serverStocks[index], ...updatedStockItem };
            else serverStocks.push(updatedStockItem);
            await saveStocksToFile(serverStocks);
        } catch (err) { }
    };

    const cloneProduct = (product: Product) => {
        const newId = `clone-${Date.now()}`;
        const cloned = { ...product, id: newId, code: generateEAN13() };
        setProducts(prev => [...prev, cloned]);
        setSelectedQuantities(prev => ({ ...prev, [newId]: 1 }));
    };

    const removeProduct = (id: string) => {
        setProducts(prev => prev.filter(p => p.id !== id));
        setSelectedQuantities(prev => {
            const next = { ...prev };
            delete next[id];
            return next;
        });
    };

    const filteredProducts = products.filter(p => {
        const q = searchQuery.toLowerCase();
        return p.modelName.toLowerCase().includes(q) || p.code.toLowerCase().includes(q) || (p.furnizor?.toLowerCase().includes(q));
    });

    const selectedProductsForPrint: Product[] = [];
    products.forEach(p => {
        const qty = selectedQuantities[p.id] || 0;
        for (let i = 0; i < qty; i++) selectedProductsForPrint.push(p);
    });

    const totalSelectedLabels = (Object.values(selectedQuantities) as number[]).reduce((a, b) => a + b, 0);

    return (
        <div className="flex flex-col font-sans text-gray-900 bg-gray-50/50 min-h-full">
            <div className="no-print p-3 sm:p-6 max-w-[1920px] mx-auto w-full space-y-6 sm:space-y-8">
                <div className={`${isSettingsOpen ? 'grid' : 'flex flex-col'} grid-cols-1 xl:grid-cols-12 gap-8`}>
                    <aside className={`${isSettingsOpen ? 'xl:col-span-3 min-w-[320px]' : 'hidden'} space-y-6 transition-all duration-300`}>
                        <div className="bg-white p-4 sm:p-6 rounded-2xl shadow-sm border border-gray-200">
                            <div className="flex items-center justify-between mb-4 border-b pb-3">
                                <h3 className="font-bold text-lg text-gray-800 flex items-center gap-2 uppercase tracking-tighter">
                                    <Icons.Settings /> Setări
                                </h3>
                                <button onClick={() => setIsSettingsOpen(false)} className="text-gray-400 hover:text-gray-600 xl:hidden"><Icons.Close /></button>
                            </div>
                            <div className="space-y-8">
                                <section>
                                    <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3 flex items-center gap-2"><Icons.Logo /> Logo Firmă</h4>
                                    <div className="space-y-4">
                                        {logoUrl && (
                                            <div className="w-full h-24 bg-gray-50 rounded-xl border border-gray-100 p-2 flex items-center justify-center mb-4 relative group">
                                                <img src={logoUrl} alt="Logo" className="max-h-full max-w-full object-contain" />
                                                <button onClick={() => setLogoUrl(null)} className="absolute top-1 right-1 w-6 h-6 bg-red-500 text-white rounded-full text-[10px] opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"><Icons.Close /></button>
                                            </div>
                                        )}
                                        <div className="bg-blue-50/50 p-4 rounded-xl border border-blue-100 space-y-3">
                                            <label className="text-[10px] font-black text-blue-700 uppercase tracking-widest block">URL Logo Server</label>
                                            <div className="flex gap-1">
                                                <input type="text" value={remoteLogoUrl} onChange={(e) => setRemoteLogoUrl(e.target.value)} className="flex-1 px-3 py-2 text-xs border border-blue-200 rounded-lg outline-none bg-white" />
                                                <button onClick={handleLoadRemoteLogo} className="w-10 h-10 flex items-center justify-center rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-all shadow-sm"><Icons.Cloud /></button>
                                            </div>
                                        </div>
                                        <input type="file" ref={logoInputRef} onChange={handleLogoUpload} accept="image/*" className="hidden" />
                                        <button onClick={() => logoInputRef.current?.click()} className="w-full py-3 px-4 bg-gray-50 text-gray-700 border border-gray-200 rounded-xl hover:bg-gray-100 transition font-black flex justify-between items-center text-xs uppercase tracking-widest">
                                            <span>Încarcă Logo Local</span> <Icons.Upload />
                                        </button>
                                    </div>
                                </section>
                                <section>
                                    <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3 flex items-center gap-2"><Icons.Database /> Scule Date</h4>
                                    <div className="space-y-3">
                                        <input type="file" ref={fileInputRef} onChange={handleFileUpload} accept=".json" className="hidden" />
                                        <button onClick={() => fileInputRef.current?.click()} className="w-full py-3 px-4 bg-gray-50 text-gray-700 border border-gray-200 rounded-xl hover:bg-gray-100 transition font-bold flex justify-between items-center text-xs uppercase tracking-widest">
                                            <span>Import Fișier JSON</span> <Icons.Import />
                                        </button>
                                        <button onClick={() => recoveryInputRef.current?.click()} className="w-full py-3 px-4 bg-red-50 text-red-700 border border-red-100 rounded-xl hover:bg-red-100 transition font-black flex justify-between items-center text-xs uppercase tracking-widest">
                                            <span>Recuperează din HTML</span> <Icons.Recovery />
                                        </button>
                                        <input type="file" ref={recoveryInputRef} onChange={handleHtmlRecovery} accept=".html" multiple className="hidden" />
                                        <button onClick={handleExportWorkspace} className="w-full py-3 px-4 bg-indigo-50 text-indigo-700 border border-indigo-100 rounded-xl hover:bg-indigo-100 transition font-black flex justify-between items-center text-xs uppercase tracking-widest">
                                            <span>Export Workspace JSON</span> <Icons.Download />
                                        </button>
                                    </div>
                                </section>
                                <section>
                                    <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3 flex items-center gap-2"><Icons.Palette /> Stil Vizual</h4>
                                    <div className="space-y-4">
                                        <div className="flex items-center justify-between bg-gray-50 p-3 rounded-xl border border-gray-200">
                                            <span className="text-sm font-bold text-gray-700">Afișează Imagine</span>
                                            <button onClick={() => setShowImages(!showImages)} className={`relative w-12 h-6 rounded-full transition-colors duration-300 ${showImages ? 'bg-indigo-600' : 'bg-gray-300'}`}>
                                                <span className={`absolute top-1 left-1 bg-white w-4 h-4 rounded-full shadow transition-transform duration-300 ${showImages ? 'translate-x-6' : 'translate-x-0'}`}></span>
                                            </button>
                                        </div>
                                        <div className="grid grid-cols-2 gap-3">
                                            {Object.values(TemplateStyle).map((style) => (
                                                <button key={style} onClick={() => setTemplate(style)} className={`py-2 px-1 text-[10px] font-black uppercase rounded-lg border-2 transition-all ${template === style ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white text-gray-400 border-gray-100'}`}>
                                                    {style}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                </section>
                            </div>
                        </div>
                    </aside>

                    <main className={`${isSettingsOpen ? 'xl:col-span-9' : 'xl:col-span-12'} bg-white rounded-2xl border border-gray-200 p-4 sm:p-6 flex flex-col shadow-sm min-h-[600px] transition-all duration-300`}>
                        <div className="flex flex-col gap-6 mb-8 border-b border-gray-100 pb-6">
                            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                                <div className="flex items-center gap-4">
                                    <button onClick={() => setIsSettingsOpen(!isSettingsOpen)} className={`w-10 h-10 flex items-center justify-center rounded-xl border transition-all ${isSettingsOpen ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white text-indigo-600 border-indigo-200 hover:bg-indigo-50'}`}><Icons.Settings /></button>
                                    <h2 className="text-xl font-black text-gray-800 tracking-tight uppercase">Workspace <span className="text-indigo-500 ml-2 font-normal text-sm lowercase italic">({products.length} modele)</span></h2>
                                </div>
                                <div className="flex flex-wrap gap-2">
                                    <button onClick={handleImportFromOblioToServer} className="px-4 py-2 rounded-lg font-bold text-emerald-600 border border-emerald-100 hover:bg-emerald-50 transition-colors flex items-center gap-2 text-xs"><i className="fa-solid fa-cloud-arrow-down"></i> Importă Oblio pe Server</button>
                                    <button onClick={handleSyncToServer} className="px-4 py-2 rounded-lg font-bold text-amber-600 border border-amber-100 hover:bg-amber-50 transition-colors flex items-center gap-2 text-xs"><i className="fa-solid fa-floppy-disk"></i> Salvează Workspace pe Server</button>
                                    <button onClick={() => window.location.href = getExportStocksXlsUrl()} className="px-4 py-2 rounded-lg font-bold text-blue-600 border border-blue-100 hover:bg-blue-50 transition-colors flex items-center gap-2 text-xs"><i className="fa-solid fa-file-excel"></i> Export XLS (Oblio)</button>
                                    <div className="w-px h-8 bg-gray-200 mx-2 hidden md:block"></div>
                                    <button onClick={handleExportHtml} className={`px-4 py-2 rounded-lg font-bold text-indigo-600 border border-indigo-100 hover:bg-indigo-50 flex items-center gap-2 text-xs ${totalSelectedLabels === 0 ? 'opacity-50' : ''}`}><Icons.Pdf /> Export HTML</button>
                                    <button onClick={handlePrint} className={`px-6 py-2 rounded-xl font-black shadow-xl transition-all flex items-center justify-center gap-3 text-sm uppercase tracking-widest ${totalSelectedLabels === 0 ? 'bg-gray-200 text-gray-400' : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-indigo-200'}`}><Icons.Print /> IMPRIMĂ ({totalSelectedLabels})</button>
                                </div>
                            </div>
                            <div className="relative flex-1">
                                <Icons.Search />
                                <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Caută model, cod..." className="w-full pl-12 pr-4 py-3.5 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-indigo-500 transition-all font-medium text-gray-700" />
                            </div>
                        </div>

                        <div className="flex-1 overflow-y-auto space-y-4 max-h-[800px] pr-2 custom-scrollbar">
                            {products.length === 0 ? (
                                <div className="h-full flex flex-col items-center justify-center text-indigo-500 py-20"><Icons.Spinner /><p className="font-bold mt-4">Nu există produse.</p></div>
                            ) : filteredProducts.map((p) => {
                                const qty = selectedQuantities[p.id] || 0;
                                const isSelected = qty > 0;
                                return (
                                    <div key={p.id} className={`flex flex-col lg:flex-row lg:items-center gap-3 lg:gap-4 p-4 rounded-2xl border transition-all ${isSelected ? 'bg-indigo-50/30 border-indigo-100' : 'bg-white border-gray-100 hover:border-indigo-100'}`}>
                                        <div className="flex items-start gap-4 flex-1">
                                            <input type="checkbox" checked={isSelected} onChange={() => toggleProductSelection(p.id)} className="w-6 h-6 rounded-lg text-indigo-600 cursor-pointer border-gray-300 mt-0.5" />
                                            <div className="flex-1" onClick={() => !isSelected && toggleProductSelection(p.id)}>
                                                <p className="font-black text-gray-900 uppercase tracking-tight text-sm sm:text-base">{p.modelName}</p>
                                                <div className="flex flex-wrap gap-x-3 gap-y-1 text-[10px] font-bold text-gray-400 uppercase mt-1.5">
                                                    <span className="text-indigo-500 font-mono"><Icons.Barcode /> {p.code}</span>
                                                    <span className="text-emerald-600">{p.price} {p.currency}</span>
                                                    <span className="bg-gray-100 px-1.5 rounded text-gray-500">{p.material}</span>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex items-center justify-between lg:justify-end gap-3 mt-1 lg:mt-0">
                                            <div className="flex items-center gap-1 bg-white border rounded-xl p-1 border-gray-100">
                                                <button onClick={() => updateQuantity(p.id, -1)} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-50 text-gray-400 hover:text-red-500"><Icons.Minus /></button>
                                                <span className={`w-8 text-center font-black text-sm ${isSelected ? 'text-indigo-600' : 'text-gray-400'}`}>{qty}</span>
                                                <button onClick={() => updateQuantity(p.id, 1)} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-50 text-gray-400 hover:text-indigo-600"><Icons.Plus /></button>
                                            </div>
                                            <div className="flex gap-1">
                                                <button onClick={() => setEditingProduct(p)} className="w-9 h-9 flex items-center justify-center rounded-xl bg-white text-indigo-500 border border-indigo-50 hover:bg-indigo-500 hover:text-white transition-all"><Icons.Edit /></button>
                                                <button onClick={() => cloneProduct(p)} className="w-9 h-9 flex items-center justify-center rounded-xl bg-white text-emerald-500 border border-emerald-50 hover:bg-emerald-500 hover:text-white transition-all"><Icons.Copy /></button>
                                                <button onClick={() => removeProduct(p.id)} className="w-9 h-9 flex items-center justify-center rounded-xl bg-white text-red-500 border border-red-50 hover:bg-red-500 hover:text-white transition-all"><Icons.Trash /></button>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </main>
                </div>
            </div>
            <PrintLayout products={selectedProductsForPrint} template={template} logoUrl={logoUrl} showImages={showImages} />
            {editingProduct && (
                <EditProductModal
                    product={editingProduct}
                    onSave={handleSaveProduct}
                    onClose={() => setEditingProduct(null)}
                />
            )}
        </div>
    );
};

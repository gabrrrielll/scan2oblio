
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Product, TemplateStyle } from './types';
import { EditProductModal } from './components/EditProductModal';
import { PrintLayout } from './components/PrintLayout';
import { EMPTY_PRODUCT } from './services/constants';
import { generateEAN13 } from './utils';

const KNOWN_MATERIALS = ['BRAD', 'FAG', 'STEJAR', 'FRASIN', 'PIN', 'TEI', 'CIRES', 'WENGE', 'ALB', 'NEGRU'];
const KNOWN_SIDES = ['4 LATURI', '6 LATURI', '8 LATURI', 'PATRU LATURI', 'SASE LATURI'];

const App: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedQuantities, setSelectedQuantities] = useState<Record<string, number>>({});
  const [logoUrl, setLogoUrl] = useState<string | null>('https://ai24stiri.ro/scan/public/logo-transparent.png');
  const [template, setTemplate] = useState<TemplateStyle>(TemplateStyle.ELEGANT);
  const [showImages, setShowImages] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  
  const [syncUrl, setSyncUrl] = useState('https://ai24stiri.ro/scan/stocuri.json');
  const [remoteLogoUrl, setRemoteLogoUrl] = useState('https://ai24stiri.ro/scan/public/logo-transparent.png');
  const [isSyncing, setIsSyncing] = useState(false);

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
      let foundCode = p["Cod produs"] || p.code;
      if (!foundCode) {
         const keys = Object.keys(p);
         const codeKey = keys.find(k => /^(code|cod|ean|barcode|sku|ean13)$/i.test(k));
         if (codeKey) foundCode = p[codeKey];
      }
      const finalCode = foundCode ? String(foundCode).replace(/\s/g, '') : generateEAN13();
      if (existingCodes.has(finalCode) || newlyAddedCodes.has(finalCode)) {
        duplicatesSkipped++;
        return;
      }
      newlyAddedCodes.add(finalCode);
      const modelName = p["Denumire produs"] || p.modelName || "";
      const price = Number(p["Pret vanzare"] || p.price || 0);
      const furnizor = p["Furnizor"] || p.furnizor || "";
      const currency = p["Moneda vanzare"] || p.currency || "RON";
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
        sidesType: p.sidesType || p["sidesType"] || "4 LATURI",
        woodColor: p.woodColor || p["woodColor"] || "NUC",
        material: p.material || p["material"] || "BRAD"
      });
    });
    return { processed, duplicatesSkipped };
  }, []);

  const handleLiveSync = useCallback(async (isAuto = false) => {
    if (!syncUrl) return;
    setIsSyncing(true);
    try {
      const targetUrl = syncUrl.startsWith('http') ? syncUrl : `https://${syncUrl}`;
      const response = await fetch(targetUrl);
      if (!response.ok) throw new Error(`Serverul a răspuns cu codul ${response.status}`);
      const json = await response.json();
      const { processed, duplicatesSkipped } = processImportedProducts(json, products);
      if (processed.length > 0) {
        setProducts(prev => [...prev, ...processed]);
        if (!isAuto) alert(`Sincronizare reușită! Am adăugat ${processed.length} produse noi.`);
      } else {
        if (!isAuto) alert(duplicatesSkipped > 0 ? "Toate produsele de pe server există deja." : "Nu s-au găsit date noi.");
      }
    } catch (err) {
      if (!isAuto) alert(`Eroare la sincronizare.`);
      console.error("Sync Error:", err);
    } finally {
      setIsSyncing(false);
    }
  }, [syncUrl, products, processImportedProducts]);

  // Initial load effect
  useEffect(() => {
    // Sincronizare automată la mount
    handleLiveSync(true);
  }, []); // Rulează o singură dată la pornire

  const toggleProductSelection = (id: string) => {
    setSelectedQuantities(prev => {
      const next = { ...prev };
      if (next[id] !== undefined) {
        delete next[id];
      } else {
        next[id] = 1;
      }
      return next;
    });
  };

  const updateQuantity = (id: string, delta: number) => {
    setSelectedQuantities(prev => {
      const current = prev[id] || 0;
      const nextQty = Math.max(0, current + delta);
      const next = { ...prev };
      if (nextQty === 0) {
        delete next[id];
      } else {
        next[id] = nextQty;
      }
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
    alert("Logo-ul a fost actualizat de pe server.");
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
          continue;
        } catch (err) {}
      }
      const labelContainers = doc.querySelectorAll('.label-container');
      labelContainers.forEach((container) => {
        const fullText = container.textContent || "";
        const h1 = container.querySelector('h1')?.textContent?.trim();
        if (h1) {
           const priceMatch = fullText.match(/(\d{3,5})\s*(RON|LEI|Lei)/i);
           const foundMaterial = KNOWN_MATERIALS.find(m => fullText.toUpperCase().includes(m)) || "";
           const foundSides = KNOWN_SIDES.find(s => fullText.toUpperCase().includes(s)) || "4 LATURI";
           let foundCode = "";
           const barcodeEl = Array.from(container.querySelectorAll('span')).find(s => 
              s.style.fontFamily.includes('Barcode') || s.className.includes('barcode') || s.textContent?.match(/^\d{13}$/)
           );
           if (barcodeEl) foundCode = barcodeEl.textContent?.trim() || "";
           const woodColor = container.querySelector('p')?.textContent?.trim() || "NUC";
           recoveredRaw.push({
             modelName: h1,
             price: priceMatch ? Number(priceMatch[1]) : 0,
             code: foundCode,
             woodColor: woodColor,
             material: foundMaterial,
             sidesType: foundSides
           });
        }
      });
    }
    const { processed } = processImportedProducts(recoveredRaw, products);
    if (processed.length > 0) setProducts(prev => [...prev, ...processed]);
    if (recoveryInputRef.current) recoveryInputRef.current.value = '';
  };

  const handleExportWorkspace = () => {
    if (products.length === 0) return;
    const mappedProducts = products.map(p => ({
        "Denumire produs": p.modelName,
        "Cod produs": p.code,
        "Pret vanzare": p.price,
        "Furnizor": p.furnizor,
        "sidesType": p.sidesType,
        "woodColor": p.woodColor,
        "material": p.material
    }));
    const blob = new Blob([JSON.stringify(mappedProducts, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `gestiune_${new Date().toISOString().slice(0,10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleExportHtml = () => {
    const printArea = document.querySelector('.print-area');
    if (!printArea) { alert("Niciun conținut pentru export."); return; }
    const selectedForMeta = products.filter(p => (selectedQuantities[p.id] || 0) > 0);
    const metadata = JSON.stringify(selectedForMeta);

    const htmlContent = `
<!DOCTYPE html>
<html lang="ro">
<head>
    <meta charset="UTF-8">
    <title>Export Etichete Funerare - ${new Date().toLocaleDateString()}</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <link href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css" rel="stylesheet" />
    <link href="https://fonts.googleapis.com/css2?family=Cinzel:wght@400;700&family=Playfair+Display:ital,wght@0,400;0,700;1,400&family=Roboto:wght@300;400;700&family=Libre+Barcode+EAN13&family=Libre+Barcode+EAN13+Text&display=swap" rel="stylesheet">
    <style>
      @media print { @page { size: A4; margin: 0; } body { margin: 0; padding: 0; -webkit-print-color-adjust: exact; print-color-adjust: exact; } }
      body { background: white; font-family: 'Roboto', sans-serif; }
      .label-page { page-break-after: always; height: 297mm; width: 210mm; display: grid; grid-template-rows: 1fr 1fr; padding: 10mm; box-sizing: border-box; }
      .label-container { display: flex; align-items: center; justify-content: center; overflow: hidden; width: 100%; height: 100%; }
      .label-container:nth-child(1) { border-bottom: 1px dashed #ccc; }
      * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
    </style>
</head>
<body>
    <script id="label-metadata" type="application/json">${metadata}</script>
    <div class="print-area">${printArea.innerHTML}</div>
    <script>window.onload = function() { setTimeout(function() { window.print(); }, 1000); };</script>
</body>
</html>`;

    const blob = new Blob([htmlContent], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `etichete_print_${new Date().toISOString().slice(0,10)}.html`;
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
      } catch (err) { alert('Eroare JSON.'); }
    };
    reader.readAsText(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const selectAll = () => {
    const all: Record<string, number> = {};
    products.forEach(p => all[p.id] = 1);
    setSelectedQuantities(all);
  };
  const deselectAll = () => setSelectedQuantities({});
  
  const handlePrint = () => {
    const totalCount = (Object.values(selectedQuantities) as number[]).reduce((a, b) => a + b, 0);
    if (totalCount === 0) { alert("Selectează cel puțin o etichetă!"); return; }
    window.print();
  };

  const handleSaveProduct = (updated: Product) => {
    setProducts(prev => prev.map(p => p.id === updated.id ? updated : p));
    setEditingProduct(null);
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
  }).sort((a,b) => ((selectedQuantities[b.id] ? 1 : 0) - (selectedQuantities[a.id] ? 1 : 0)));

  const selectedProductsForPrint: Product[] = [];
  products.forEach(p => {
    const qty = selectedQuantities[p.id] || 0;
    for (let i = 0; i < qty; i++) {
      selectedProductsForPrint.push(p);
    }
  });

  const totalSelectedLabels = (Object.values(selectedQuantities) as number[]).reduce((a, b) => a + b, 0);

  return (
    <div className="min-h-screen flex flex-col font-sans text-gray-900 bg-gray-50/50">
      <div className="no-print p-6 max-w-7xl mx-auto w-full space-y-8">
        <header className="flex flex-col md:flex-row justify-between items-center bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
          <div>
            <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">LabelPrint Pro <span className="text-indigo-600">Funerare</span></h1>
            <p className="text-gray-500 mt-1 font-medium italic">V3.6 - Sincronizare API și Identitate vizuală</p>
          </div>
          <div className="mt-4 md:mt-0 flex flex-col items-end gap-3">
            <button onClick={handlePrint} className={`px-8 py-3.5 rounded-xl font-black shadow-xl transition-all active:scale-95 flex items-center justify-center gap-3 text-sm uppercase tracking-widest ${totalSelectedLabels === 0 ? 'bg-gray-200 text-gray-400 cursor-not-allowed' : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-indigo-200'}`}>
              <i className="fa-solid fa-print text-lg"></i> IMPRIMĂ ({totalSelectedLabels})
            </button>
            <div className="flex gap-2">
                <button onClick={handleExportHtml} className={`px-4 py-2 rounded-lg font-bold text-indigo-600 border border-indigo-100 hover:bg-indigo-50 transition-colors flex items-center gap-2 text-xs ${totalSelectedLabels === 0 ? 'opacity-50 cursor-not-allowed' : ''}`}>
                    <i className="fa-solid fa-file-pdf"></i> Export PDF / HTML
                </button>
                <button onClick={handleExportWorkspace} className={`px-4 py-2 rounded-lg font-bold text-indigo-600 border border-indigo-100 hover:bg-indigo-50 transition-colors flex items-center gap-2 text-xs`}>
                    <i className="fa-solid fa-download"></i> Export JSON
                </button>
            </div>
          </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <aside className="lg:col-span-1 space-y-6">
             <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
                <h3 className="font-bold text-lg mb-4 text-gray-800 flex items-center gap-2 border-b pb-3 uppercase tracking-tighter">
                   <i className="fa-solid fa-id-card text-blue-500"></i> Logo Firmă
                </h3>
                <div className="space-y-4">
                    {logoUrl && (
                        <div className="w-full h-24 bg-gray-50 rounded-xl border border-gray-100 p-2 flex items-center justify-center mb-4 relative group">
                            <img src={logoUrl} alt="Preview Logo" className="max-h-full max-w-full object-contain" />
                            <button onClick={() => setLogoUrl(null)} className="absolute top-1 right-1 w-6 h-6 bg-red-500 text-white rounded-full text-[10px] opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"><i className="fa-solid fa-x"></i></button>
                        </div>
                    )}
                    <div className="bg-blue-50/50 p-4 rounded-xl border border-blue-100 space-y-3">
                        <label className="text-[10px] font-black text-blue-700 uppercase tracking-widest block">URL Logo Server</label>
                        <div className="flex gap-1">
                            <input type="text" value={remoteLogoUrl} onChange={(e) => setRemoteLogoUrl(e.target.value)} placeholder="URL Logo..." className="flex-1 px-3 py-2 text-xs border border-blue-200 rounded-lg outline-none bg-white" />
                            <button onClick={handleLoadRemoteLogo} className="w-10 h-10 flex items-center justify-center rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-all shadow-sm"><i className="fa-solid fa-cloud-arrow-down"></i></button>
                        </div>
                    </div>
                    <input type="file" ref={logoInputRef} onChange={handleLogoUpload} accept="image/*" className="hidden" />
                    <button onClick={() => logoInputRef.current?.click()} className="w-full py-3 px-4 bg-gray-50 text-gray-700 border border-gray-200 rounded-xl hover:bg-gray-100 transition font-black flex justify-between items-center text-xs uppercase tracking-widest">
                       <span>Încarcă Logo Local</span>
                       <i className="fa-solid fa-upload"></i>
                    </button>
                </div>
             </div>

             <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
              <h3 className="font-bold text-lg mb-4 text-gray-800 flex items-center gap-2 border-b pb-3 uppercase tracking-tighter">
                 <i className="fa-solid fa-database text-amber-500"></i> Sincronizare Date
              </h3>
              <div className="space-y-4">
                <div className="bg-amber-50/50 p-4 rounded-xl border border-amber-100 space-y-3">
                    <label className="text-[10px] font-black text-amber-700 uppercase tracking-widest block">URL Gestiune JSON</label>
                    <div className="flex gap-1">
                        <input type="text" value={syncUrl} onChange={(e) => setSyncUrl(e.target.value)} placeholder="URL server JSON..." className="flex-1 px-3 py-2 text-xs border border-amber-200 rounded-lg outline-none font-medium text-amber-900 bg-white" />
                        <button onClick={() => handleLiveSync()} disabled={isSyncing} className={`w-10 h-10 flex items-center justify-center rounded-lg shadow-sm transition-all ${isSyncing ? 'bg-amber-200 text-amber-400' : 'bg-amber-600 text-white hover:bg-amber-700 active:scale-90'}`}><i className={`fa-solid ${isSyncing ? 'fa-spinner fa-spin' : 'fa-cloud-arrow-down'}`}></i></button>
                    </div>
                </div>
                <div className="flex flex-col gap-3">
                    <input type="file" ref={fileInputRef} onChange={handleFileUpload} accept=".json" className="hidden" />
                    <button onClick={() => fileInputRef.current?.click()} className="w-full py-3 px-4 bg-gray-50 text-gray-700 border border-gray-200 rounded-xl hover:bg-gray-100 transition font-bold flex justify-between items-center text-xs uppercase tracking-widest">
                        <span>Încarcă Fișier JSON</span>
                        <i className="fa-solid fa-file-import"></i>
                    </button>
                    <button onClick={() => recoveryInputRef.current?.click()} className="w-full py-3 px-4 bg-red-50 text-red-700 border border-red-100 rounded-xl hover:bg-red-100 transition font-black flex justify-between items-center text-xs uppercase tracking-widest">
                       <span>Recuperează din HTML</span>
                       <i className="fa-solid fa-clock-rotate-left"></i>
                    </button>
                    <input type="file" ref={recoveryInputRef} onChange={handleHtmlRecovery} accept=".html" multiple className="hidden" />
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
              <h3 className="font-bold text-lg mb-4 text-gray-800 flex items-center gap-2 border-b pb-3 uppercase tracking-tighter">
                 <i className="fa-solid fa-palette text-pink-500"></i> Stil Vizual
              </h3>
              <div className="space-y-4">
                 <div className="flex items-center justify-between bg-gray-50 p-3 rounded-xl border border-gray-200">
                    <span className="text-sm font-bold text-gray-700">Afișează Imagine</span>
                    <button onClick={() => setShowImages(!showImages)} className={`relative w-12 h-6 rounded-full transition-colors duration-300 ${showImages ? 'bg-indigo-600' : 'bg-gray-300'}`}>
                        <span className={`absolute top-1 left-1 bg-white w-4 h-4 rounded-full shadow transition-transform duration-300 ${showImages ? 'translate-x-6' : 'translate-x-0'}`}></span>
                    </button>
                 </div>
                 <div className="grid grid-cols-2 gap-3">
                   {Object.values(TemplateStyle).map((style) => (
                     <button key={style} onClick={() => setTemplate(style)} className={`py-2 px-1 text-[10px] font-black uppercase rounded-lg border-2 transition-all ${template === style ? 'bg-indigo-600 text-white border-indigo-600 shadow-md scale-105' : 'bg-white text-gray-400 border-gray-100 hover:border-indigo-200'}`}>
                        {style}
                     </button>
                   ))}
                 </div>
              </div>
            </div>
          </aside>

          <main className="lg:col-span-2 bg-white rounded-2xl border border-gray-200 p-6 flex flex-col shadow-sm min-h-[600px]">
            <div className="flex flex-col gap-6 mb-8 border-b border-gray-100 pb-6">
               <div className="flex justify-between items-center">
                  <h2 className="text-xl font-black text-gray-800 tracking-tight uppercase">Workspace <span className="text-indigo-500 ml-2 font-normal text-sm lowercase italic">({products.length} modele disponibile)</span></h2>
                  <div className="flex gap-2">
                     <button onClick={selectAll} className="px-3 py-1.5 bg-indigo-50 text-indigo-700 text-[10px] font-black uppercase rounded-lg hover:bg-indigo-100 transition-colors">Selectează Tot</button>
                     <button onClick={deselectAll} className="px-3 py-1.5 bg-gray-50 text-gray-600 text-[10px] font-black uppercase rounded-lg hover:bg-gray-100 transition-colors">Resetează</button>
                  </div>
               </div>
               <div className="relative">
                  <i className="fa-solid fa-magnifying-glass absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"></i>
                  <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Caută model, cod sau furnizor..." className="w-full pl-12 pr-4 py-3.5 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-indigo-500 transition-all font-medium text-gray-700" />
               </div>
            </div>

            <div className="flex-1 overflow-y-auto space-y-4 max-h-[800px] pr-2 custom-scrollbar">
               {isSyncing && products.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-indigo-500 py-20">
                     <i className="fa-solid fa-spinner fa-spin text-4xl mb-4"></i>
                     <p className="font-bold animate-pulse">Se încarcă produsele din API...</p>
                  </div>
               ) : filteredProducts.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-gray-300 italic py-20">
                     <i className="fa-solid fa-layer-group text-6xl mb-4 opacity-10"></i>
                     <p>Niciun rezultat găsit</p>
                  </div>
               ) : (
                  filteredProducts.map((p) => {
                    const qty = selectedQuantities[p.id] || 0;
                    const isSelected = qty > 0;
                    return (
                      <div key={p.id} className={`flex items-center gap-4 p-4 rounded-2xl border transition-all group ${isSelected ? 'bg-indigo-50/30 border-indigo-100 shadow-sm' : 'bg-white border-gray-100 hover:border-indigo-100'}`}>
                          <input 
                            type="checkbox" 
                            checked={isSelected} 
                            onChange={() => toggleProductSelection(p.id)} 
                            className="w-6 h-6 rounded-lg text-indigo-600 focus:ring-indigo-500 cursor-pointer border-gray-300" 
                          />
                          <div className="flex-1 min-w-0" onClick={() => !isSelected && toggleProductSelection(p.id)}>
                             <p className="font-black text-gray-900 truncate uppercase tracking-tight leading-none">{p.modelName}</p>
                             <div className="flex gap-3 text-[10px] font-bold text-gray-400 uppercase mt-1.5">
                                <span className="text-indigo-500 font-mono tracking-tighter flex items-center gap-1"><i className="fa-solid fa-barcode text-[8px]"></i>{p.code}</span>
                                <span>•</span>
                                <span className="text-emerald-600">{p.price} {p.currency}</span>
                                <span>•</span>
                                <span className="bg-gray-100 px-1.5 rounded text-gray-500">{p.material}</span>
                             </div>
                          </div>
                          <div className={`flex items-center gap-2 bg-white border rounded-xl p-1 transition-all ${isSelected ? 'border-indigo-200 opacity-100' : 'border-gray-100 opacity-30 group-hover:opacity-100'}`}>
                             <button onClick={() => updateQuantity(p.id, -1)} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-50 text-gray-400 hover:text-red-500 transition-colors"><i className="fa-solid fa-minus text-xs"></i></button>
                             <span className={`w-8 text-center font-black text-sm ${isSelected ? 'text-indigo-600' : 'text-gray-400'}`}>{qty}</span>
                             <button onClick={() => updateQuantity(p.id, 1)} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-50 text-gray-400 hover:text-indigo-600 transition-colors"><i className="fa-solid fa-plus text-xs"></i></button>
                          </div>
                          <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                             <button onClick={(e) => { e.stopPropagation(); setEditingProduct(p); }} className="w-9 h-9 flex items-center justify-center rounded-xl bg-white text-indigo-500 shadow-sm border border-indigo-50 hover:bg-indigo-500 hover:text-white transition-all"><i className="fa-solid fa-pen-to-square"></i></button>
                             <button onClick={(e) => { e.stopPropagation(); cloneProduct(p); }} className="w-9 h-9 flex items-center justify-center rounded-xl bg-white text-emerald-500 shadow-sm border border-emerald-50 hover:bg-emerald-500 hover:text-white transition-all"><i className="fa-solid fa-copy"></i></button>
                             <button onClick={(e) => { e.stopPropagation(); removeProduct(p.id); }} className="w-9 h-9 flex items-center justify-center rounded-xl bg-white text-red-500 shadow-sm border border-red-50 hover:bg-red-500 hover:text-white transition-all"><i className="fa-solid fa-trash"></i></button>
                          </div>
                      </div>
                    );
                  })
               )}
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

export default App;

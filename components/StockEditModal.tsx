import React, { useState, useEffect } from 'react';
import { StockItem } from '../types';
import { generateEAN13 } from '../services/productUtils';
import { X, Save, Trash2 } from 'lucide-react';
import CreatableSelect from './CreatableSelect';

interface StockEditModalProps {
    product: StockItem | null;
    isNew: boolean;
    onClose: () => void;
    onSave: (product: StockItem, originalProductCode?: string) => void;
    onDelete?: (productCode: string) => void;
    options?: {
        furnizor: string[];
        material: string[];
        woodColor: string[];
        sidesType: string[];
        um: string[];
        vatRate: string[];
    };
}

const StockEditModal: React.FC<StockEditModalProps> = ({ product, isNew, onClose, onSave, onDelete, options }) => {
    // Default empty product matching the new StockItem structure
    const defaultProduct: StockItem = {
        "Denumire produs": "",
        "Cod produs": "",
        "Pret": 0,
        "Pretul contine TVA (DA/NU)": "DA",
        "Unitate masura": "BUC",
        "UM in SPV": "H87",
        "Moneda": "RON",
        "Cota TVA": 19,
        "Descriere": "",
        "ID": "",
        "Cod NC": "",
        "Cod CPV": "",
        "Garantie SGR (DA/NU)": "NU",
        "Grup produse": "",
        "Stoc": 0
    };

    const [formData, setFormData] = useState<any>(defaultProduct);
    const [originalCode, setOriginalCode] = useState("");

    // UI Helpers for parsed description
    const [uiFields, setUiFields] = useState({
        furnizor: "",
        material: "BRAD",
        woodColor: "NUC",
        size: "L",
        weight: ""
    });

    useEffect(() => {
        if (product) {
            setFormData(product);
            setOriginalCode(product["Cod produs"]);

            // Try to parse description if exists
            const lines = (product["Descriere"] || "").split('\n').map(l => l.trim());
            setUiFields({
                furnizor: lines[0] || "",
                material: lines[1] || "BRAD",
                woodColor: lines[2] || "NUC",
                size: lines[3] || "L",
                weight: lines[4] || ""
            });
        } else {
            setFormData(defaultProduct);
            setOriginalCode("");
        }
    }, [product]);

    const handleChange = (field: keyof StockItem, value: any) => {
        setFormData((prev: any) => ({ ...prev, [field]: value }));
    };

    const handleUiChange = (field: keyof typeof uiFields, value: string) => {
        setUiFields(prev => ({ ...prev, [field]: value }));
    };

    const handleNumberChange = (field: keyof StockItem, value: string) => {
        if (value === "") {
            handleChange(field, "");
            return;
        }
        const num = parseFloat(value);
        handleChange(field, isNaN(num) ? value : num);
    };

    const handleGenerateEAN13 = () => {
        const fullCode = generateEAN13();
        handleChange("Cod produs", fullCode);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        // Construct the 5-line description from UI fields
        const desc = [
            uiFields.furnizor,
            uiFields.material,
            uiFields.woodColor,
            uiFields.size,
            uiFields.weight
        ].join('\n');

        const finalData = {
            ...formData,
            "Descriere": desc
        };

        // Ensure numbers are numbers
        ["Stoc", "Pret", "Cota TVA"].forEach(field => {
            if (typeof finalData[field] === 'string') {
                finalData[field] = parseFloat(finalData[field]) || 0;
            }
        });

        onSave(finalData as StockItem, originalCode);
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-slate-900 border border-slate-700 w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-xl shadow-2xl">
                <div className="sticky top-0 bg-slate-900 border-b border-slate-800 p-4 flex justify-between items-center z-10">
                    <div className="flex flex-col">
                        <h2 className="text-xl font-bold text-white">
                            {isNew ? 'Adaugă Produs Nou (Format Oblio)' : 'Editare Produs (Format Oblio)'}
                        </h2>
                        {product?.lastEdit && (
                            <span className="text-xs text-slate-500 italic">
                                Ultima editare: {product.lastEdit}
                            </span>
                        )}
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-slate-800 rounded-full text-slate-400 hover:text-white transition-colors">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    {/* Basic Info */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="md:col-span-2">
                            <label className="block text-xs font-medium text-slate-400 mb-1 uppercase tracking-wider">Denumire Produs (sau Model)</label>
                            <input
                                type="text"
                                value={formData["Denumire produs"]}
                                onChange={e => handleChange("Denumire produs", e.target.value)}
                                className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-white focus:ring-2 focus:ring-emerald-500 outline-none"
                                required
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-medium text-slate-400 mb-1 uppercase tracking-wider">Cod Produs (EAN13)</label>
                            <div className="flex gap-2">
                                <input
                                    type="text"
                                    value={formData["Cod produs"]}
                                    onChange={e => handleChange("Cod produs", e.target.value)}
                                    className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-white focus:ring-2 focus:ring-emerald-500 outline-none font-mono"
                                    required
                                />
                                <button type="button" onClick={handleGenerateEAN13} className="px-3 py-2 bg-slate-700 text-slate-300 rounded-lg hover:bg-slate-600 transition-colors text-xs font-bold">GEN</button>
                            </div>
                        </div>

                        <div>
                            <label className="block text-xs font-medium text-slate-400 mb-1 uppercase tracking-wider">Grup Produse / ID Oblio</label>
                            <div className="flex gap-2">
                                <input
                                    type="text"
                                    placeholder="Grup (ex: CRUCI)"
                                    value={formData["Grup produse"] || ""}
                                    onChange={e => handleChange("Grup produse", e.target.value)}
                                    className="w-1/2 bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-white outline-none"
                                />
                                <input
                                    type="text"
                                    placeholder="ID"
                                    value={formData["ID"] || ""}
                                    onChange={e => handleChange("ID", e.target.value)}
                                    className="w-1/2 bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-white outline-none"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Financial Info */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 border-t border-slate-800 pt-4">
                        <div>
                            <label className="block text-xs font-medium text-amber-400 mb-1 uppercase tracking-widest">Preț Vânzare</label>
                            <input
                                type="number"
                                value={formData["Pret"]}
                                onChange={e => handleNumberChange("Pret", e.target.value)}
                                className="w-full bg-amber-900/10 border border-amber-900/30 rounded-lg p-2.5 text-amber-200 focus:ring-2 focus:ring-amber-500 outline-none font-bold"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-slate-400 mb-1 uppercase tracking-wider">Monedă</label>
                            <select
                                value={formData["Moneda"]}
                                onChange={e => handleChange("Moneda", e.target.value)}
                                className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-white outline-none"
                            >
                                <option value="RON">RON</option>
                                <option value="EUR">EUR</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-slate-400 mb-1 uppercase tracking-wider">TVA Inclus</label>
                            <select
                                value={formData["Pretul contine TVA (DA/NU)"]}
                                onChange={e => handleChange("Pretul contine TVA (DA/NU)", e.target.value)}
                                className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-white outline-none"
                            >
                                <option value="DA">DA</option>
                                <option value="NU">NU</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-slate-400 mb-1 uppercase tracking-wider">Cota TVA (%)</label>
                            <input
                                type="number"
                                value={formData["Cota TVA"]}
                                onChange={e => handleNumberChange("Cota TVA", e.target.value)}
                                className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-white outline-none"
                            />
                        </div>
                    </div>

                    {/* Stock & Unit Info */}
                    <div className="grid grid-cols-3 gap-4 border-t border-slate-800 pt-4 text-emerald-400">
                        <div>
                            <label className="block text-xs font-medium text-emerald-500/80 mb-1 uppercase tracking-wider">Stoc Real</label>
                            <input
                                type="number"
                                value={formData["Stoc"]}
                                onChange={e => handleNumberChange("Stoc", e.target.value)}
                                className="w-full bg-emerald-900/10 border border-emerald-900/30 rounded-lg p-2.5 text-emerald-200 outline-none font-black"
                            />
                        </div>
                        <div>
                            <CreatableSelect
                                label="Unitate Măsură"
                                value={formData["Unitate masura"] || "BUC"}
                                onChange={(val) => handleChange("Unitate masura", val)}
                                options={["BUC", "KG", "SET"]}
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-slate-500 mb-1 uppercase tracking-wider">UM in SPV</label>
                            <input
                                type="text"
                                value={formData["UM in SPV"] || "H87"}
                                onChange={e => handleChange("UM in SPV", e.target.value)}
                                className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-slate-300 outline-none text-center font-mono"
                            />
                        </div>
                    </div>

                    {/* DESCRIPTION SPECIFIC FIELDS (Mapped to the 5-line Descriere) */}
                    <div className="bg-slate-800/40 p-4 rounded-xl border border-slate-700/50 space-y-4">
                        <label className="block text-[10px] font-black text-indigo-400 uppercase tracking-[0.2em] mb-2">Configurație Etichetă (Descriere Oblio)</label>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                            <div>
                                <CreatableSelect
                                    label="Furnizor (Linia 1)"
                                    value={uiFields.furnizor}
                                    onChange={(val) => handleUiChange("furnizor", val)}
                                    options={options?.furnizor || []}
                                />
                            </div>
                            <div>
                                <CreatableSelect
                                    label="Material (Linia 2)"
                                    value={uiFields.material}
                                    onChange={(val) => handleUiChange("material", val)}
                                    options={options?.material || ["BRAD", "STEJAR", "FAG"]}
                                />
                            </div>
                            <div>
                                <CreatableSelect
                                    label="Culoare (Linia 3)"
                                    value={uiFields.woodColor}
                                    onChange={(val) => handleUiChange("woodColor", val)}
                                    options={options?.woodColor || ["NUC", "MAHON", "CIREȘ"]}
                                />
                            </div>
                            <div>
                                <CreatableSelect
                                    label="Mărime / Dim. (Linia 4)"
                                    value={uiFields.size}
                                    onChange={(val) => handleUiChange("size", val)}
                                    options={["XL", "L", "M", "S"]}
                                />
                            </div>
                            <div className="md:col-span-2">
                                <label className="block text-[10px] font-bold text-slate-500 mb-1 uppercase">Sarcina Max (Linia 5)</label>
                                <input
                                    type="text"
                                    placeholder="ex: 150 kg"
                                    value={uiFields.weight}
                                    onChange={e => handleUiChange("weight", e.target.value)}
                                    className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-white outline-none text-xs"
                                />
                            </div>
                        </div>
                        <div className="mt-2 text-[10px] text-slate-500 italic">
                            Previzualizare descriere: {uiFields.furnizor} | {uiFields.material} | {uiFields.woodColor} | {uiFields.size} | {uiFields.weight}
                        </div>
                    </div>


                    <div className="flex justify-between pt-6 mt-4 border-t border-slate-800">
                        {!isNew && onDelete ? (
                            <button
                                type="button"
                                onClick={() => {
                                    if (confirm('Sigur doriți să ștergeți acest produs din listă?')) {
                                        onDelete(formData["Cod produs"]);
                                    }
                                }}
                                className="flex items-center justify-center p-2 bg-red-500/10 text-red-400 rounded-lg hover:bg-red-500/20 transition-colors"
                            >
                                <Trash2 className="w-5 h-5" />
                            </button>
                        ) : <div></div>}

                        <div className="flex gap-3">
                            <button type="button" onClick={onClose} className="px-6 py-2 bg-slate-800 text-slate-300 rounded-lg hover:bg-slate-700 transition-colors font-medium">Anulează</button>
                            <button type="submit" className="flex items-center gap-2 px-8 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-500 transition-colors font-bold shadow-lg shadow-emerald-500/20">
                                <Save className="w-4 h-4" /> Salvează în JSON
                            </button>
                        </div>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default StockEditModal;

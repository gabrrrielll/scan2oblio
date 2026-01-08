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
    // Default empty product
    const defaultProduct: StockItem = {
        "Denumire produs": "",
        "Tip": "Marfa",
        "Cod produs": "",
        "Stoc": 0,
        "U.M.": "BUC",
        "Cost achizitie fara TVA": 0,
        "Moneda achizitie": "RON",
        "Pret vanzare": 0,
        "Cota TVA": 19,
        "TVA inclus": "DA",
        "Moneda vanzare": "RON",
        "Furnizor": "",
        "sidesType": "6 LATURI",
        "woodColor": "RESPETĂ",
        "material": "BRAD"
    };

    // We use a local state that allows strings for numbers to handle empty inputs gracefully
    const [formData, setFormData] = useState<any>(defaultProduct);
    const [originalCode, setOriginalCode] = useState("");

    useEffect(() => {
        if (product) {
            setFormData(product);
            setOriginalCode(product["Cod produs"]);
        } else {
            setFormData(defaultProduct);
            setOriginalCode("");
        }
    }, [product]);

    const handleChange = (field: keyof StockItem, value: any) => {
        setFormData((prev: any) => ({ ...prev, [field]: value }));
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
        // Ensure numbers are numbers before saving
        const finalData = { ...formData };
        ["Stoc", "Cost achizitie fara TVA", "Pret vanzare", "Cota TVA"].forEach(field => {
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
                            {isNew ? 'Adaugă Produs Nou' : 'Editare Produs'}
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
                            <label className="block text-xs font-medium text-slate-400 mb-1">Denumire Produs</label>
                            <input
                                type="text"
                                value={formData["Denumire produs"]}
                                onChange={e => handleChange("Denumire produs", e.target.value)}
                                className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-white focus:ring-2 focus:ring-emerald-500 outline-none"
                                required
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-medium text-slate-400 mb-1">Cod Produs</label>
                            <div className="flex gap-2">
                                <input
                                    type="text"
                                    value={formData["Cod produs"]}
                                    onChange={e => handleChange("Cod produs", e.target.value)}
                                    className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-white focus:ring-2 focus:ring-emerald-500 outline-none"
                                    required
                                />
                                <button
                                    type="button"
                                    onClick={handleGenerateEAN13}
                                    title="Generează cod EAN13"
                                    className="px-3 py-2 bg-slate-700 text-slate-300 rounded-lg hover:bg-slate-600 hover:text-white transition-colors text-xs font-bold"
                                >
                                    GEN
                                </button>
                            </div>
                        </div>

                        <div>
                            <label className="block text-xs font-medium text-slate-400 mb-1">Tip</label>
                            <select
                                value={formData["Tip"]}
                                onChange={e => handleChange("Tip", e.target.value)}
                                className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-white focus:ring-2 focus:ring-emerald-500 outline-none"
                            >
                                <option value="Marfa">Marfă</option>
                                <option value="Serviciu">Serviciu</option>
                                <option value="Materie Prima">Materie Primă</option>
                            </select>
                        </div>
                    </div>

                    {/* Stock & Price Info */}
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4 border-t border-slate-800 pt-4">
                        <div>
                            <label className="block text-xs font-medium text-slate-400 mb-1">Stoc</label>
                            <input
                                type="number"
                                value={formData["Stoc"]}
                                onChange={e => handleNumberChange("Stoc", e.target.value)}
                                className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-white focus:ring-2 focus:ring-emerald-500 outline-none"
                            />
                        </div>
                        <div>
                            <CreatableSelect
                                label="U.M."
                                value={formData["U.M."] || ""}
                                onChange={(val) => handleChange("U.M.", val)}
                                options={options?.um || ["BUC", "KG", "M", "L"]}
                            />
                        </div>
                        <div>
                            <CreatableSelect
                                label="Furnizor"
                                value={formData["Furnizor"] || ""}
                                onChange={(val) => handleChange("Furnizor", val)}
                                options={options?.furnizor || []}
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div>
                            <label className="block text-xs font-medium text-slate-400 mb-1">Preț Vânzare</label>
                            <input
                                type="number"
                                value={formData["Pret vanzare"]}
                                onChange={e => handleNumberChange("Pret vanzare", e.target.value)}
                                className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-white focus:ring-2 focus:ring-emerald-500 outline-none bg-emerald-900/10 border-emerald-900/30"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-slate-400 mb-1">Monedă Vânzare</label>
                            <select
                                value={formData["Moneda vanzare"]}
                                onChange={e => handleChange("Moneda vanzare", e.target.value)}
                                className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-white focus:ring-2 focus:ring-emerald-500 outline-none"
                            >
                                <option value="RON">RON</option>
                                <option value="EUR">EUR</option>
                                <option value="USD">USD</option>
                            </select>
                        </div>
                        <div>
                            <CreatableSelect
                                label="Cota TVA (%)"
                                value={String(formData["Cota TVA"])}
                                onChange={(val) => handleNumberChange("Cota TVA", val)}
                                options={options?.vatRate || ["19", "9", "5", "0"]}
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-slate-400 mb-1">TVA Inclus</label>
                            <select
                                value={formData["TVA inclus"]}
                                onChange={e => handleChange("TVA inclus", e.target.value)}
                                className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-white focus:ring-2 focus:ring-emerald-500 outline-none"
                            >
                                <option value="DA">DA</option>
                                <option value="NU">NU</option>
                            </select>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4 border-t border-slate-800 pt-4">
                        <div>
                            <label className="block text-xs font-medium text-slate-400 mb-1">Cost Achiziție (fără TVA)</label>
                            <input
                                type="number"
                                value={formData["Cost achizitie fara TVA"]}
                                onChange={e => handleNumberChange("Cost achizitie fara TVA", e.target.value)}
                                className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-white focus:ring-2 focus:ring-emerald-500 outline-none"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-slate-400 mb-1">Monedă Achiziție</label>
                            <select
                                value={formData["Moneda achizitie"]}
                                onChange={e => handleChange("Moneda achizitie", e.target.value)}
                                className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-white focus:ring-2 focus:ring-emerald-500 outline-none"
                            >
                                <option value="RON">RON</option>
                                <option value="EUR">EUR</option>
                                <option value="USD">USD</option>
                            </select>
                        </div>
                    </div>

                    {/* Specific Props */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 border-t border-slate-800 pt-4">
                        <div>
                            <CreatableSelect
                                label="Sides Type"
                                value={formData["sidesType"] || ""}
                                onChange={(val) => handleChange("sidesType", val)}
                                options={options?.sidesType || []}
                            />
                        </div>
                        <div>
                            <CreatableSelect
                                label="Wood Color"
                                value={formData["woodColor"] || ""}
                                onChange={(val) => handleChange("woodColor", val)}
                                options={options?.woodColor || []}
                            />
                        </div>
                        <div>
                            <CreatableSelect
                                label="Material"
                                value={formData["material"] || ""}
                                onChange={(val) => handleChange("material", val)}
                                options={options?.material || []}
                            />
                        </div>
                    </div>


                    <div className="flex justify-between pt-6 mt-4 border-t border-slate-800">
                        {!isNew && onDelete ? (
                            <button
                                type="button"
                                onClick={() => {
                                    if (confirm('Sigur doriți să ștergeți acest produs dis listă?')) {
                                        onDelete(formData["Cod produs"]);
                                    }
                                }}
                                className="flex items-center justify-center p-2 bg-red-500/10 text-red-400 rounded-lg hover:bg-red-500/20 transition-colors"
                                title="Șterge produsul"
                            >
                                <Trash2 className="w-5 h-5" />
                            </button>
                        ) : <div></div>}

                        <div className="flex gap-3">
                            <button
                                type="submit"
                                className="flex items-center gap-2 px-6 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-500 transition-colors font-medium shadow-lg shadow-emerald-500/20"
                            >
                                <Save className="w-4 h-4" />
                                Salvează
                            </button>
                        </div>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default StockEditModal;

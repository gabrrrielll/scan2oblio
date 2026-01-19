
import React, { useState, useEffect } from 'react';
import { Product, CrossOption } from '../types';

interface EditProductModalProps {
  product: Product;
  onSave: (updatedProduct: Product) => void;
  onClose: () => void;
}

const SIZE_CLASSES = [
  { id: 'S', label: 'SOCIAL (S)', dims: { length: 180, width: 55, height: 45 }, weight: 100 },
  { id: 'M', label: 'STANDARD (M)', dims: { length: 190, width: 60, height: 45 }, weight: 100 },
  { id: 'L', label: 'LARGE (L)', dims: { length: 195, width: 60, height: 50 }, weight: 120 },
  { id: 'XL', label: 'EXTRA LARGE (XL)', dims: { length: 200, width: 65, height: 50 }, weight: 130 },
  { id: 'XXL', label: 'GIANT (XXL)', dims: { length: 210, width: 75, height: 55 }, weight: 150 },
];

export const EditProductModal: React.FC<EditProductModalProps> = ({ product, onSave, onClose }) => {
  const [formData, setFormData] = useState<Product>({ ...product });
  const [accessoriesText, setAccessoriesText] = useState(product.accessories.join(', '));

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    if (name.includes('.')) {
      const [parent, child] = name.split('.');
      setFormData(prev => ({
        ...prev,
        [parent]: {
          ...(prev[parent as keyof Product] as any),
          [child]: (name.startsWith('dimensions.') || name.startsWith('weight')) ? Number(value) : value
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: (name === 'price' || name === 'accessoriesPrice' || name === 'crucifixPrice' || name.startsWith('weight')) ? Number(value) : value
      }));
    }
  };

  const handleSizeClassSelect = (classId: string) => {
    const selected = SIZE_CLASSES.find(c => c.id === classId);
    if (selected) {
      setFormData(prev => ({
        ...prev,
        sizeClass: classId,
        dimensions: { ...selected.dims },
        weightCapacityMax: selected.weight
      }));
    }
  };

  const handleCrossOptionChange = (index: number, field: keyof CrossOption, value: string | number) => {
    const newOptions = [...formData.crossOptions];
    newOptions[index] = { ...newOptions[index], [field]: field === 'price' ? Number(value) : value };
    setFormData(prev => ({ ...prev, crossOptions: newOptions }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const updatedProduct = {
      ...formData,
      accessories: accessoriesText.split(',').map(s => s.trim()).filter(s => s !== '')
    };
    onSave(updatedProduct);
  };

  const inputClasses = "w-full bg-gray-50 text-gray-900 border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:bg-white outline-none transition-all";
  const labelClasses = "block text-xs font-bold text-gray-500 mb-1 uppercase tracking-wider";

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-4xl max-h-[90vh] overflow-hidden rounded-2xl shadow-2xl flex flex-col animate-in zoom-in-95 duration-200">
        <header className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
          <div className="flex items-center gap-3">
             <div className="bg-blue-600 text-white w-10 h-10 rounded-lg flex items-center justify-center shadow-md">
                <i className="fa-solid fa-pen-nib text-lg"></i>
             </div>
             <div>
                <h2 className="text-xl font-bold text-gray-800">Editare Etichetă</h2>
                <p className="text-xs text-gray-500 font-medium">Model: {product.modelName} • Cod: {product.code}</p>
             </div>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors p-2 hover:bg-gray-100 rounded-full">
            <i className="fa-solid fa-xmark text-2xl"></i>
          </button>
        </header>

        <form onSubmit={handleSubmit} className="overflow-y-auto p-6 space-y-8 bg-white">
          
          {/* Sectiune 1: Identificare si Pret */}
          <section>
            <div className="flex items-center justify-between mb-4 border-b border-gray-100 pb-2">
                <h3 className="text-sm font-black text-blue-600 uppercase tracking-widest flex items-center gap-2">
                <i className="fa-solid fa-tag"></i> Date Generale
                </h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className={labelClasses}>Nume Model</label>
                <input type="text" name="modelName" value={formData.modelName} onChange={handleChange} className={inputClasses} required />
              </div>
              <div>
                <label className={labelClasses}>Cod EAN / Bare</label>
                <input type="text" name="code" value={formData.code} onChange={handleChange} className={inputClasses} required />
              </div>
              <div>
                <label className={labelClasses}>Preț ({formData.currency})</label>
                <input type="number" name="price" value={formData.price} onChange={handleChange} className={`${inputClasses} font-bold text-blue-700`} required />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-4">
              <div>
                <label className={labelClasses}>Tip Laturi</label>
                <input type="text" name="sidesType" value={formData.sidesType} onChange={handleChange} className={inputClasses} />
              </div>
              <div>
                <label className={labelClasses}>Culoare Lemn</label>
                <input type="text" name="woodColor" value={formData.woodColor} onChange={handleChange} className={inputClasses} />
              </div>
              <div>
                <label className={labelClasses}>Material</label>
                <input type="text" name="material" value={formData.material} onChange={handleChange} className={`${inputClasses} font-bold`} />
              </div>
              <div>
                <label className={labelClasses}>Furnizor</label>
                <input type="text" name="furnizor" value={formData.furnizor} onChange={handleChange} className={inputClasses} />
              </div>
            </div>
          </section>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Sectiune 2: Interior */}
            <section>
              <h3 className="text-sm font-black text-emerald-600 uppercase tracking-widest mb-4 flex items-center gap-2 border-b border-gray-100 pb-2">
                <i className="fa-solid fa-couch"></i> Interior & Accesorii
              </h3>
              <div className="space-y-4">
                <div>
                  <label className={labelClasses}>Tip Capitonaj Capac</label>
                  <input type="text" name="lidFeature" value={formData.lidFeature} onChange={handleChange} className={`${inputClasses} font-medium`} />
                </div>
                <div>
                  <label className={labelClasses}>Accesorii (separate prin virgulă)</label>
                  <textarea value={accessoriesText} onChange={(e) => setAccessoriesText(e.target.value)} rows={3} className={`${inputClasses} resize-none`} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className={labelClasses}>Preț Accesorii Extra</label>
                    <input type="number" name="accessoriesPrice" value={formData.accessoriesPrice} onChange={handleChange} className={inputClasses} />
                  </div>
                  <div>
                    <label className={labelClasses}>Preț Crucifix</label>
                    <input type="number" name="crucifixPrice" value={formData.crucifixPrice} onChange={handleChange} className={inputClasses} />
                  </div>
                </div>
              </div>
            </section>

            {/* Sectiune 3: Cruce */}
            <section>
              <h3 className="text-sm font-black text-amber-600 uppercase tracking-widest mb-4 flex items-center gap-2 border-b border-gray-100 pb-2">
                <i className="fa-solid fa-cross"></i> Opțiuni Cruce
              </h3>
              <div className="space-y-3">
                {formData.crossOptions.map((opt, i) => (
                  <div key={i} className="flex gap-2 group">
                    <input type="text" value={opt.type} onChange={(e) => handleCrossOptionChange(i, 'type', e.target.value)} className={`${inputClasses} flex-1 py-1.5 text-sm`} placeholder="Tip Lemn" />
                    <input type="number" value={opt.price} onChange={(e) => handleCrossOptionChange(i, 'price', e.target.value)} className={`${inputClasses} w-24 py-1.5 text-sm font-bold`} placeholder="Pret" />
                  </div>
                ))}
              </div>
            </section>
          </div>

          {/* Sectiune 4: Dimensiuni si Foto */}
          <section className="bg-gray-50 p-5 rounded-2xl border border-gray-200 shadow-inner">
            <div className="flex items-center justify-between mb-4 border-b border-gray-200/50 pb-2">
                <h3 className="text-sm font-black text-slate-600 uppercase tracking-widest flex items-center gap-2">
                    <i className="fa-solid fa-ruler-combined"></i> Dimensiuni & Imagine
                </h3>
                <div className="flex items-center gap-2 bg-white/60 p-1.5 rounded-xl border border-gray-200 shadow-sm">
                    <span className="text-[10px] font-bold text-gray-400 uppercase ml-1">Configurare Rapidă:</span>
                    <div className="flex gap-1">
                        {SIZE_CLASSES.map((c) => (
                            <button
                                key={c.id}
                                type="button"
                                onClick={() => handleSizeClassSelect(c.id)}
                                title={c.label}
                                className={`px-2.5 py-1 text-[11px] font-black rounded-lg transition-all ${
                                    formData.sizeClass === c.id 
                                    ? 'bg-blue-600 text-white shadow-md scale-105' 
                                    : 'text-gray-500 hover:text-blue-600 hover:bg-white'
                                }`}
                            >
                                {c.id}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className={labelClasses}>Lungime (cm)</label>
                <input type="number" name="dimensions.length" value={formData.dimensions.length} onChange={handleChange} className={inputClasses} />
              </div>
              <div>
                <label className={labelClasses}>Lățime (cm)</label>
                <input type="number" name="dimensions.width" value={formData.dimensions.width} onChange={handleChange} className={inputClasses} />
              </div>
              <div>
                <label className={labelClasses}>Înălțime (cm)</label>
                <input type="number" name="dimensions.height" value={formData.dimensions.height} onChange={handleChange} className={inputClasses} />
              </div>
              <div>
                <label className={labelClasses}>Greutate Max (kg)</label>
                <input type="number" name="weightCapacityMax" value={formData.weightCapacityMax} onChange={handleChange} className={`${inputClasses} font-bold text-slate-700`} />
              </div>
            </div>
            <div className="mt-4">
                <label className={labelClasses}>URL Imagine Produs</label>
                <div className="flex gap-2">
                    <input type="text" name="imageUrl" value={formData.imageUrl || ''} onChange={handleChange} placeholder="https://..." className={`${inputClasses} text-xs text-blue-600 flex-1`} />
                    {formData.imageUrl && (
                        <div className="w-10 h-10 rounded border bg-white flex items-center justify-center overflow-hidden shrink-0 shadow-sm">
                            <img src={formData.imageUrl} alt="Thumb" className="w-full h-full object-contain" />
                        </div>
                    )}
                </div>
            </div>
          </section>
        </form>

        <footer className="px-6 py-4 border-t border-gray-100 flex justify-between items-center bg-gray-50/50">
          <div className="text-xs text-gray-400 font-medium italic">
            * Modificările sunt salvate doar în sesiunea curentă.
          </div>
          <div className="flex gap-3">
            <button type="button" onClick={onClose} className="px-5 py-2 text-sm font-bold text-gray-500 hover:text-gray-700 transition-colors uppercase tracking-wider">
              ANULEAZĂ
            </button>
            <button onClick={handleSubmit} className="px-8 py-2 bg-blue-600 text-white rounded-xl text-sm font-bold shadow-lg hover:bg-blue-700 transition-all hover:scale-[1.02] active:scale-95 uppercase tracking-wider">
              SALVEAZĂ MODIFICĂRILE
            </button>
          </div>
        </footer>
      </div>
    </div>
  );
};

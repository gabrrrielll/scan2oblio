import React, { useState } from 'react';
import { OblioProduct } from '../types';
import { X, Search, Package, AlertCircle } from 'lucide-react';

interface InventoryModalProps {
  inventory: OblioProduct[];
  onClose: () => void;
}

const InventoryModal: React.FC<InventoryModalProps> = ({ inventory, onClose }) => {
  const [search, setSearch] = useState('');

  const filtered = inventory.filter(p => 
    p.name.toLowerCase().includes(search.toLowerCase()) || 
    p.code?.includes(search) ||
    p.productCode?.includes(search)
  );

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-slate-900 rounded-xl border border-slate-700 w-full max-w-lg max-h-[80vh] flex flex-col shadow-2xl">
        
        {/* Header */}
        <div className="p-4 border-b border-slate-800 flex justify-between items-center bg-slate-900 rounded-t-xl sticky top-0 z-10">
          <div className="flex items-center gap-2">
            <Package className="w-5 h-5 text-emerald-400" />
            <h2 className="text-lg font-bold text-white">Inventar Oblio</h2>
            <span className="text-xs bg-slate-800 text-slate-400 px-2 py-0.5 rounded-full border border-slate-700">{inventory.length}</span>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-800 rounded-full text-slate-400 hover:text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search */}
        <div className="p-4 pb-2 bg-slate-900">
            <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input 
                    type="text" 
                    placeholder="Caută după nume sau cod..." 
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-9 pr-4 py-3 text-sm text-white focus:outline-none focus:border-emerald-500/50 transition-colors"
                />
            </div>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2 custom-scrollbar bg-slate-900 rounded-b-xl">
            {filtered.length === 0 ? (
                <div className="text-center py-12 text-slate-500 text-sm flex flex-col items-center gap-2">
                    <Search className="w-8 h-8 opacity-20" />
                    <p>Nu s-au găsit produse.</p>
                </div>
            ) : (
                filtered.map((item, idx) => (
                    <div key={idx} className="bg-slate-800/40 p-3 rounded-lg border border-slate-800 hover:border-slate-700 transition-colors flex justify-between items-center group">
                        <div className="flex-1 pr-4">
                            <div className="font-medium text-slate-200 text-sm leading-tight mb-1">{item.name}</div>
                            <div className="flex items-center gap-2 flex-wrap">
                                {item.code && item.code.trim() !== '' && (
                                    <>
                                        <span className="text-[10px] bg-slate-900 text-slate-400 px-1.5 py-0.5 rounded font-mono border border-slate-800">CPV: {item.code}</span>
                                        {item.productCode && item.productCode.trim() !== '' && <span className="text-xs text-slate-500">|</span>}
                                    </>
                                )}
                                {item.productCode && item.productCode.trim() !== '' && (
                                    <span className="text-[10px] bg-emerald-900/30 text-emerald-300 px-1.5 py-0.5 rounded font-mono border border-emerald-700/50">EAN: {item.productCode}</span>
                                )}
                                {(item.code && item.code.trim() !== '') || (item.productCode && item.productCode.trim() !== '') ? (
                                    <span className="text-xs text-slate-500">|</span>
                                ) : null}
                                <span className="text-xs text-slate-400">{item.measuringUnit}</span>
                            </div>
                        </div>
                        <div className="text-right flex flex-col items-end gap-1">
                             <div className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider border ${
                                 item.stock > 0 
                                 ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' 
                                 : 'bg-red-500/10 text-red-400 border-red-500/20'
                             }`}>
                                {item.stock > 0 ? `${item.stock} STOC` : 'STOC 0'}
                             </div>
                             <div className="text-sm font-semibold text-white">{item.price} <span className="text-[10px] text-slate-400 font-normal">RON</span></div>
                        </div>
                    </div>
                ))
            )}
        </div>
      </div>
    </div>
  );
};

export default InventoryModal;

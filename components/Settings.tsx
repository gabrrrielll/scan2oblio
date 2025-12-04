import React, { useState } from 'react';
import { OblioConfig } from '../types';
import { Save, Lock, AlertCircle } from 'lucide-react';

interface SettingsProps {
  config: OblioConfig;
  onSave: (config: OblioConfig) => void;
  onClose: () => void;
}

const Settings: React.FC<SettingsProps> = ({ config, onSave, onClose }) => {
  const [formData, setFormData] = useState<OblioConfig>(config);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
    onClose();
  };

  return (
    <div className="p-6 bg-slate-800 rounded-lg shadow-xl border border-slate-700 max-w-md w-full mx-auto">
      <div className="flex items-center gap-2 mb-6 text-emerald-400">
        <Lock className="w-6 h-6" />
        <h2 className="text-xl font-bold text-white">Configurare Oblio</h2>
      </div>

      <div className="mb-4 p-3 bg-blue-900/30 border border-blue-800 rounded text-sm text-blue-200 flex gap-2">
        <AlertCircle className="w-5 h-5 shrink-0" />
        <p>Introduceți datele din contul dvs. Oblio (Setări {'>'} API) pentru a permite trimiterea facturilor.</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-slate-400 mb-1">Email Cont Oblio</label>
          <input
            type="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            className="w-full bg-slate-900 border border-slate-700 text-white rounded p-3 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
            placeholder="email@companie.ro"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-400 mb-1">API Secret / Token</label>
          <input
            type="password"
            name="apiSecret"
            value={formData.apiSecret}
            onChange={handleChange}
            className="w-full bg-slate-900 border border-slate-700 text-white rounded p-3 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
            placeholder="Token-ul API din Oblio"
            required
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
            <div>
            <label className="block text-sm font-medium text-slate-400 mb-1">CIF Companie</label>
            <input
                type="text"
                name="cif"
                value={formData.cif}
                onChange={handleChange}
                className="w-full bg-slate-900 border border-slate-700 text-white rounded p-3 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                placeholder="RO123456"
                required
            />
            </div>
            <div>
            <label className="block text-sm font-medium text-slate-400 mb-1">Serie Facturi</label>
            <input
                type="text"
                name="seriesName"
                value={formData.seriesName}
                onChange={handleChange}
                className="w-full bg-slate-900 border border-slate-700 text-white rounded p-3 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                placeholder="Ex: XYZ"
            />
            </div>
        </div>

        <div className="pt-4 flex gap-3">
            <button
                type="button"
                onClick={onClose}
                className="flex-1 py-3 px-4 bg-slate-700 text-white rounded font-medium hover:bg-slate-600 transition-colors"
            >
                Anulează
            </button>
            <button
                type="submit"
                className="flex-1 py-3 px-4 bg-emerald-600 text-white rounded font-medium hover:bg-emerald-500 transition-colors flex items-center justify-center gap-2"
            >
                <Save className="w-4 h-4" />
                Salvează
            </button>
        </div>
      </form>
    </div>
  );
};

export default Settings;
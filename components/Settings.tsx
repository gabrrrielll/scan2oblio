import React, { useState } from 'react';
import { OblioConfig } from '../types';
import { Save, Lock, AlertCircle } from 'lucide-react';
import WorkStationSelector from './WorkStationSelector';

interface SettingsProps {
  config: OblioConfig;
  onSave: (config: OblioConfig) => void;
  onClose: () => void;
}

const SAVED_DATA: OblioConfig = {
  email: 'VALLLLMIH@GMAIL.COM',
  apiSecret: '2d0b545eb566a056355fc3bb2fbb1817a3daaeee',
  cif: '28360867',
  seriesName: 'CFB',
  workStation: 'Sediu'
};

const Settings: React.FC<SettingsProps> = ({ config, onSave, onClose }) => {
  const [useSavedData, setUseSavedData] = useState(false);
  const [formData, setFormData] = useState<OblioConfig>(config);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleToggleSavedData = (checked: boolean) => {
    setUseSavedData(checked);
    if (checked) {
      setFormData(SAVED_DATA);
    } else {
      setFormData(config);
    }
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

      <div className="mb-4 p-3 bg-slate-900 border border-slate-700 rounded-lg">
        <label className="flex items-center justify-between cursor-pointer">
          <span className="text-sm font-medium text-slate-300">Folosește date salvate</span>
          <div className="relative">
            <input
              type="checkbox"
              checked={useSavedData}
              onChange={(e) => handleToggleSavedData(e.target.checked)}
              className="sr-only"
            />
            <div className={`w-11 h-6 rounded-full transition-colors duration-200 ${useSavedData ? 'bg-emerald-600' : 'bg-slate-600'
              }`}>
              <div className={`w-5 h-5 bg-white rounded-full shadow-md transform transition-transform duration-200 ${useSavedData ? 'translate-x-5' : 'translate-x-0.5'
                } mt-0.5`}></div>
            </div>
          </div>
        </label>
        {useSavedData && (
          <p className="text-xs text-slate-400 mt-2">Se vor folosi datele salvate pentru conectare.</p>
        )}
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
            disabled={useSavedData}
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
            disabled={useSavedData}
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
              disabled={useSavedData}
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
              disabled={useSavedData}
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-400 mb-1">Gestiune / Punct de Lucru</label>
          <WorkStationSelector
            config={formData}
            selectedStation={formData.workStation || 'Sediu'}
            onSelect={(val) => setFormData(prev => ({ ...prev, workStation: val }))}
          />
          <p className="text-xs text-slate-500 mt-1">Locația depozitului din care se scad produsele (ex: Sediu, Depozit 1, etc.)</p>
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
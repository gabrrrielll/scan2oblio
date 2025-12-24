import React, { useState } from 'react';
import { X, Save, Building, MapPin, Mail, Phone, CreditCard, User, Loader2 } from 'lucide-react';
import { OblioConfig, OblioClient } from '../types';


interface ClientFormModalProps {
    config: OblioConfig;
    onClose: () => void;
    onSuccess: (newClient: OblioClient) => void;
}

const ClientFormModal: React.FC<ClientFormModalProps> = ({ config, onClose, onSuccess }) => {
    const [formData, setFormData] = useState<Partial<OblioClient>>({
        name: '',
        cif: '',
        rc: '',
        address: '',
        city: '',
        state: '',
        country: 'Romania',
        email: '',
        phone: '',
        iban: '',
        bank: '',
        contact: '',
        vatPayer: false
    });

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [useDefaultCnp, setUseDefaultCnp] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!formData.name?.trim()) {
            setError('Numele este obligatoriu.');
            return;
        }

        if (!useDefaultCnp && !formData.cif?.trim()) {
            setError('CIF-ul este obligatoriu (sau bifați Fără CNP).');
            return;
        }

        setIsSubmitting(true);
        setError(null);

        try {
            // We do not create the client in Oblio via API anymore (Method not accepted)
            // Instead we pass the client data to the invoice creation

            const createdClient: OblioClient = {
                id: `temp_${Date.now()}`, // Temporary ID
                name: formData.name!,
                cif: formData.cif || '',
                rc: formData.rc || '',
                address: formData.address || '',
                city: formData.city || '',
                state: formData.state || '',
                country: formData.country || 'Romania',
                email: formData.email || '',
                phone: formData.phone || '',
                iban: formData.iban || '',
                bank: formData.bank || '',
                contact: formData.contact || '',
                vatPayer: formData.vatPayer || false
            };

            onSuccess(createdClient);
            onClose();
        } catch (err: any) {
            setError(err.message || 'Eroare la procesarea datelor clientului');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleChange = (field: keyof OblioClient, value: any) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    return (
        <div className="fixed inset-0 z-[60] bg-black/80 flex items-center justify-center p-4 overflow-y-auto">
            <div className="bg-slate-900 rounded-xl border border-slate-700 w-full max-w-4xl shadow-2xl flex flex-col max-h-[90vh]">

                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-slate-800 bg-slate-900 sticky top-0 z-10 rounded-t-xl">
                    <div className="flex items-center gap-3">
                        <User className="w-6 h-6 text-emerald-400" />
                        <h2 className="text-xl font-bold text-white">Adaugă Client Nou</h2>
                    </div>
                    <button
                        onClick={onClose}
                        className="text-slate-400 hover:text-white transition-colors p-2 hover:bg-slate-800 rounded-lg"
                    >
                        <X className="w-6 h-6" />
                    </button>
                </div>

                {/* Form Content */}
                <div className="flex-1 overflow-y-auto p-6 space-y-8">

                    {error && (
                        <div className="bg-red-500/10 border border-red-500/50 rounded-lg p-4 text-red-200 text-sm">
                            {error}
                        </div>
                    )}

                    <form id="client-form" onSubmit={handleSubmit} className="space-y-8">

                        {/* Identificare */}
                        <section>
                            <h3 className="text-sm font-semibold text-emerald-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                                <Building className="w-4 h-4" />
                                Date Identificare
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="md:col-span-2">
                                    <label className="block text-sm font-medium text-slate-400 mb-1">Nume Client *</label>
                                    <input
                                        type="text"
                                        value={formData.name}
                                        onChange={(e) => handleChange('name', e.target.value)}
                                        className="w-full bg-slate-800 border border-slate-700 text-white rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-emerald-500 outline-none"
                                        placeholder="Nume Companie sau Persoană"
                                        autoFocus
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-400 mb-1">CIF / CNP *</label>
                                    <input
                                        type="text"
                                        value={formData.cif}
                                        onChange={(e) => handleChange('cif', e.target.value)}
                                        className="w-full bg-slate-800 border border-slate-700 text-white rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-emerald-500 outline-none"
                                        placeholder="RO123456"
                                        disabled={useDefaultCnp}
                                    />
                                    <div className="mt-2 flex items-center gap-2">
                                        <input
                                            type="checkbox"
                                            id="defaultCnp"
                                            checked={useDefaultCnp}
                                            onChange={(e) => {
                                                const checked = e.target.checked;
                                                setUseDefaultCnp(checked);
                                                if (checked) {
                                                    handleChange('cif', '');
                                                }
                                            }}
                                            className="w-4 h-4 rounded border-slate-700 bg-slate-800 text-emerald-500 focus:ring-emerald-500"
                                        />
                                        <label htmlFor="defaultCnp" className="text-xs text-slate-400">Fără CNP / Persoană Fizică</label>
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-400 mb-1">Nr. Reg. Com.</label>
                                    <input
                                        type="text"
                                        value={formData.rc || ''}
                                        onChange={(e) => handleChange('rc', e.target.value)}
                                        className="w-full bg-slate-800 border border-slate-700 text-white rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-emerald-500 outline-none"
                                        placeholder="J40/123/2023"
                                    />
                                </div>
                                <div className="flex items-center gap-2">
                                    <input
                                        type="checkbox"
                                        id="vatPayer"
                                        checked={formData.vatPayer || false}
                                        onChange={(e) => handleChange('vatPayer', e.target.checked)}
                                        className="w-4 h-4 rounded border-slate-700 bg-slate-800 text-emerald-500 focus:ring-emerald-500"
                                    />
                                    <label htmlFor="vatPayer" className="text-sm text-slate-300">Plătitor de TVA</label>
                                </div>
                            </div>
                        </section>

                        {/* Adresă */}
                        <section>
                            <h3 className="text-sm font-semibold text-emerald-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                                <MapPin className="w-4 h-4" />
                                Adresă
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="md:col-span-2">
                                    <label className="block text-sm font-medium text-slate-400 mb-1">Adresă completă</label>
                                    <textarea
                                        value={formData.address || ''}
                                        onChange={(e) => handleChange('address', e.target.value)}
                                        rows={2}
                                        className="w-full bg-slate-800 border border-slate-700 text-white rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-emerald-500 outline-none resize-none"
                                        placeholder="Strada, Număr, Bloc, etc."
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-400 mb-1">Județ</label>
                                    <input
                                        type="text"
                                        value={formData.state || ''}
                                        onChange={(e) => handleChange('state', e.target.value)}
                                        className="w-full bg-slate-800 border border-slate-700 text-white rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-emerald-500 outline-none"
                                        placeholder="București"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-400 mb-1">Oraș</label>
                                    <input
                                        type="text"
                                        value={formData.city || ''}
                                        onChange={(e) => handleChange('city', e.target.value)}
                                        className="w-full bg-slate-800 border border-slate-700 text-white rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-emerald-500 outline-none"
                                        placeholder="Sector 1"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-400 mb-1">Țară</label>
                                    <input
                                        type="text"
                                        value={formData.country || 'Romania'}
                                        onChange={(e) => handleChange('country', e.target.value)}
                                        className="w-full bg-slate-800 border border-slate-700 text-white rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-emerald-500 outline-none"
                                    />
                                </div>
                            </div>
                        </section>

                        {/* Contact */}
                        <section>
                            <h3 className="text-sm font-semibold text-emerald-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                                <Mail className="w-4 h-4" />
                                Contact
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-sm font-medium text-slate-400 mb-1">Email</label>
                                    <input
                                        type="email"
                                        value={formData.email || ''}
                                        onChange={(e) => handleChange('email', e.target.value)}
                                        className="w-full bg-slate-800 border border-slate-700 text-white rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-emerald-500 outline-none"
                                        placeholder="contact@firma.ro"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-400 mb-1">Telefon</label>
                                    <input
                                        type="text"
                                        value={formData.phone || ''}
                                        onChange={(e) => handleChange('phone', e.target.value)}
                                        className="w-full bg-slate-800 border border-slate-700 text-white rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-emerald-500 outline-none"
                                        placeholder="07xxxxxxxx"
                                    />
                                </div>
                                <div className="md:col-span-2">
                                    <label className="block text-sm font-medium text-slate-400 mb-1">Persoană de contact</label>
                                    <input
                                        type="text"
                                        value={formData.contact || ''}
                                        onChange={(e) => handleChange('contact', e.target.value)}
                                        className="w-full bg-slate-800 border border-slate-700 text-white rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-emerald-500 outline-none"
                                        placeholder="Nume Prenume"
                                    />
                                </div>
                            </div>
                        </section>

                        {/* Financiar */}
                        <section>
                            <h3 className="text-sm font-semibold text-emerald-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                                <CreditCard className="w-4 h-4" />
                                Date Financiare
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-sm font-medium text-slate-400 mb-1">Banca</label>
                                    <input
                                        type="text"
                                        value={formData.bank || ''}
                                        onChange={(e) => handleChange('bank', e.target.value)}
                                        className="w-full bg-slate-800 border border-slate-700 text-white rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-emerald-500 outline-none"
                                        placeholder="Nume Bancă"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-400 mb-1">Cont IBAN</label>
                                    <input
                                        type="text"
                                        value={formData.iban || ''}
                                        onChange={(e) => handleChange('iban', e.target.value)}
                                        className="w-full bg-slate-800 border border-slate-700 text-white rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-emerald-500 outline-none"
                                        placeholder="RO00BANC..."
                                    />
                                </div>
                            </div>
                        </section>

                    </form>
                </div>

                {/* Footer */}
                <div className="p-6 border-t border-slate-800 bg-slate-900 sticky bottom-0 z-10 rounded-b-xl flex justify-end gap-3">
                    <button
                        onClick={onClose}
                        disabled={isSubmitting}
                        className="px-6 py-2.5 bg-slate-800 hover:bg-slate-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50"
                    >
                        Anulează
                    </button>
                    <button
                        onClick={handleSubmit}
                        disabled={isSubmitting}
                        className="px-8 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-bold transition-colors disabled:opacity-50 flex items-center gap-2"
                    >
                        {isSubmitting ? (
                            <>
                                <Loader2 className="w-5 h-5 animate-spin" />
                                Se salvează...
                            </>
                        ) : (
                            <>
                                <Save className="w-5 h-5" />
                                Salvează Client
                            </>
                        )}
                    </button>
                </div>

            </div>
        </div>
    );
};

export default ClientFormModal;

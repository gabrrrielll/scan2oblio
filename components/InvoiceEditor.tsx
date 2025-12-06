import React, { useState, useEffect } from 'react';
import { X, Save, User, Calendar, FileText, Package, AlertCircle, Loader2 } from 'lucide-react';
import { OblioConfig, OblioClient, ProductItem, InvoiceFormData, Person } from '../types';
import { getClientsFromOblio, createInvoiceInOblio } from '../services/oblioService';
import PersonSelector from './PersonSelector';

interface InvoiceEditorProps {
    config: OblioConfig;
    initialProducts: ProductItem[];
    onClose: () => void;
    onSuccess: () => void;
}

const InvoiceEditor: React.FC<InvoiceEditorProps> = ({ config, initialProducts, onClose, onSuccess }) => {
    // State pentru clienți
    const [clients, setClients] = useState<OblioClient[]>([]);
    const [isLoadingClients, setIsLoadingClients] = useState(false);
    const [clientSearchTerm, setClientSearchTerm] = useState('');

    // State pentru persoane
    const [selectedIssuer, setSelectedIssuer] = useState<Person | null>(null);
    const [selectedDeputy, setSelectedDeputy] = useState<Person | null>(null);
    const [selectedSalesAgent, setSelectedSalesAgent] = useState<Person | null>(null);

    // State pentru formular
    const [formData, setFormData] = useState<InvoiceFormData>({
        client: null,
        issueDate: new Date().toISOString().split('T')[0],
        dueDate: '',
        deliveryDate: '',
        collectDate: '',
        seriesName: config.seriesName || '',
        workStation: config.workStation || 'Sediu',
        language: 'RO',
        currency: 'RON',
        products: initialProducts,
        mentions: '',
        internalNote: '',
        issuerName: '',
        issuerId: '',
        deputyName: '',
        deputyIdentityCard: '',
        deputyAuto: '',
        salesAgent: '',
        noticeNumber: ''
    });

    const [isSending, setIsSending] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Încarcă clienții la mount
    useEffect(() => {
        loadClients();
    }, []);

    const loadClients = async () => {
        setIsLoadingClients(true);
        setError(null);
        try {
            const clientsData = await getClientsFromOblio(config);
            setClients(clientsData);
        } catch (err: any) {
            setError(err.message || 'Eroare la încărcarea clienților');
        } finally {
            setIsLoadingClients(false);
        }
    };

    // Filtrare clienți după search
    const filteredClients = clients.filter(client =>
        client.name.toLowerCase().includes(clientSearchTerm.toLowerCase()) ||
        client.cif.toLowerCase().includes(clientSearchTerm.toLowerCase())
    );

    const handleClientSelect = (client: OblioClient) => {
        setFormData(prev => ({ ...prev, client }));
        setClientSearchTerm('');
    };

    const handleProductChange = (index: number, field: keyof ProductItem, value: any) => {
        setFormData(prev => ({
            ...prev,
            products: prev.products.map((p, i) =>
                i === index ? { ...p, [field]: value } : p
            )
        }));
    };

    const handleRemoveProduct = (index: number) => {
        setFormData(prev => ({
            ...prev,
            products: prev.products.filter((_, i) => i !== index)
        }));
    };

    const handleSubmit = async () => {
        // Validare
        if (!formData.client) {
            setError('Selectați un client');
            return;
        }

        if (formData.products.length === 0) {
            setError('Adăugați cel puțin un produs');
            return;
        }

        setIsSending(true);
        setError(null);

        try {
            // Prepare invoice data
            const invoiceData = {
                client: formData.client ? {
                    cif: formData.client.cif,
                    name: formData.client.name,
                    rc: formData.client.rc || '',
                    address: formData.client.address || '',
                    city: formData.client.city || '',
                    state: formData.client.state || '',
                    country: formData.client.country || '',
                    email: formData.client.email || '',
                    phone: formData.client.phone || '',
                    iban: formData.client.iban || '',
                    bank: formData.client.bank || '',
                    contact: formData.client.contact || '',
                    vatPayer: formData.client.vatPayer || false
                } : undefined,
                issueDate: formData.issueDate,
                dueDate: formData.dueDate || undefined,
                deliveryDate: formData.deliveryDate || undefined,
                collectDate: formData.collectDate || undefined,
                seriesName: formData.seriesName,
                workStation: formData.workStation,
                language: formData.language,
                currency: formData.currency,
                products: formData.products,
                mentions: formData.mentions || undefined,
                internalNote: formData.internalNote || undefined,
                issuerName: formData.issuerName || undefined,
                issuerId: formData.issuerId || undefined,
                deputyName: formData.deputyName || undefined,
                deputyIdentityCard: formData.deputyIdentityCard || undefined,
                deputyAuto: formData.deputyAuto || undefined,
                salesAgent: formData.salesAgent || undefined,
                noticeNumber: formData.noticeNumber || undefined
            };

            // Debug: Log invoice data to check deliveryDate
            console.log('=== INVOICE DATA BEING SENT ===');
            console.log('deliveryDate:', invoiceData.deliveryDate);
            console.log('Full invoice data:', invoiceData);

            await createInvoiceInOblio(config, invoiceData);
            onSuccess();
        } catch (err: any) {
            setError(err.message || 'Eroare la trimiterea facturii');
        } finally {
            setIsSending(false);
        }
    };

    const calculateTotal = () => {
        return formData.products.reduce((sum, p) => sum + (p.price * p.quantity), 0).toFixed(2);
    };

    return (
        <div className="fixed inset-0 z-50 bg-slate-900 overflow-y-auto">
            {/* Header */}
            <div className="sticky top-0 z-10 bg-slate-900/95 backdrop-blur-md border-b border-slate-700 px-6 py-4">
                <div className="max-w-5xl mx-auto flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <FileText className="w-6 h-6 text-emerald-400" />
                        <h1 className="text-2xl font-bold text-white">Creare Factură</h1>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-slate-800 rounded-full transition-colors text-slate-400 hover:text-white"
                    >
                        <X className="w-6 h-6" />
                    </button>
                </div>
            </div>

            {/* Content */}
            <div className="max-w-5xl mx-auto px-6 py-8 space-y-8">

                {/* Error Banner */}
                {error && (
                    <div className="bg-red-500/10 border border-red-500/50 rounded-xl p-4 flex items-start gap-3">
                        <AlertCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
                        <div className="flex-1">
                            <p className="text-red-200 text-sm">{error}</p>
                        </div>
                        <button onClick={() => setError(null)} className="text-red-400 hover:text-red-300">
                            <X className="w-4 h-4" />
                        </button>
                    </div>
                )}

                {/* Client Section */}
                <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
                    <div className="flex items-center gap-2 mb-4">
                        <User className="w-5 h-5 text-emerald-400" />
                        <h2 className="text-lg font-bold text-white">Client</h2>
                    </div>

                    {formData.client ? (
                        <div className="bg-slate-900 rounded-lg p-4 border border-slate-700">
                            <div className="flex items-start justify-between">
                                <div className="space-y-2">
                                    <h3 className="font-semibold text-white text-lg">{formData.client.name}</h3>
                                    <div className="grid grid-cols-2 gap-x-6 gap-y-1 text-sm">
                                        <div><span className="text-slate-400">CIF:</span> <span className="text-white">{formData.client.cif}</span></div>
                                        {formData.client.rc && <div><span className="text-slate-400">RC:</span> <span className="text-white">{formData.client.rc}</span></div>}
                                        {formData.client.address && <div className="col-span-2"><span className="text-slate-400">Adresă:</span> <span className="text-white">{formData.client.address}</span></div>}
                                        {formData.client.city && <div><span className="text-slate-400">Oraș:</span> <span className="text-white">{formData.client.city}</span></div>}
                                        {formData.client.email && <div><span className="text-slate-400">Email:</span> <span className="text-white">{formData.client.email}</span></div>}
                                        {formData.client.phone && <div><span className="text-slate-400">Telefon:</span> <span className="text-white">{formData.client.phone}</span></div>}
                                    </div>
                                </div>
                                <button
                                    onClick={() => setFormData(prev => ({ ...prev, client: null }))}
                                    className="text-slate-400 hover:text-white transition-colors"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            <input
                                type="text"
                                placeholder="Caută client după nume sau CIF..."
                                value={clientSearchTerm}
                                onChange={(e) => setClientSearchTerm(e.target.value)}
                                className="w-full bg-slate-900 border border-slate-700 text-white rounded-lg px-4 py-3 focus:ring-2 focus:ring-emerald-500 outline-none"
                            />

                            {isLoadingClients ? (
                                <div className="flex items-center justify-center py-8">
                                    <Loader2 className="w-6 h-6 text-emerald-400 animate-spin" />
                                    <span className="ml-2 text-slate-400">Se încarcă clienții...</span>
                                </div>
                            ) : clientSearchTerm && filteredClients.length > 0 ? (
                                <div className="max-h-64 overflow-y-auto space-y-2 bg-slate-900 rounded-lg border border-slate-700 p-2">
                                    {filteredClients.map(client => (
                                        <button
                                            key={client.id}
                                            onClick={() => handleClientSelect(client)}
                                            className="w-full text-left px-4 py-3 hover:bg-slate-800 rounded-lg transition-colors"
                                        >
                                            <div className="font-semibold text-white">{client.name}</div>
                                            <div className="text-sm text-slate-400">CIF: {client.cif}</div>
                                        </button>
                                    ))}
                                </div>
                            ) : clientSearchTerm ? (
                                <div className="text-center py-8 text-slate-400">
                                    Nu s-au găsit clienți
                                </div>
                            ) : null}
                        </div>
                    )}
                </div>

                {/* Invoice Details Section */}
                <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
                    <div className="flex items-center gap-2 mb-4">
                        <Calendar className="w-5 h-5 text-emerald-400" />
                        <h2 className="text-lg font-bold text-white">Detalii Factură</h2>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-400 mb-1">Data Emiterii *</label>
                            <input
                                type="date"
                                value={formData.issueDate}
                                onChange={(e) => setFormData(prev => ({ ...prev, issueDate: e.target.value }))}
                                className="w-full bg-slate-900 border border-slate-700 text-white rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-emerald-500 outline-none"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-400 mb-1">Data Scadență</label>
                            <input
                                type="date"
                                value={formData.dueDate}
                                onChange={(e) => setFormData(prev => ({ ...prev, dueDate: e.target.value }))}
                                className="w-full bg-slate-900 border border-slate-700 text-white rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-emerald-500 outline-none"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-400 mb-1">Data Livrare</label>
                            <input
                                type="date"
                                value={formData.deliveryDate}
                                onChange={(e) => setFormData(prev => ({ ...prev, deliveryDate: e.target.value }))}
                                className="w-full bg-slate-900 border border-slate-700 text-white rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-emerald-500 outline-none"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-400 mb-1">Serie Factură</label>
                            <input
                                type="text"
                                value={formData.seriesName}
                                onChange={(e) => setFormData(prev => ({ ...prev, seriesName: e.target.value }))}
                                className="w-full bg-slate-900 border border-slate-700 text-white rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-emerald-500 outline-none"
                                placeholder="Ex: FCT"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-400 mb-1">Gestiune</label>
                            <input
                                type="text"
                                value={formData.workStation}
                                onChange={(e) => setFormData(prev => ({ ...prev, workStation: e.target.value }))}
                                className="w-full bg-slate-900 border border-slate-700 text-white rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-emerald-500 outline-none"
                                placeholder="Sediu"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-400 mb-1">Limba</label>
                            <select
                                value={formData.language}
                                onChange={(e) => setFormData(prev => ({ ...prev, language: e.target.value }))}
                                className="w-full bg-slate-900 border border-slate-700 text-white rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-emerald-500 outline-none"
                            >
                                <option value="RO">Română</option>
                                <option value="EN">Engleză</option>
                                <option value="FR">Franceză</option>
                                <option value="DE">Germană</option>
                            </select>
                        </div>
                    </div>

                    {/* Additional Fields - Person Selectors */}
                    <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Issuer */}
                        <div className="md:col-span-2">
                            <PersonSelector
                                type="issuer"
                                label="Emitent"
                                value={selectedIssuer}
                                onChange={(person) => {
                                    setSelectedIssuer(person);
                                    setFormData(prev => ({
                                        ...prev,
                                        issuerName: person?.name || '',
                                        issuerId: person?.cnp || ''
                                    }));
                                }}
                                onFieldsChange={(fields) => {
                                    setFormData(prev => ({ ...prev, ...fields }));
                                }}
                                placeholder="Selectează emitent sau adaugă nou..."
                            />
                        </div>

                        {/* Deputy */}
                        <div className="md:col-span-2">
                            <PersonSelector
                                type="deputy"
                                label="Delegat"
                                value={selectedDeputy}
                                onChange={(person) => {
                                    setSelectedDeputy(person);
                                    setFormData(prev => ({
                                        ...prev,
                                        deputyName: person?.name || '',
                                        deputyIdentityCard: person?.identityCard || '',
                                        deputyAuto: person?.auto || ''
                                    }));
                                }}
                                onFieldsChange={(fields) => {
                                    setFormData(prev => ({ ...prev, ...fields }));
                                }}
                                placeholder="Selectează delegat sau adaugă nou..."
                            />
                        </div>

                        {/* Sales Agent */}
                        <div className="md:col-span-2">
                            <PersonSelector
                                type="salesAgent"
                                label="Agent Vânzări"
                                value={selectedSalesAgent}
                                onChange={(person) => {
                                    setSelectedSalesAgent(person);
                                    setFormData(prev => ({
                                        ...prev,
                                        salesAgent: person?.name || ''
                                    }));
                                }}
                                onFieldsChange={(fields) => {
                                    setFormData(prev => ({ ...prev, ...fields }));
                                }}
                                placeholder="Selectează agent vânzări sau adaugă nou..."
                            />
                        </div>
                    </div>

                    {/* Notes */}
                    <div className="mt-4 space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-400 mb-1">Mențiuni</label>
                            <textarea
                                value={formData.mentions}
                                onChange={(e) => setFormData(prev => ({ ...prev, mentions: e.target.value }))}
                                rows={2}
                                className="w-full bg-slate-900 border border-slate-700 text-white rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-emerald-500 outline-none resize-none"
                                placeholder="Mențiuni vizibile pe factură..."
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-400 mb-1">Notă Internă</label>
                            <textarea
                                value={formData.internalNote}
                                onChange={(e) => setFormData(prev => ({ ...prev, internalNote: e.target.value }))}
                                rows={2}
                                className="w-full bg-slate-900 border border-slate-700 text-white rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-emerald-500 outline-none resize-none"
                                placeholder="Notă internă (nu apare pe factură)..."
                            />
                        </div>
                    </div>
                </div>

                {/* Products Section */}
                <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
                    <div className="flex items-center gap-2 mb-4">
                        <Package className="w-5 h-5 text-emerald-400" />
                        <h2 className="text-lg font-bold text-white">Produse ({formData.products.length})</h2>
                    </div>

                    <div className="space-y-3">
                        {formData.products.map((product, index) => (
                            <div key={product.id} className="bg-slate-900 rounded-lg p-4 border border-slate-700">
                                <div className="flex items-start gap-4">
                                    <div className="flex-1 grid grid-cols-1 md:grid-cols-5 gap-3">
                                        <div className="md:col-span-2">
                                            <label className="block text-xs text-slate-400 mb-1">Produs</label>
                                            <input
                                                type="text"
                                                value={product.name}
                                                onChange={(e) => handleProductChange(index, 'name', e.target.value)}
                                                className="w-full bg-slate-800 border border-slate-700 text-white rounded px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-xs text-slate-400 mb-1">Cantitate</label>
                                            <input
                                                type="number"
                                                value={product.quantity}
                                                onChange={(e) => handleProductChange(index, 'quantity', parseFloat(e.target.value) || 0)}
                                                min="0"
                                                step="0.01"
                                                className="w-full bg-slate-800 border border-slate-700 text-white rounded px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-xs text-slate-400 mb-1">Preț</label>
                                            <input
                                                type="number"
                                                value={product.price}
                                                onChange={(e) => handleProductChange(index, 'price', parseFloat(e.target.value) || 0)}
                                                min="0"
                                                step="0.01"
                                                className="w-full bg-slate-800 border border-slate-700 text-white rounded px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-xs text-slate-400 mb-1">TVA %</label>
                                            <input
                                                type="number"
                                                value={product.vatPercentage}
                                                onChange={(e) => handleProductChange(index, 'vatPercentage', parseFloat(e.target.value) || 0)}
                                                min="0"
                                                max="100"
                                                className="w-full bg-slate-800 border border-slate-700 text-white rounded px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
                                            />
                                        </div>
                                    </div>

                                    <button
                                        onClick={() => handleRemoveProduct(index)}
                                        className="mt-6 p-2 text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded transition-colors"
                                    >
                                        <X className="w-5 h-5" />
                                    </button>
                                </div>

                                <div className="mt-2 text-right text-sm">
                                    <span className="text-slate-400">Total: </span>
                                    <span className="text-white font-semibold">{(product.price * product.quantity).toFixed(2)} RON</span>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Total */}
                    <div className="mt-6 bg-gradient-to-r from-emerald-900/20 to-emerald-800/20 rounded-lg p-4 border border-emerald-700/30">
                        <div className="flex justify-between items-center">
                            <span className="text-lg font-medium text-slate-300">Total Factură</span>
                            <span className="text-2xl font-bold text-white">{calculateTotal()} <span className="text-emerald-400">RON</span></span>
                        </div>
                    </div>
                </div>

            </div>

            {/* Footer Actions */}
            <div className="sticky bottom-0 bg-slate-900/95 backdrop-blur-md border-t border-slate-700 px-6 py-4">
                <div className="max-w-5xl mx-auto flex gap-4 justify-end">
                    <button
                        onClick={onClose}
                        disabled={isSending}
                        className="px-6 py-3 bg-slate-700 hover:bg-slate-600 text-white rounded-lg font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        Anulează
                    </button>
                    <button
                        onClick={handleSubmit}
                        disabled={isSending || !formData.client || formData.products.length === 0}
                        className="px-8 py-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                    >
                        {isSending ? (
                            <>
                                <Loader2 className="w-5 h-5 animate-spin" />
                                Se trimite...
                            </>
                        ) : (
                            <>
                                <Save className="w-5 h-5" />
                                Trimite Factura
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default InvoiceEditor;

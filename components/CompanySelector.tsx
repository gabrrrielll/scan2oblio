import React, { useState, useEffect } from 'react';
import { OblioConfig } from '../types';
import { getCompanies } from '../services/oblioService';
import { Briefcase } from 'lucide-react';

interface CompanySelectorProps {
    config: OblioConfig;
    onSelect: (cif: string) => void;
}

const CompanySelector: React.FC<CompanySelectorProps> = ({ config, onSelect }) => {
    const [companies, setCompanies] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        const load = async () => {
            if (!config.email || !config.apiSecret) return;

            setLoading(true);
            try {
                const results = await getCompanies(config);
                console.log("[DEBUG] Companies fetched:", results);
                setCompanies(results);
            } catch (e) {
                console.error("Failed to load companies", e);
            } finally {
                setLoading(false);
            }
        };

        load();
    }, [config.email, config.apiSecret]); // Re-fetch only if credentials change

    if (!companies || companies.length === 0) {
        return null; // Don't show if no companies found
    }

    return (
        <div className="flex items-center gap-2 bg-slate-800 rounded-lg p-2 border border-slate-700">
            <Briefcase className="w-4 h-4 text-blue-400" />
            <div className="flex flex-col flex-1">
                <span className="text-[10px] text-slate-400 font-medium uppercase tracking-wider leading-none mb-0.5 whitespace-nowrap">Societate</span>
                <select
                    value={config.cif || ""}
                    onChange={(e) => onSelect(e.target.value)}
                    className="bg-slate-800 text-sm font-bold text-white outline-none border-none p-0 cursor-pointer hover:text-blue-400 transition-colors w-full min-w-[120px]"
                    disabled={loading}
                >
                    {loading ? (
                        <option>Se încarcă...</option>
                    ) : (
                        <>
                            {!config.cif && <option value="">Selectează...</option>}
                            {companies.map((c, idx) => (
                                <option key={idx} value={c.cif} className="bg-slate-900 text-white">
                                    {c.name}
                                </option>
                            ))}
                        </>
                    )}
                </select>
            </div>
        </div>
    );
};

export default CompanySelector;

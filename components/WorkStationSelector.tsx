import React, { useState, useEffect } from 'react';
import { OblioConfig } from '../types';
import { getWorkStations, getManagementUnits } from '../services/oblioService';
import { Store, Building2 } from 'lucide-react';

interface WorkStationSelectorProps {
    config: OblioConfig;
    selectedStation: string;
    onSelect: (station: string) => void;
}

const WorkStationSelector: React.FC<WorkStationSelectorProps> = ({ config, selectedStation, onSelect }) => {
    const [stations, setStations] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        const load = async () => {
            if (!config.cif) return;

            setLoading(true);
            try {
                // Încercăm întâi Work Stations (puncte de lucru)
                // De obicei acestea sunt cele relevante pentru "workStation" field
                const ws = await getWorkStations(config);
                console.log("[DEBUG] WorkStations fetched:", ws);

                if (ws && ws.length > 0) {
                    setStations(ws);
                } else {
                    // Fallback la Management Units (Gestiuni) dacă nu primim puncte de lucru
                    const mu = await getManagementUnits(config);
                    console.log("[DEBUG] ManagementUnits fetched:", mu);
                    setStations(mu);
                }
            } catch (e) {
                console.error("Failed to load work stations", e);
            } finally {
                setLoading(false);
            }
        };

        load();
    }, [config.cif, config.email]); // Re-fetch only if credentials change

    if (!stations || stations.length === 0) {
        return null; // Nu afișa nimic dacă nu avem opțiuni
    }

    return (
        <div className="flex items-center gap-2 bg-slate-800 rounded-lg p-2 border border-slate-700">
            <Building2 className="w-4 h-4 text-emerald-400" />
            <div className="flex flex-col">
                <span className="text-[10px] text-slate-400 font-medium uppercase tracking-wider leading-none mb-0.5">Gestiune / Punct Lucru</span>
                <select
                    value={selectedStation}
                    onChange={(e) => onSelect(e.target.value)}
                    className="bg-transparent text-sm font-bold text-white outline-none border-none p-0 cursor-pointer hover:text-emerald-400 transition-colors w-full min-w-[120px]"
                    disabled={loading}
                >
                    {loading ? (
                        <option>Se încarcă...</option>
                    ) : (
                        <>
                            <option value="Sediu">Sediu (Default)</option>
                            {stations.map((s, idx) => (
                                <option key={idx} value={s.name}>{s.name}</option>
                            ))}
                        </>
                    )}
                </select>
            </div>
        </div>
    );
};

export default WorkStationSelector;

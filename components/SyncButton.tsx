import React, { useState } from 'react';
import { Loader2, RefreshCw } from 'lucide-react';
import { OblioConfig, OblioProduct } from '../types';
import { getProductsFromOblio } from '../services/oblioService';
import { saveStocksToFile } from '../services/stockFileService';
import { mapOblioToStockItems } from '../services/productUtils';

interface SyncButtonProps {
    config: OblioConfig;
    onSuccess?: (products: OblioProduct[]) => void;
    onError?: (error: string) => void;
}

const SyncButton: React.FC<SyncButtonProps> = ({ config, onSuccess, onError }) => {
    const [isImporting, setIsImporting] = useState(false);

    const handleSync = async () => {
        if (!config.email || !config.apiSecret || !config.cif || !config.workStation) {
            const errorMsg = "Configurare Oblio incompletă. Asigurați-vă că ați selectat Societatea și Gestiunea.";
            onError?.(errorMsg);
            return;
        }

        const managementLabel = config.workStation?.trim() || 'Sediu';

        if (!confirm(`Atenție! Această acțiune va prelua produsele din Oblio pentru gestiunea "${managementLabel}" și va actualiza baza de date locală. Doriți să continuați?`)) {
            return;
        }

        setIsImporting(true);
        try {
            // 1. Fetch from Oblio API
            const obProducts = await getProductsFromOblio(config);

            // 2. Map to local stock format
            const mappedStocks = mapOblioToStockItems(obProducts);

            // 3. Save to local stocks.json file (on server via api.php)
            await saveStocksToFile(mappedStocks);

            // 4. Notify success and pass products for UI update
            onSuccess?.(obProducts);

            alert(`Sincronizare efectuată cu succes! ${obProducts.length} produse procesate.`);
        } catch (err: any) {
            console.error("Sync error:", err);
            const errorMsg = `Eroare la sincronizare: ${err.message}`;
            onError?.(errorMsg);
            alert(errorMsg);
        } finally {
            setIsImporting(false);
        }
    };

    return (
        <button
            onClick={handleSync}
            disabled={isImporting || !config.cif || !config.workStation}
            className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-blue-600/10 hover:bg-blue-600/20 disabled:bg-slate-800 text-blue-400 border border-blue-500/30 rounded-lg transition-all shadow-sm font-bold text-xs h-[42px] uppercase tracking-wider"
        >
            {isImporting ? (
                <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
                <RefreshCw className="w-4 h-4" />
            )}
            <span className="truncate">Sincronizare Oblio</span>
        </button>
    );
};

export default SyncButton;

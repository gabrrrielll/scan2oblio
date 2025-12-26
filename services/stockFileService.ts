import { StockItem } from '../types';

const API_URL = 'api.php';

export const fetchStocksFromFile = async (): Promise<StockItem[]> => {
    try {
        const response = await fetch(`${API_URL}?action=get_stocks_file`);
        const data = await response.json();
        if (data.success) {
            return data.data || [];
        } else {
            throw new Error(data.message || 'Eroare la încărcarea stocurilor.');
        }
    } catch (error) {
        console.error('Fetch stocks error:', error);
        throw error;
    }
};

export const saveStocksToFile = async (stocks: StockItem[]): Promise<void> => {
    try {
        const response = await fetch(API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                action: 'save_stocks_file',
                data: stocks
            })
        });
        const data = await response.json();
        if (!data.success) {
            throw new Error(data.message || 'Eroare la salvarea stocurilor.');
        }
    } catch (error) {
        console.error('Save stocks error:', error);
        throw error;
    }
};

export const getExportStocksXlsUrl = (): string => {
    return `${API_URL}?action=export_stocks_xls`;
};

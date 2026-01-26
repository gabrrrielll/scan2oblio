/**
 * Generates a valid EAN13 code.
 * Format: "200" prefix (internal use) + 9 random digits + 1 checksum digit.
 */
export const generateEAN13 = (): string => {
    // 1. Generate first 12 digits
    // Using "200" prefix for internal/in-store codes is common
    let code = "200";
    for (let i = 0; i < 9; i++) {
        code += Math.floor(Math.random() * 10);
    }

    // 2. Calculate Checksum
    // Standard algorithm:
    // - Read left to right (indices 0 to 11)
    // - Odd positions (index 0, 2...) multiplied by 1
    // - Even positions (index 1, 3...) multiplied by 3
    let sum = 0;
    for (let i = 0; i < 12; i++) {
        const digit = parseInt(code[i]);
        if (i % 2 === 0) {
            // Even index in 0-based array is Odd position (1st, 3rd) -> Weight 1
            sum += digit * 1;
        } else {
            // Odd index in 0-based array is Even position (2nd, 4th) -> Weight 3
            sum += digit * 3;
        }
    }

    const remainder = sum % 10;
    const checkDigit = remainder === 0 ? 0 : 10 - remainder;

    return code + checkDigit;
};

/**
 * Maps Oblio products to the local stock file format
 */
export const mapOblioToStockItems = (products: any[]): any[] => {
    return products.map(p => ({
        "Denumire produs": p.name,
        "Tip": "Marfa",
        "Cod produs": p.productCode || p.code || "",
        "Stoc": Number(p.stock) || 0,
        "U.M.": p.measuringUnit,
        "Cost achizitie fara TVA": 0,
        "Moneda achizitie": "RON",
        "Pret vanzare": Number(p.price) || 0,
        "Cota TVA": Number(p.vatPercentage) || 0,
        "TVA inclus": "DA",
        "Moneda vanzare": p.currency || "RON",
        "Furnizor": p.furnizor || "",
        "sidesType": p.sidesType || "6 LATURI",
        "woodColor": p.woodColor || "NUC",
        "material": p.material || "BRAD",
        "description": p.description || ""
    }));
};

/**
 * Maps a single Label Product back to a StockItem for server saving
 */
export const mapProductToStockItem = (p: any): any => {
    // Construct the 5-line description format for Oblio import
    // Format: Furnizor \n Material \n WoodColor \n Size \n Weight
    const desc = [
        p.furnizor || "",
        p.material || "",
        p.woodColor || "",
        p.sizeClass || "",
        p.weightCapacityMax ? `${p.weightCapacityMax} kg` : ""
    ].join('\n');

    // Start with original data to preserve fields we don't handle in Labels (like Stock)
    const base = p.rawStockData || {};

    return {
        ...base,
        "Denumire produs": p.modelName,
        "Tip": base["Tip"] || "Marfa",
        "Cod produs": p.code,
        "Stoc": base["Stoc"] !== undefined ? base["Stoc"] : (Number(p.stock) || 0),
        "U.M.": base["U.M."] || p.measuringUnit || "buc",
        "Cost achizitie fara TVA": base["Cost achizitie fara TVA"] || 0,
        "Moneda achizitie": base["Moneda achizitie"] || "RON",
        "Pret vanzare": Number(p.price) || 0,
        "Cota TVA": base["Cota TVA"] !== undefined ? base["Cota TVA"] : (Number(p.vatPercentage) || 19),
        "TVA inclus": base["TVA inclus"] || "DA",
        "Moneda vanzare": p.currency || "RON",
        "Furnizor": p.furnizor || "",
        "sidesType": p.sidesType || "",
        "woodColor": p.woodColor || "",
        "material": p.material || "",
        "description": desc,
        "lastEdit": new Date().toLocaleString('ro-RO').replace(',', '')
    };
};

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
 * Maps Oblio products to the local stock file format (Excel alignment)
 */
export const mapOblioToStockItems = (products: any[]): any[] => {
    return products.map(p => ({
        "ID": "", // Oblio internal ID, usually empty for fresh export
        "Denumire produs": p.name,
        "Cod produs": p.productCode || p.code || "",
        "Pret": Number(p.price) || 0,
        "Pretul contine TVA (DA/NU)": "DA",
        "Unitate masura": p.measuringUnit || "BUC",
        "UM in SPV": p.measuringUnit?.toUpperCase() === "BUC" ? "H87" : "",
        "Moneda": p.currency || "RON",
        "Cota TVA": Number(p.vatPercentage) || 19,
        "Descriere": p.description || "",
        "Cod NC": "",
        "Cod CPV": p.code || "",
        "Garantie SGR (DA/NU)": "NU",
        "Grup produse": "",
        "Stoc": Number(p.stock) || 0
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

    const base = p.rawStockData || {};

    return {
        ...base,
        "Denumire produs": p.modelName,
        "Cod produs": p.code,
        "Pret": Number(p.price) || 0,
        "Pretul contine TVA (DA/NU)": base["Pretul contine TVA (DA/NU)"] || "DA",
        "Unitate masura": base["Unitate masura"] || p.measuringUnit || "BUC",
        "UM in SPV": base["UM in SPV"] || (p.measuringUnit?.toUpperCase() === "BUC" ? "H87" : "H87"),
        "Moneda": p.currency || "RON",
        "Cota TVA": base["Cota TVA"] !== undefined ? base["Cota TVA"] : (Number(p.vatPercentage) || 19),
        "Descriere": desc,
        "Stoc": base["Stoc"] !== undefined ? base["Stoc"] : (Number(p.stock) || 0),
        "lastEdit": new Date().toLocaleString('ro-RO').replace(',', '')
    };
};

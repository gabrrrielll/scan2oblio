
export const calculateEAN13Checksum = (code: string): number => {
    let sum = 0;
    for (let i = 0; i < 12; i++) {
        const digit = parseInt(code[i]);
        if (isNaN(digit)) return -1;
        // Standard EAN-13 weights: 1 for odd positions, 3 for even (1-based index)
        if (i % 2 === 0) {
            sum += digit * 1;
        } else {
            sum += digit * 3;
        }
    }
    const remainder = sum % 10;
    return remainder === 0 ? 0 : 10 - remainder;
};

export const generateEAN13 = (): string => {
    // 1. Prefix for Romania (594) + 9 random digits
    let code = "594";
    for (let i = 0; i < 9; i++) {
        code += Math.floor(Math.random() * 10);
    }

    // 2. Calculate Checksum
    const checkDigit = calculateEAN13Checksum(code);
    return code + checkDigit;
};

/**
 * Encodes a 13-digit EAN-13 code into a character string compatible with Libre Barcode EAN13 font.
 * 
 * Mapping for Libre Barcode EAN-13:
 * First digit: as is (outside text)
 * L-Parity (Left): '0'-'9'
 * G-Parity (Left): 'A'-'J' (A=0, B=1, ..., J=9)
 * R-Parity (Right): 'a'-'j' (a=0, b=1, ..., j=9)
 * Middle Guard: '*'
 * End Guard: '+' (Actually Libre Barcode EAN13 uses specific separators)
 * 
 * Structure: [1st Digit] ( [6 Left Digits] * [6 Right Digits] +
 */

// copiat din versiunea originala
export const encodeEAN13 = (code: string): string => {
    if (!code) return '';

    // Clean the code: remove whitespace
    const cleanCode = String(code).trim();

    // If it's not a numeric string at all, return as is
    if (!/^\d+$/.test(cleanCode)) {
        return cleanCode;
    }

    // FIX: Always return the full 13 digits if provided.
    if (cleanCode.length === 13) {
        return cleanCode;
    }

    // Case 2: 12-digit (UPC or EAN without checksum stored)
    if (cleanCode.length === 12) {
        return cleanCode;
    }

    // Fallback: Return whatever was passed
    return cleanCode;
};

export const original_encodeEAN13 = (code: string): string => {
    if (!code || code.length !== 13) return code;

    const parityPatterns = [
        "LLLLLL", "LLGLGG", "LLGGLG", "LLGGGL", "LGLLGG",
        "LGGLLG", "LGGGLL", "LGLGLG", "LGLGGL", "LGGLGL"
    ];

    const L_MAP = "0123456789";
    const G_MAP = "ABCDEFGHIJ";
    const R_MAP = "abcdefghij";

    const firstDigit = parseInt(code[0]);
    const pattern = parityPatterns[firstDigit];

    let encoded = code[0] + "("; // Opening guard in some fonts is '(', in others '!' or '|'

    // Left side (6 digits)
    for (let i = 0; i < 6; i++) {
        const digit = parseInt(code[i + 1]);
        if (pattern[i] === 'L') {
            encoded += L_MAP[digit];
        } else {
            encoded += G_MAP[digit];
        }
    }

    encoded += "*"; // Middle guard

    // Right side (6 digits)
    for (let i = 0; i < 6; i++) {
        const digit = parseInt(code[i + 7]);
        encoded += R_MAP[digit];
    }

    encoded += "+"; // Closing guard

    return encoded;
};

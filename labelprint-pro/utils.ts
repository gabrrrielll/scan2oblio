
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

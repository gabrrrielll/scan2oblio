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

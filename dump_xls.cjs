
const fs = require('fs');

try {
    const buffer = fs.readFileSync('Export_stoc_Test.xls');
    const content = buffer.toString('binary');

    // Simple regex to find readable strings of significant length
    // excel strings often Unicode (double byte), so we look for patterns like H\x00e\x00a\x00d\x00e\x00r
    // or just standard ascii.

    // Filter for strings > 3 chars
    let strings = [];
    let currentString = "";

    for (let i = 0; i < buffer.length; i++) {
        const byte = buffer[i];
        if (byte >= 32 && byte <= 126) {
            currentString += String.fromCharCode(byte);
        } else if (byte === 0) {
            // null byte often separate chars in wide strings
            continue;
        } else {
            if (currentString.length > 3) {
                strings.push(currentString);
            }
            currentString = "";
        }
    }

    console.log("Extracted Strings:");
    console.log(strings.join('\n'));

} catch (e) {
    console.error(e);
}

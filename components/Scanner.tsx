import React, { useState, useEffect } from 'react';
import { useZxing } from 'react-zxing';
import { Camera, X, Zap, Loader2 } from 'lucide-react';

interface ScannerProps {
  onScan: (code: string) => void;
  onClose: () => void;
  allowDuplicates?: boolean;
  duplicateDelayMs?: number;
}

const Scanner: React.FC<ScannerProps> = ({ onScan, onClose, allowDuplicates = false, duplicateDelayMs = 1200 }) => {
  const [torchOn, setTorchOn] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastScannedCode, setLastScannedCode] = useState<string>('');
  const [lastScannedAt, setLastScannedAt] = useState<number>(0);

  // Zxing hook for barcode scanning
  // Configurează pentru a accepta mai multe formate de coduri de bare, inclusiv EAN-13
  const { ref } = useZxing({
    onDecodeResult(result) {
      const scannedCode = result.getText();
      const format = result.getBarcodeFormat();
      console.log("Scanner detected code:", scannedCode, "format:", format, "length:", scannedCode?.length);
      
      // Debug: verifică dacă codul este detectat dar nu este procesat
      if (scannedCode && scannedCode.trim()) {
        const trimmed = scannedCode.trim();
        console.log("Trimmed code:", trimmed, "matches last:", trimmed === lastScannedCode);
        
        // Validare: verifică dacă codul detectat este valid
        // EAN-13 are exact 13 cifre, EAN-8 are 8 cifre, UPC-A are 12 cifre
        const isValidLength = trimmed.length >= 8 && trimmed.length <= 18;
        const isNumeric = /^\d+$/.test(trimmed);
        
        // Verifică dacă este EAN-13 (13 cifre) sau alt format valid
        const isEAN13 = trimmed.length === 13 && isNumeric;
        const isEAN8 = trimmed.length === 8 && isNumeric;
        const isUPCA = trimmed.length === 12 && isNumeric;
        const isValidFormat = isEAN13 || isEAN8 || isUPCA || (isValidLength && isNumeric);
        
        console.log("Code validation:", {
          code: trimmed,
          length: trimmed.length,
          isNumeric,
          isEAN13,
          isEAN8,
          isUPCA,
          isValidFormat,
          format: format
        });
        
        // Previne scanări duplicate consecutive (cu opțiune de a permite duplicate)
        // Acceptă doar coduri valide și cu format corect
        const now = Date.now();
        const isDuplicate = trimmed === lastScannedCode;
        const isDuplicateTooSoon = isDuplicate && now - lastScannedAt < duplicateDelayMs;

        if (isValidFormat && (!isDuplicate || (allowDuplicates && !isDuplicateTooSoon))) {
          setLastScannedCode(trimmed);
          setLastScannedAt(now);
          console.log("Calling onScan with:", trimmed);
          onScan(trimmed);
        } else {
          if (isDuplicate) {
            console.log("Skipping duplicate scan");
          } else {
            console.log("Skipping invalid code - length:", trimmed.length, "isNumeric:", isNumeric, "format:", format);
          }
        }
      } else {
        console.log("Empty or invalid code detected");
      }
    },
    onError(err) {
      console.error("Scanner error:", err);
      setError(err.message || "Eroare la scanare");
    },
    constraints: {
        video: {
            facingMode: "environment",
            width: { ideal: 1920, min: 1280 },
            height: { ideal: 1080, min: 720 },
            // Îmbunătățește calitatea pentru detectare mai precisă
            focusMode: "continuous",
            exposureMode: "continuous"
        }
    },
    // Adaugă delay pentru a permite scannerului să proceseze mai bine
    timeBetweenDecodingAttempts: 300
  });

  return (
    <div className="fixed inset-0 z-50 bg-black flex flex-col items-center justify-center">
      {/* Header */}
      <div className="absolute top-0 left-0 right-0 p-4 flex justify-between items-center z-10 bg-gradient-to-b from-black/70 to-transparent">
        <h2 className="text-white font-semibold">Scanare Cod de Bare</h2>
        <button 
          onClick={onClose}
          className="bg-white/20 p-2 rounded-full backdrop-blur-sm active:bg-white/30"
        >
          <X className="w-6 h-6 text-white" />
        </button>
      </div>

      {/* Camera Viewport */}
      <div className="relative w-full h-full flex items-center justify-center bg-black">
        {error ? (
          <div className="text-white text-center p-6">
            <p className="text-red-400 mb-2">Eroare cameră</p>
            <p className="text-sm text-gray-400">{error}</p>
          </div>
        ) : (
          <video 
            ref={ref} 
            className="w-full h-full object-cover" 
            autoPlay 
            playsInline 
            muted
          />
        )}
        
        {/* Scan Frame Overlay */}
        <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
          <div className="w-64 h-48 border-2 border-emerald-500/70 rounded-lg relative bg-transparent shadow-[0_0_0_9999px_rgba(0,0,0,0.5)]">
            <div className="absolute top-2 left-0 right-0 flex justify-center">
                <span className="text-emerald-400 text-xs bg-black/60 px-2 py-1 rounded">Încadrează codul</span>
            </div>
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="absolute bottom-0 left-0 right-0 p-8 flex justify-around items-center bg-gradient-to-t from-black/90 to-transparent">
        {/* Toggle Torch (If supported by browser) */}
        {/* <button 
          onClick={() => setTorchOn(!torchOn)}
          className={`p-4 rounded-full ${torchOn ? 'bg-yellow-500/20 text-yellow-400' : 'bg-white/10 text-white'}`}
        >
          <Zap className="w-6 h-6" />
        </button> */}
      </div>
    </div>
  );
};

export default Scanner;
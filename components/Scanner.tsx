import React, { useState, useEffect } from 'react';
import { useZxing } from 'react-zxing';
import { Camera, X, Zap, Loader2 } from 'lucide-react';

interface ScannerProps {
  onScan: (code: string) => void;
  onClose: () => void;
}

const Scanner: React.FC<ScannerProps> = ({ onScan, onClose }) => {
  const [torchOn, setTorchOn] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastScannedCode, setLastScannedCode] = useState<string>('');

  // Zxing hook for barcode scanning
  const { ref } = useZxing({
    onDecodeResult(result) {
      const scannedCode = result.getText();
      console.log("Scanner detected code:", scannedCode);
      
      // Previne scanări duplicate consecutive
      if (scannedCode && scannedCode.trim() && scannedCode.trim() !== lastScannedCode) {
        setLastScannedCode(scannedCode.trim());
        console.log("Calling onScan with:", scannedCode.trim());
        onScan(scannedCode.trim());
      }
    },
    onError(err) {
      console.error("Scanner error:", err);
      setError(err.message || "Eroare la scanare");
    },
    constraints: {
        video: {
            facingMode: "environment"
        }
    }
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

import React from 'react';
import { Product } from '../types';
import { encodeEAN13 } from '../utils';

interface LabelProps {
  product: Product;
  logoUrl: string | null;
  showImages: boolean;
}

export const LabelMinimal: React.FC<LabelProps> = ({ product, logoUrl, showImages }) => {
  const encodedCode = encodeEAN13(product.code);

  return (
    <div className="w-[180mm] h-[130mm] bg-white border-2 border-gray-900 p-6 text-gray-900 font-mono flex flex-col justify-between relative box-border overflow-hidden">
      
      {/* Header */}
      <div className="flex justify-between items-start border-b-2 border-gray-900 pb-2 mb-2">
        <div className="w-2/3">
           <h1 className={`${showImages ? 'text-3xl' : 'text-5xl'} font-black uppercase tracking-tighter leading-none`}>{product.modelName}</h1>
           <div className="flex gap-4 items-baseline mt-2">
              <span className="text-sm uppercase font-bold">{product.sidesType}</span>
              <span className="text-sm uppercase font-bold text-gray-600">{product.woodColor}</span>
              <span className={`${showImages ? 'text-2xl' : 'text-4xl'} uppercase font-black bg-gray-900 text-white px-2`}>{product.material}</span>
           </div>
        </div>
        <div className="text-right w-1/3 flex flex-col items-end">
           <h2 className={`${showImages ? 'text-3xl' : 'text-6xl'} font-bold`}>{product.price} {product.currency}</h2>
           {logoUrl ? (
             <img src={logoUrl} alt="Logo" className="h-8 object-contain mt-1 ml-auto grayscale" />
           ) : (
             <span className="text-[10px] uppercase border border-gray-400 px-1 mt-1 inline-block">Logo</span>
           )}
           <span className="text-[10px] uppercase font-bold text-gray-500 mt-1">Furnizor: {product.furnizor}</span>
        </div>
      </div>

      {/* Content Grid */}
      <div className="grid grid-cols-2 gap-6 flex-grow">
        
        {/* Left Col */}
        <div className="flex flex-col gap-4 justify-center">
          <div>
            <span className="bg-gray-900 text-white px-1.5 py-0.5 text-xs font-bold uppercase">Capitonaj</span>
            <p className={`${showImages ? 'text-lg' : 'text-3xl'} font-bold mt-1`}>{product.lidFeature}</p>
          </div>
          <div>
            <span className="bg-gray-200 text-gray-900 px-1.5 py-0.5 text-xs font-bold uppercase">Include</span>
            <ul className={`mt-1 space-y-0.5 list-disc list-inside font-semibold ${showImages ? 'text-sm' : 'text-xl'}`}>
              {product.accessories.map((acc, idx) => (
                <li key={idx}>{acc}</li>
              ))}
            </ul>
          </div>
        </div>

        {/* Right Col */}
        <div className="flex flex-col h-full">
          {showImages && product.imageUrl ? (
            <div className="w-full h-24 border border-gray-200 mb-2 flex items-center justify-center p-1">
               <img src={product.imageUrl} alt="Product" className="max-h-full max-w-full object-contain grayscale" />
            </div>
          ) : (
             // Spacer or extra info when no image
             !showImages && <div className="flex-grow"></div>
          )}

          <div className="mt-auto">
            <span className="bg-gray-200 text-gray-900 px-1.5 py-0.5 text-xs font-bold uppercase">Opțiuni Cruce</span>
            <ul className={`mt-1 space-y-1 ${showImages ? 'text-sm' : 'text-lg'}`}>
              {product.crossOptions.map((opt, idx) => (
                <li key={idx} className="flex justify-between border-b border-gray-300 border-dashed pb-0.5">
                  <span>{opt.type}</span>
                  <span className="font-bold">{opt.price}</span>
                </li>
              ))}
            </ul>
            <div className={`flex justify-between items-center ${showImages ? 'text-xs' : 'text-lg'} font-bold mt-2`}>
              <span>ACCESORII EXTRA:</span>
              <span>{product.accessoriesPrice} LEI</span>
            </div>
            <div className={`flex justify-between items-center ${showImages ? 'text-xs' : 'text-lg'} font-bold`}>
              <span>CRUCIFIX:</span>
              <span>{product.crucifixPrice} LEI</span>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="border-t-2 border-gray-900 pt-2 flex justify-between items-center bg-gray-50 p-3 -mx-6 -mb-6 mt-2">
        <div className={`${showImages ? 'text-xl' : 'text-3xl'} font-black uppercase`}>
          {product.dimensions.length}x{product.dimensions.width}x{product.dimensions.height} CM
        </div>
        <div className="text-right flex flex-col items-center">
             {/* Barcode - Massive Scale if no images */}
             <div style={{ transform: showImages ? 'scaleX(2)' : 'scale(2.5)', transformOrigin: 'center' }}>
                <span style={{ fontFamily: "'Libre Barcode EAN13 Text'" }} className={`${showImages ? 'text-5xl' : 'text-6xl'} leading-none block`}>{encodedCode}</span>
             </div>
        </div>
        <div className={`${showImages ? 'text-xl' : 'text-3xl'} font-black uppercase`}>
          MAX {product.weightCapacityMax} KG
        </div>
      </div>
    </div>
  );
};

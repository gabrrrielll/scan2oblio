
import React from 'react';
import { Product } from '../types';
import { encodeEAN13 } from '../utils';

interface LabelProps {
  product: Product;
  logoUrl: string | null;
  showImages: boolean;
}

export const LabelOrnamental: React.FC<LabelProps> = ({ product, logoUrl, showImages }) => {
  const encodedCode = encodeEAN13(product.code);

  return (
    <div className="w-[180mm] h-[130mm] bg-white p-2 box-border overflow-hidden relative text-slate-800">
      {/* Ornamental Frame */}
      <div className="w-full h-full border-[1px] border-slate-300 p-1">
         <div className="w-full h-full border-[3px] border-slate-800 flex flex-col p-3 relative">
            
            {/* Center Decorative Header */}
            <div className="flex flex-col items-center mb-2 pb-2 border-b border-slate-200">
                 <div className="h-10 mb-1">
                    {logoUrl ? <img src={logoUrl} className="h-full object-contain" /> : <i className="fa-solid fa-cross text-2xl text-slate-400"></i>}
                 </div>
                 <h1 className={`font-serif ${showImages ? 'text-2xl' : 'text-5xl'} font-bold uppercase tracking-wider leading-none`}>{product.modelName}</h1>
                 <div className="flex gap-4 text-xs font-bold text-slate-500 uppercase mt-0.5 items-center">
                    <span className={!showImages ? 'text-xl' : ''}>{product.woodColor}</span>
                    <span>&diams;</span>
                    <span className={!showImages ? 'text-xl' : ''}>{product.sidesType}</span>
                    <span>&diams;</span>
                    <span className={`${showImages ? 'text-xl' : 'text-4xl'} font-black text-slate-800`}>{product.material}</span>
                 </div>
                 {/* Price moved to header if no image (since badge is on image) */}
                 {!showImages && (
                     <div className="mt-2 text-4xl font-black text-slate-900 border-2 border-slate-800 px-4 py-1">
                         {product.price} {product.currency}
                     </div>
                 )}
            </div>

            {/* Layout Split */}
            <div className={`grid ${showImages ? 'grid-cols-3' : 'grid-cols-2'} gap-2 flex-grow items-center`}>
                {/* Left */}
                <div className="text-center space-y-1">
                    <h3 className="font-serif italic font-bold text-sm text-slate-700">Interior</h3>
                    <div className="w-6 h-0.5 bg-slate-800 mx-auto"></div>
                    <p className={`font-bold ${showImages ? 'text-sm' : 'text-2xl'}`}>{product.lidFeature}</p>
                    <div className={`${showImages ? 'text-xs' : 'text-base font-semibold'} text-slate-600 space-y-0.5`}>
                        {product.accessories.map((acc, i) => <p key={i}>{acc}</p>)}
                    </div>
                     <p className="text-[10px] font-bold text-slate-400 uppercase mt-2">Furnizor: {product.furnizor}</p>
                </div>

                {/* Center - Image Focus (Visible only if showImages) */}
                {showImages && (
                    <div className="h-full flex flex-col justify-center items-center relative z-10">
                         <div className="w-32 h-32 rounded-full border-4 border-slate-100 overflow-hidden flex items-center justify-center bg-slate-50 relative">
                            {product.imageUrl ? (
                               <img src={product.imageUrl} className="w-full h-full object-contain" />
                            ) : (
                               <span className="text-xs text-slate-300">FOTO</span>
                            )}
                            
                            {/* Price Badge Overlay */}
                             <div className="absolute -bottom-2 -right-2 bg-slate-900 text-white w-14 h-14 rounded-full flex flex-col items-center justify-center shadow-md border-2 border-white">
                                 <span className="text-xs font-bold leading-none">{product.price}</span>
                                 <span className="text-[8px] leading-none">{product.currency}</span>
                             </div>
                         </div>
                    </div>
                )}

                {/* Right */}
                <div className="text-center space-y-1">
                    <h3 className="font-serif italic font-bold text-sm text-slate-700">Extra</h3>
                    <div className="w-6 h-0.5 bg-slate-800 mx-auto"></div>
                    <div className={`${showImages ? 'text-xs' : 'text-base'} space-y-0.5`}>
                         {product.crossOptions.map((opt, i) => (
                             <p key={i}><strong>{opt.type}</strong>: {opt.price}</p>
                         ))}
                    </div>
                     <p className="text-[10px] text-slate-500 pt-1 border-t border-slate-200 w-3/4 mx-auto mt-1">
                        + Accesorii: {product.accessoriesPrice + product.crucifixPrice}
                     </p>
                </div>
            </div>

            {/* Footer */}
            <div className="absolute bottom-1 left-0 w-full flex justify-between px-4 items-end">
                 <div className={`text-left bg-white px-2 ${showImages ? 'text-lg' : 'text-2xl'} font-bold uppercase tracking-widest text-slate-600`}>
                    {product.dimensions.length} x {product.dimensions.width} x {product.dimensions.height} cm<br/> Max {product.weightCapacityMax} kg
                 </div>
                 <div className="text-right flex flex-col items-end">
                    {/* EAN-13 Barcode */}
                    <div style={{ transform: showImages ? 'scaleX(2)' : 'scale(2.5) translateX(-20%)', transformOrigin: 'right' }}>
                        <span style={{ fontFamily: "'Libre Barcode EAN13 Text'" }} className="text-5xl leading-none block">{encodedCode}</span>
                    </div>
                 </div>
            </div>
         </div>
      </div>
    </div>
  );
};

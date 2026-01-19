
import React from 'react';
import { Product } from '../../types/labelTypes';
import { encodeEAN13 } from '../../utils/labelUtils';

interface LabelProps {
    product: Product;
    logoUrl: string | null;
    showImages: boolean;
}

export const LabelRoyal: React.FC<LabelProps> = ({ product, logoUrl, showImages }) => {
    const encodedCode = encodeEAN13(product.code);

    return (
        <div className="w-[180mm] h-[130mm] bg-white border-[8px] border-[#1a237e] p-1 text-[#1a237e] flex flex-col box-border relative overflow-hidden">
            {/* Inner Gold Border */}
            <div className="w-full h-full border-[2px] border-[#ffd700] p-4 flex flex-col relative">

                {/* Header */}
                <div className="flex flex-col items-center border-b-2 border-[#1a237e] pb-2 mb-2">
                    <div className="h-16 w-full flex items-center justify-center mb-1">
                        {logoUrl ? (
                            <img src={logoUrl} alt="Logo" className="max-h-full max-w-full object-contain" />
                        ) : (
                            <div className="text-2xl font-serif font-bold text-[#1a237e] uppercase tracking-widest">Royal Funeral</div>
                        )}
                    </div>
                    <h1 className={`${showImages ? 'text-4xl' : 'text-6xl'} font-['Cinzel'] font-bold uppercase tracking-wide leading-none text-center`}>{product.modelName}</h1>
                    <div className="flex gap-6 mt-2 items-baseline">
                        <span className="text-sm font-bold uppercase tracking-wider">{product.sidesType}</span>
                        <span className="w-2 h-2 rounded-full bg-[#ffd700]"></span>
                        <span className="text-sm font-bold uppercase tracking-wider">{product.woodColor}</span>
                        <span className="w-2 h-2 rounded-full bg-[#ffd700]"></span>
                        <span className={`${showImages ? 'text-2xl' : 'text-5xl'} font-black uppercase text-[#1a237e]`}>{product.material}</span>
                    </div>
                </div>

                {/* Main Body - Grid 3 cols (with image) or 2 cols (no image) */}
                <div className={`flex-grow grid ${showImages ? 'grid-cols-3' : 'grid-cols-2'} gap-4`}>
                    {/* Left Column */}
                    <div className="flex flex-col justify-center text-center space-y-2">
                        <div>
                            <h3 className="text-xs font-bold uppercase text-gray-500 mb-1">Capitonaj</h3>
                            <p className={`font-serif ${showImages ? 'text-lg' : 'text-3xl'} font-bold`}>{product.lidFeature}</p>
                        </div>
                        <div>
                            <h3 className="text-xs font-bold uppercase text-gray-500 mb-1">Accesorii Incluse</h3>
                            <ul className={`${showImages ? 'text-xs' : 'text-base'} font-bold space-y-0.5`}>
                                {product.accessories.map((acc, i) => <li key={i}>{acc}</li>)}
                            </ul>
                        </div>
                        <div className="mt-2 p-2 border border-[#1a237e] rounded">
                            <p className={`${showImages ? 'text-3xl' : 'text-6xl'} font-black`}>{product.price}</p>
                            <p className="text-xs font-bold">{product.currency}</p>
                        </div>
                    </div>

                    {/* Center Image - Only if showImages */}
                    {showImages && (
                        <div className="flex items-center justify-center p-2">
                            {product.imageUrl ? (
                                <img src={product.imageUrl} className="max-h-32 object-contain drop-shadow-xl" />
                            ) : (
                                <span className="text-xs text-gray-300">FOTO</span>
                            )}
                        </div>
                    )}

                    {/* Right Column */}
                    <div className="flex flex-col justify-center text-center space-y-2">
                        <h3 className="text-xs font-bold uppercase text-gray-500 mb-1">Opțiuni Cruce</h3>
                        <ul className={`${showImages ? 'text-xs' : 'text-base'} space-y-1 w-full`}>
                            {product.crossOptions.map((opt, i) => (
                                <li key={i} className="flex justify-between border-b border-gray-200 pb-0.5">
                                    <span className="font-bold">{opt.type}</span>
                                    <span>{opt.price}</span>
                                </li>
                            ))}
                        </ul>
                        <div className={`mt-auto ${showImages ? 'text-xs' : 'text-sm'} space-y-1 pt-2`}>
                            <div className="flex justify-between font-bold">
                                <span>Accesorii:</span>
                                <span>{product.accessoriesPrice}</span>
                            </div>
                            <div className="flex justify-between font-bold">
                                <span>Crucifix:</span>
                                <span>{product.crucifixPrice}</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="mt-2 bg-[#1a237e] text-white p-2 flex justify-between items-center -mx-4 -mb-4">
                    <div className="text-center w-1/2">
                        <span className={`block ${showImages ? 'text-xl' : 'text-3xl'} font-bold uppercase tracking-wider`}>
                            {product.dimensions.length} x {product.dimensions.width} x {product.dimensions.height} cm
                        </span>
                        <span className={`block ${showImages ? 'text-xl' : 'text-3xl'} font-bold uppercase tracking-wider text-[#ffd700]`}>
                            Cap: {product.weightCapacityMax} KG
                        </span>
                        <span className="block text-xs uppercase tracking-widest text-gray-300 mt-0.5">Furnizor: {product.furnizor}</span>
                    </div>

                    {/* EAN-13 Barcode */}
                    <div className="bg-white text-black px-2 py-1 rounded w-1/2 text-center flex flex-col items-center justify-center">
                        <div style={{ transform: showImages ? 'scaleX(2)' : 'scale(2.5)', transformOrigin: 'center' }}>
                            <span style={{ fontFamily: "'Libre Barcode EAN13 Text'" }} className="text-5xl leading-none block">{encodedCode}</span>
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
};

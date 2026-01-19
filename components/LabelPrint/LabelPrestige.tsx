
import React from 'react';
import { Product } from '../../types/labelTypes';
import { encodeEAN13 } from '../../utils/labelUtils';

interface LabelProps {
    product: Product;
    logoUrl: string | null;
    showImages: boolean;
}

export const LabelPrestige: React.FC<LabelProps> = ({ product, logoUrl, showImages }) => {
    const encodedCode = encodeEAN13(product.code);

    return (
        <div className="w-[180mm] h-[130mm] bg-white text-gray-800 font-sans p-6 box-border overflow-hidden relative flex flex-col">
            {/* Top Bar Decoration */}
            <div className="absolute top-0 left-0 w-full h-2 bg-gray-800"></div>
            <div className="absolute top-3 left-0 w-full h-px bg-gray-300"></div>

            <div className="flex justify-between items-end mb-4 mt-2">
                <div>
                    <p className="text-xs uppercase tracking-[0.3em] text-gray-400 mb-0.5">Sicriu Model</p>
                    <h1 className={`${showImages ? 'text-4xl' : 'text-6xl'} font-light tracking-tight text-gray-900`}>{product.modelName}</h1>
                </div>
                <div className="text-right">
                    {logoUrl ? (
                        <img src={logoUrl} alt="Logo" className="h-12 object-contain" />
                    ) : (
                        <span className="text-lg font-serif italic text-gray-400">Brand Logo</span>
                    )}
                </div>
            </div>

            {/* Grid Layout Logic */}
            <div className="grid grid-cols-12 gap-4 flex-grow border-t border-b border-gray-200 py-4">

                {/* Left Col: Price & Main Specs - Expands if no image */}
                <div className={`${showImages ? 'col-span-3' : 'col-span-5'} border-r border-gray-100 pr-2 flex flex-col justify-center`}>
                    <h3 className="text-[10px] font-bold uppercase text-gray-400 mb-1">Detalii</h3>
                    <p className={`${showImages ? 'text-md' : 'text-2xl'} font-bold mb-0.5`}>{product.woodColor}</p>
                    <p className={`${showImages ? 'text-sm' : 'text-xl'} text-gray-600 mb-2`}>{product.sidesType}</p>

                    <h3 className="text-[10px] font-bold uppercase text-gray-400 mb-1">Material</h3>
                    <p className={`${showImages ? 'text-xl' : 'text-4xl'} font-black text-gray-800 mb-4`}>{product.material}</p>

                    <h3 className="text-[10px] font-bold uppercase text-gray-400 mb-1">Furnizor</h3>
                    <p className="text-sm font-bold text-gray-800 mb-2">{product.furnizor}</p>

                    <h3 className="text-[10px] font-bold uppercase text-gray-400 mb-1 mt-auto">Preț Total</h3>
                    <p className={`${showImages ? 'text-2xl' : 'text-5xl'} font-bold text-gray-900`}>{product.price} <span className="text-xs font-normal text-gray-500">{product.currency}</span></p>
                </div>

                {/* Middle Col: Config - Expands if no image */}
                <div className={`${showImages ? 'col-span-5' : 'col-span-7'} ${showImages ? 'border-r border-gray-100' : ''} pr-2 pl-2`}>
                    <h3 className="text-[10px] font-bold uppercase text-gray-400 mb-2">Configurație</h3>
                    <div className="grid grid-cols-2 gap-2">
                        <div className="space-y-2">
                            <div>
                                <span className={`block ${showImages ? 'text-xs' : 'text-xl'} font-semibold text-gray-900`}>{product.lidFeature}</span>
                                <span className="text-[10px] text-gray-500">Capitonaj Capac</span>
                            </div>
                            <ul className={`${showImages ? 'text-xs' : 'text-sm font-medium'} space-y-0.5 text-gray-700 mt-2`}>
                                {product.accessories.map((acc, i) => <li key={i}>• {acc}</li>)}
                            </ul>
                        </div>
                        <ul className={`space-y-1 ${showImages ? 'text-xs' : 'text-sm font-medium'}`}>
                            {product.crossOptions.map((opt, i) => (
                                <li key={i} className="flex justify-between">
                                    <span>{opt.type}</span>
                                    <span className="font-semibold">{opt.price}</span>
                                </li>
                            ))}
                            <li className="flex justify-between pt-1 border-t border-gray-100 mt-1">
                                <span className="text-gray-500">Accesorii</span>
                                <span>{product.accessoriesPrice}</span>
                            </li>
                            <li className="flex justify-between">
                                <span className="text-gray-500">Crucifix</span>
                                <span>{product.crucifixPrice}</span>
                            </li>
                        </ul>
                    </div>

                    {/* Barcode moved here if no images */}
                    {!showImages && (
                        <div className="mt-8 flex justify-end">
                            <div style={{ transform: 'scale(2.5)', transformOrigin: 'right bottom' }}>
                                <span style={{ fontFamily: "'Libre Barcode EAN13 Text'" }} className="text-5xl leading-none block">{encodedCode}</span>
                            </div>
                        </div>
                    )}
                </div>

                {/* Right Col: Image - Only if showImages */}
                {showImages && (
                    <div className="col-span-4 pl-2 flex flex-col items-center justify-center">
                        {product.imageUrl ? (
                            <img src={product.imageUrl} className="max-h-32 object-contain" />
                        ) : (
                            <div className="w-full h-32 bg-gray-50 flex items-center justify-center text-xs text-gray-400">FOTO</div>
                        )}
                        <div className="mt-4 flex flex-col items-center">
                            <div style={{ transform: 'scaleX(2)', transformOrigin: 'center' }}>
                                <span style={{ fontFamily: "'Libre Barcode EAN13 Text'" }} className="text-5xl leading-none block">{encodedCode}</span>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Footer */}
            <div className={`mt-2 flex justify-between ${showImages ? 'text-lg' : 'text-2xl'} font-bold uppercase tracking-wider text-gray-700`}>
                <span>Dimensiuni: {product.dimensions.length} x {product.dimensions.width} x {product.dimensions.height} cm</span>
                <span>Sarcină Maximă: {product.weightCapacityMax} kg</span>
            </div>
        </div>
    );
};

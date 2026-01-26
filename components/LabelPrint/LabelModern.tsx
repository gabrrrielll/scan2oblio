
import React from 'react';
import { Product } from '../../types/labelTypes';
import { encodeEAN13 } from '../../utils/labelUtils';

interface LabelModernProps {
    product: Product;
    logoUrl: string | null;
    showImages: boolean;
}

export const LabelModern: React.FC<LabelModernProps> = ({ product, logoUrl, showImages }) => {
    const encodedCode = encodeEAN13(product.code);

    return (
        <div className="w-[180mm] h-[130mm] bg-white border border-gray-200 text-slate-800 font-sans flex flex-row overflow-hidden shadow-sm relative">
            {/* Left Sidebar - High Impact */}
            <div className={`${showImages ? 'w-[60mm]' : 'w-[80mm]'} bg-slate-900 text-white p-4 flex flex-col justify-between shrink-0 transition-all`}>
                <div className="h-20 w-full flex items-center justify-center mb-4 bg-white/10 rounded-lg p-2">
                    {logoUrl ? (
                        <img src={logoUrl} alt="Logo" className="max-h-full max-w-full object-contain" />
                    ) : (
                        <span className="text-gray-400 text-xs">LOGO</span>
                    )}
                </div>

                <div>
                    <h2 className={`${showImages ? 'text-2xl' : 'text-4xl'} font-bold uppercase tracking-wide leading-none`}>{product.modelName}</h2>
                    <p className="text-slate-400 uppercase tracking-widest text-xs mt-1">{product.sidesType}</p>

                    <div className="mt-4">
                        <p className="text-[10px] text-slate-400 uppercase">Culoare</p>
                        <p className={`${showImages ? 'text-lg' : 'text-3xl'} font-semibold text-amber-500 leading-tight`}>{product.woodColor}</p>

                        <p className="text-[10px] text-slate-400 uppercase mt-2">Material</p>
                        <p className={`${showImages ? 'text-2xl' : 'text-5xl'} font-black text-white uppercase`}>{product.material}</p>

                        <p className="text-[10px] text-slate-400 uppercase mt-2">Furnizor</p>
                        <p className={`${showImages ? 'text-sm' : 'text-xl'} font-bold text-gray-300 uppercase`}>{product.furnizor}</p>
                    </div>
                </div>

                <div className="mt-auto">
                    <p className="text-[10px] text-slate-400 uppercase">Preț Final</p>
                    <p className={`${showImages ? 'text-3xl' : 'text-6xl'} font-bold text-white mb-2`}>{product.price} <span className={`${showImages ? 'text-sm' : 'text-xl'} font-normal`}>{product.currency}</span></p>

                    {/* Barcode Area Inverted */}
                    <div className="bg-white p-1 rounded flex flex-col items-center overflow-hidden">
                        <div style={{ transform: showImages ? 'scaleX(1.5)' : 'scaleX(2)', transformOrigin: 'center' }}>
                            <span style={{ fontFamily: "'Libre Barcode EAN13 Text'" }} className="text-5xl text-black leading-none block">{encodedCode}</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Right Content */}
            <div className="flex-grow p-4 flex flex-col">

                {/* Top Section: Image vs Specs */}
                <div className={`flex gap-4 mb-4 ${showImages ? 'h-24' : 'h-auto flex-grow'}`}>
                    {/* Image Area - Only if showImages */}
                    {showImages && product.imageUrl && (
                        <div className="w-1/3 bg-slate-50 rounded border border-slate-100 flex items-center justify-center p-1">
                            <img src={product.imageUrl} alt={product.modelName} className="max-h-full max-w-full object-contain mix-blend-multiply" />
                        </div>
                    )}

                    {/* Lid & Accessories Summary */}
                    <div className="flex-grow flex flex-col justify-center">
                        <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Capitonaj</h3>
                        <p className={`${showImages ? 'font-semibold text-base' : 'font-bold text-3xl'} mb-2`}>{product.lidFeature}</p>

                        <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Include</h3>
                        <div className={`${showImages ? 'text-xs' : 'text-xl font-medium'} space-y-0.5`}>
                            {product.accessories.map((acc, idx) => (
                                <span key={idx} className={`inline-block mr-2 bg-slate-100 px-1 rounded text-slate-600 ${!showImages && 'p-2 mb-1'}`}>• {acc}</span>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Grid for specs */}
                <div className={`grid grid-cols-2 gap-4 ${showImages ? 'h-full' : 'h-1/2'}`}>

                    {/* Options */}
                    <div className="flex flex-col">
                        <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Opțiuni Cruce</h3>
                        <div className="space-y-1 flex-grow">
                            {product.crossOptions.map((opt, idx) => (
                                <div key={idx} className={`flex justify-between items-center border-b border-slate-100 ${showImages ? 'pb-0.5' : 'pb-2'}`}>
                                    <span className={`${showImages ? 'font-medium text-xs' : 'font-bold text-xl'}`}>{opt.type}</span>
                                    <span className={`${showImages ? 'font-bold text-xs' : 'font-black text-xl'} text-slate-900`}>{opt.price} LEI</span>
                                </div>
                            ))}
                        </div>
                        <div className="bg-slate-50 p-2 rounded border border-slate-100 mt-2">
                            <div className="flex justify-between text-xs mb-0.5">
                                <span className={`${showImages ? '' : 'text-lg'} text-slate-500`}>Accesorii</span>
                                <span className={`${showImages ? 'font-bold' : 'font-black text-xl'}`}>{product.accessoriesPrice} LEI</span>
                            </div>
                            <div className="flex justify-between text-xs">
                                <span className={`${showImages ? '' : 'text-lg'} text-slate-500`}>Crucifix</span>
                                <span className={`${showImages ? 'font-bold' : 'font-black text-xl'}`}>{product.crucifixPrice} LEI</span>
                            </div>
                        </div>
                    </div>

                    {/* Specs */}
                    <div className="flex flex-col justify-end">
                        <div className="grid grid-cols-1 gap-2 text-center">
                            <div className="bg-slate-100 p-2 rounded">
                                <p className="text-[10px] text-slate-500 uppercase">Dimensiuni (cm)</p>
                                <p className={`${showImages ? 'text-xl' : 'text-2xl'} font-bold leading-tight`}>
                                    {[
                                        product.dimensions.length > 0 ? product.dimensions.length : null,
                                        product.dimensions.width > 0 ? product.dimensions.width : null,
                                        product.dimensions.height > 0 ? product.dimensions.height : null
                                    ].filter(Boolean).join(' x ')}
                                </p>
                            </div>
                            <div className="bg-slate-100 p-2 rounded">
                                <p className="text-[10px] text-slate-500 uppercase">Greutate (kg)</p>
                                <p className={`${showImages ? 'text-xl' : 'text-2xl'} font-bold leading-tight`}>{product.weightCapacityMin} - {product.weightCapacityMax}</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

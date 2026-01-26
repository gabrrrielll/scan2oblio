
import React from 'react';
import { Product } from '../../types/labelTypes';
import { encodeEAN13 } from '../../utils/labelUtils';

interface LabelProps {
    product: Product;
    logoUrl: string | null;
    showImages: boolean;
}

export const LabelElegant: React.FC<LabelProps> = ({ product, logoUrl, showImages }) => {
    const encodedCode = encodeEAN13(product.code);

    const dimParts = [];
    if (product.dimensions.length > 0) dimParts.push(product.dimensions.length);
    if (product.dimensions.width > 0) dimParts.push(product.dimensions.width);
    if (product.dimensions.height > 0) dimParts.push(product.dimensions.height);
    const dimText = dimParts.length > 0 ? dimParts.join('x') + ' CM' : '';

    return (
        <div className="w-[198mm] h-[136.5mm] bg-[#fffbf0] border-[8px] border-double border-[#8B5A2B] pt-6 px-4 pb-4 text-[#3e2723] flex flex-col box-border relative overflow-hidden">

            {/* Corner Decorations */}
            <div className="absolute top-2 left-2 w-12 h-12 border-t-2 border-l-2 border-[#8B5A2B] opacity-40"></div>
            <div className="absolute top-2 right-2 w-12 h-12 border-t-2 border-r-2 border-[#8B5A2B] opacity-40"></div>
            <div className="absolute bottom-2 left-2 w-12 h-12 border-b-2 border-l-2 border-[#8B5A2B] opacity-40"></div>
            <div className="absolute bottom-2 right-2 w-12 h-12 border-b-2 border-r-2 border-[#8B5A2B] opacity-40"></div>

            {/* Header Area - SPLIT INTO TWO COLUMNS - INCREASED HEIGHT */}
            <div className="flex items-center justify-between my-1 relative z-10 border-b border-[#8B5A2B]/20 pb-2 h-36">

                {/* COL 1 (Left): Details from printscreen (Model Name + Specs) */}
                <div className="w-1/2 flex flex-col items-center justify-center pr-1 h-full pt-2">
                    <h1 className={`${showImages ? 'text-3xl' : 'text-5xl'} font-serif text-[#8B5A2B] tracking-wide font-bold leading-[1.2] text-center uppercase`}>{product.modelName}</h1>
                    <div className="flex flex-wrap justify-center items-center gap-2 mt-2 text-lg uppercase tracking-widest font-bold text-center">
                        {product.sidesType && <span>{product.sidesType}</span>}
                        {product.sidesType && product.woodColor && <span className="w-1 h-1 rounded-full bg-[#8B5A2B]"></span>}
                        {product.woodColor && <span>{product.woodColor}</span>}
                        {product.woodColor && product.material && <span className="w-1 h-1 rounded-full bg-[#8B5A2B]"></span>}
                        {product.material && <span>{product.material}</span>}
                    </div>
                    {product.showCompleteEchipat && <h2 className="font-serif italic text-2xl text-[#8B5A2B] mt-2">SICRIU COMPLET ECHIPAT</h2>}
                </div>


                {/* COL 2 (Right): Logo moved here with FULL HEIGHT */}
                <div className="w-1/2 flex items-center justify-center p-2 h-full">
                    {logoUrl && logoUrl !== 'null' ? (
                        <div className="w-full h-full flex items-center justify-center overflow-hidden">
                            <img
                                src={logoUrl}
                                alt="Logo"
                                className="max-h-full max-w-full object-contain"
                                onError={(e) => {
                                    // Fallback if image fails
                                    e.currentTarget.style.display = 'none';
                                    e.currentTarget.parentElement!.innerHTML = '<span class="text-[#8B5A2B] font-serif text-xl italic">Logo Firmă</span>';
                                }}
                            />
                        </div>
                    ) : (
                        <div className="border-2 border-dashed border-[#8B5A2B]/20 p-4 rounded-xl flex items-center justify-center">
                            <span className="text-[#8B5A2B] font-serif text-lg italic">Fără Logo</span>
                        </div>
                    )}
                </div>

            </div>

            {/* Main Content - Grid changes based on showImages */}
            <div className={`flex-grow grid ${showImages ? 'grid-cols-3' : 'grid-cols-2'} gap-4 relative z-10 px-2 mt-1`}>

                {/* Left Info */}
                <div className="flex flex-col items-center text-center pr-2 h-full">
                    {/* WRAPPER CENTRAT VERTICAL PENTRU DETALII INTERIOR */}
                    <div className="flex-grow flex flex-col justify-center w-full">
                        {product.showDetaliiInterior && <h2 className="font-serif italic text-2xl text-[#8B5A2B] mb-2 text-center">DETALII INTERIOR</h2>}
                        <p className={`text-2xl font-medium mb-1 leading-none`}>{product.lidFeature}</p>
                        <div className="space-y-0.5 mt-2">
                            {product.accessories.map((acc, i) => (
                                <p key={i} className={`text-[#5D4037] font-medium text-2xl`}>{acc}</p>
                            ))}
                        </div>
                    </div>

                    <div className="pt-2 shrink-0 w-full mb-2">
                        {/* MOVED DIMENSIONS HERE for No-Image Layout */}
                        {!showImages && dimText && (
                            <div className="mb-4 border-t border-b border-[#8B5A2B]/30 py-2 bg-[#8B5A2B]/5">
                                <p className="text-2xl uppercase text-[#3e2723] font-black tracking-widest leading-none">
                                    {dimText}
                                </p>
                                {product.weightCapacityMax > 0 && (
                                    <p className="text-xl uppercase text-[#8B5A2B] font-bold tracking-widest mt-1">
                                        Max {product.weightCapacityMax} kg
                                    </p>
                                )}
                            </div>
                        )}

                        <p className="text-xs font-bold text-[#8B5A2B] uppercase mb-1">Fz: {product.furnizor}</p>
                        <div className="flex items-baseline justify-center gap-2">
                            <p className={`${showImages ? 'text-3xl' : 'text-5xl'} font-serif font-bold text-[#8B5A2B] leading-none`}>{product.price}</p>
                            <span className={`${showImages ? 'text-xl' : 'text-3xl'} font-serif font-bold text-[#8B5A2B]`}>{product.currency}</span>
                        </div>
                    </div>
                </div>

                {/* Center Info - Image (Only visible if showImages) */}
                {showImages && (
                    <div className="flex flex-col items-center justify-center px-1">
                        {product.imageUrl && (
                            <div className="w-full h-32 border-[4px] border-[#8B5A2B]/10 p-1 bg-white mb-4">
                                <img src={product.imageUrl} alt={product.modelName} className="w-full h-full object-contain" />
                            </div>
                        )}
                        {dimText && (
                            <div className="bg-[#8B5A2B]/5 p-2 w-full text-center">
                                <p className="text-xl uppercase text-[#8B5A2B] font-black tracking-widest text-center leading-tight">
                                    {dimText}
                                </p>
                                {product.weightCapacityMax > 0 && (
                                    <p className="text-xl uppercase text-[#8B5A2B] font-black tracking-widest text-center leading-tight mt-1">
                                        Max {product.weightCapacityMax} kg
                                    </p>
                                )}
                            </div>
                        )}
                    </div>
                )}

                {/* Right Info */}
                <div className="flex flex-col pl-1 overflow-hidden h-full">

                    {/* WRAPPER CENTRAT VERTICAL PENTRU CRUCE SI LISTA */}
                    <div className="flex-grow flex flex-col justify-center w-full">
                        {product.crossOptions.some(opt => opt.price > 0) && (
                            <>
                                <h2 className="font-serif italic text-2xl text-[#8B5A2B] mb-3 text-center">CRUCE INSCRIPTIONATA</h2>

                                {/* MODIFIED: Width limited to 74% and centered via mx-auto to match first printscreen */}
                                <div className={`space-y-1.5 ${showImages ? 'text-sm' : 'text-xl font-bold'} w-[80%] mx-auto`}>
                                    {product.crossOptions.filter(opt => opt.price > 0).map((opt, i) => (
                                        <div key={i} className="flex justify-between items-end">
                                            <span className="font-bold uppercase text-[#5D4037]">{opt.type}</span>
                                            <span className="border-b border-dotted border-[#8B5A2B] flex-grow mx-1 mb-1.5"></span>
                                            <span className="font-bold">{opt.price} Lei</span>
                                        </div>
                                    ))}
                                </div>
                            </>
                        )}
                    </div>

                    {/* MODIFIED: Width limited to 70% and centered via mx-auto to match first printscreen */}
                    <div className={`pt-2 border-t border-[#8B5A2B]/20 space-y-1.5 ${showImages ? 'text-sm' : 'text-xl'} shrink-0 mt-2 w-[80%] mx-auto`}>
                        {product.accessoriesPrice > 0 && (
                            <div className="flex justify-between">
                                <span className="text-[#8B5A2B] italic">Accesorii:</span>
                                <span className="font-bold">{product.accessoriesPrice} Lei</span>
                            </div>
                        )}
                        {product.crucifixPrice > 0 && (
                            <div className="flex justify-between">
                                <span className="text-[#8B5A2B] italic">Crucifix:</span>
                                <span className="font-bold">{product.crucifixPrice} Lei</span>
                            </div>
                        )}

                        {/* BARCODE SECTION - SCALED UP AND IMPROVED */}
                        <div className="text-center pt-2 flex flex-col items-center justify-end relative h-32">
                            {/* The Barcode itself */}
                            <div className="flex flex-col items-center justify-end h-full">
                                <div style={{
                                    transform: showImages ? 'scale(2.2, 1.3)' : 'scale(2.8, 1.5)',
                                    transformOrigin: 'bottom center',
                                    marginBottom: '4px'
                                }}>
                                    <span style={{
                                        fontFamily: "'Libre Barcode EAN13'",
                                        textRendering: 'optimizeLegibility',
                                        WebkitFontSmoothing: 'none'
                                    }} className="text-7xl leading-none block">{encodedCode}</span>
                                </div>
                                {/* Numerical code below - simplified tracking */}
                                <p className="text-xl font-bold tracking-[0.3em] mt-2 text-black font-mono">
                                    {product.code}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

        </div>
    );
};

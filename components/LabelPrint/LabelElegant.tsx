
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

    return (
        <div className="w-[190mm] h-[130mm] bg-[#fffbf0] border-[8px] border-double border-[#8B5A2B] pt-8 px-4 pb-4 text-[#3e2723] flex flex-col box-border relative overflow-hidden">

            {/* Corner Decorations */}
            <div className="absolute top-2 left-2 w-12 h-12 border-t-2 border-l-2 border-[#8B5A2B] opacity-40"></div>
            <div className="absolute top-2 right-2 w-12 h-12 border-t-2 border-r-2 border-[#8B5A2B] opacity-40"></div>
            <div className="absolute bottom-2 left-2 w-12 h-12 border-b-2 border-l-2 border-[#8B5A2B] opacity-40"></div>
            <div className="absolute bottom-2 right-2 w-12 h-12 border-b-2 border-r-2 border-[#8B5A2B] opacity-40"></div>

            {/* Header Area - SPLIT INTO TWO COLUMNS */}
            <div className="flex items-center justify-between my-2 relative z-10 border-b border-[#8B5A2B]/20 pb-4 h-28">

                {/* COL 1 (Left): Details from printscreen (Model Name + Specs) */}
                <div className="w-1/2 flex flex-col items-center justify-center pr-1 h-full">
                    <h1 className={`${showImages ? 'text-3xl' : 'text-4xl'} font-serif text-[#8B5A2B] tracking-wide font-bold leading-none text-center uppercase`}>{product.modelName}</h1>
                    <div className="flex flex-wrap justify-center items-center gap-2 mt-2 text-base uppercase tracking-widest font-bold text-center">
                        <span>{product.sidesType}</span>
                        <span className="w-1 h-1 rounded-full bg-[#8B5A2B]"></span>
                        <span>{product.woodColor}</span>
                        <span className="w-1 h-1 rounded-full bg-[#8B5A2B]"></span>
                        <span>{product.material}</span>
                    </div>
                    <h2 className="font-serif italic text-xl text-[#8B5A2B] my-2">SICRIU COMPLET ECHIPAT</h2>
                </div>


                {/* COL 2 (Right): Logo moved here with FULL HEIGHT */}
                <div className="w-1/2 flex items-center justify-center pl-1 h-full">
                    {logoUrl ? (
                        <img src={logoUrl} alt="Logo" className="h-full w-full object-contain" />
                    ) : (
                        <span className="text-[#8B5A2B] font-serif text-lg italic border-2 border-dashed border-[#8B5A2B]/30 p-2 rounded">Logo Aici</span>
                    )}
                </div>

            </div>

            {/* Main Content - Grid changes based on showImages */}
            <div className={`flex-grow grid ${showImages ? 'grid-cols-3' : 'grid-cols-2'} gap-4 relative z-10 px-2 mt-1`}>

                {/* Left Info */}
                <div className="flex flex-col items-center text-center pr-2 h-full">
                    {/* WRAPPER CENTRAT VERTICAL PENTRU DETALII INTERIOR */}
                    <div className="flex-grow flex flex-col justify-center w-full">
                        <h2 className="font-serif italic text-xl text-[#8B5A2B] mb-1 text-center">DETALII INTERIOR</h2>
                        <p className={`text-xl font-medium mb-1 leading-none`}>{product.lidFeature}</p>
                        <div className="space-y-0.5">
                            {product.accessories.map((acc, i) => (
                                <p key={i} className={`text-[#5D4037] font-medium text-xl`}>{acc}</p>
                            ))}
                        </div>
                    </div>

                    <div className="pt-1 shrink-0 w-full">
                        {/* MOVED DIMENSIONS HERE for No-Image Layout */}
                        {!showImages && (
                            <div className="mb-2 border-t border-b border-[#8B5A2B]/30 py-1 bg-[#8B5A2B]/5">
                                <p className="text-xl uppercase text-[#3e2723] font-black tracking-widest leading-none">
                                    {product.dimensions.length}x{product.dimensions.width}x{product.dimensions.height} CM
                                </p>
                                <p className="text-base uppercase text-[#8B5A2B] font-bold tracking-widest mt-0.5">
                                    Max {product.weightCapacityMax} kg
                                </p>
                            </div>
                        )}

                        <p className="text-[10px] font-bold text-[#8B5A2B] uppercase mb-0.5">Fz: {product.furnizor}</p>
                        <p className={`${showImages ? 'text-2xl' : 'text-5xl'} font-serif font-bold text-[#8B5A2B] leading-none`}>{product.price} {product.currency}</p>
                    </div>
                </div>

                {/* Center Info - Image (Only visible if showImages) */}
                {showImages && (
                    <div className="flex flex-col items-center justify-center px-1">
                        {product.imageUrl && (
                            <div className="w-full h-28 border-[4px] border-[#8B5A2B]/10 p-1 bg-white mb-2">
                                <img src={product.imageUrl} alt={product.modelName} className="w-full h-full object-contain" />
                            </div>
                        )}
                        <div className="bg-[#8B5A2B]/5 p-2 w-full text-center">
                            <p className="text-lg uppercase text-[#8B5A2B] font-black tracking-widest text-center leading-tight">
                                {product.dimensions.length}x{product.dimensions.width}x{product.dimensions.height} cm
                            </p>
                            <p className="text-lg uppercase text-[#8B5A2B] font-black tracking-widest text-center leading-tight mt-1">
                                Max {product.weightCapacityMax} kg
                            </p>
                        </div>
                    </div>
                )}

                {/* Right Info */}
                <div className="flex flex-col pl-1 overflow-hidden h-full">

                    {/* WRAPPER CENTRAT VERTICAL PENTRU CRUCE SI LISTA */}
                    <div className="flex-grow flex flex-col justify-center w-full">
                        <h2 className="font-serif italic text-xl text-[#8B5A2B] mb-2 text-center">CRUCE INSCRIPTIONATA</h2>

                        {/* MODIFIED: Width limited to 74% and centered via mx-auto to match first printscreen */}
                        <div className={`space-y-1 ${showImages ? 'text-xs' : 'text-base font-bold'} w-[74%] mx-auto`}>
                            {product.crossOptions.map((opt, i) => (
                                <div key={i} className="flex justify-between items-end">
                                    <span className="font-bold uppercase text-[#5D4037]">{opt.type}</span>
                                    <span className="border-b border-dotted border-[#8B5A2B] flex-grow mx-1 mb-1"></span>
                                    <span className="font-bold">{opt.price} Lei</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* MODIFIED: Width limited to 70% and centered via mx-auto to match first printscreen */}
                    <div className={`pt-1 border-t border-[#8B5A2B]/20 space-y-1 ${showImages ? 'text-xs' : 'text-base'} shrink-0 mt-2 w-[70%] mx-auto`}>
                        <div className="flex justify-between">
                            <span className="text-[#8B5A2B] italic">Accesorii:</span>
                            <span className="font-bold">{product.accessoriesPrice} Lei</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-[#8B5A2B] italic">Crucifix:</span>
                            <span className="font-bold">{product.crucifixPrice} Lei</span>
                        </div>

                        {/* BARCODE SECTION */}
                        <div className="text-center pt-2 flex flex-col items-center justify-end">
                            {/* The Barcode itself - No Text version, Scaled X wide, Y half */}
                            <div style={{ transform: showImages ? 'scale(1.4, 0.9)' : 'scale(1.5, 0.9)', transformOrigin: 'bottom center' }}>
                                <span style={{ fontFamily: "'Libre Barcode EAN13 Text'" }} className="text-6xl leading-none block">{encodedCode}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

        </div>
    );
};

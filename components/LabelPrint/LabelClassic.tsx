
import React from 'react';
import { Product } from '../../types/labelTypes';
import { encodeEAN13 } from '../../utils/labelUtils';

interface LabelClassicProps {
    product: Product;
    logoUrl: string | null;
    showImages: boolean;
}

export const LabelClassic: React.FC<LabelClassicProps> = ({ product, logoUrl, showImages }) => {
    const encodedCode = encodeEAN13(product.code);

    return (
        <div className="w-[180mm] h-[130mm] border-4 border-double border-gray-800 p-3 relative bg-gray-50 text-gray-900 font-serif flex flex-col justify-between shadow-sm overflow-hidden box-border">
            {/* Background Texture simulation */}
            <div className="absolute inset-0 opacity-10 pointer-events-none"
                style={{ backgroundImage: 'radial-gradient(#000 1px, transparent 1px)', backgroundSize: '20px 20px' }}>
            </div>

            <div className="relative z-10 flex flex-col h-full">

                {/* Top Section - Logic split based on showImages */}
                <div className="flex flex-row h-3/4">

                    {/* 
            IF SHOW IMAGES: Standard 3 Column Layout
            IF NO IMAGES: 2 Column Layout (Left: Model/Price, Right: Specs/Options) with HUGE text
          */}

                    {/* Left Column */}
                    <div className={`${showImages ? 'w-1/3' : 'w-1/2'} flex flex-col items-center text-center border-r-2 border-dotted border-gray-400 pr-2`}>
                        <div className={`${showImages ? 'h-20' : 'h-24'} w-full flex items-center justify-center mb-1`}>
                            {logoUrl ? (
                                <img src={logoUrl} alt="Logo" className="max-h-full max-w-full object-contain" />
                            ) : (
                                <div className="border-2 border-dashed border-gray-300 w-16 h-16 flex items-center justify-center text-gray-400 text-xs">
                                    LOGO
                                </div>
                            )}
                        </div>

                        <h2 className={`${showImages ? 'text-xl' : 'text-4xl'} font-bold uppercase mt-1 font-['Cinzel'] tracking-wider leading-tight`}>
                            {product.modelName}
                        </h2>
                        <h3 className={`${showImages ? 'text-md' : 'text-2xl'} font-bold uppercase mt-1 text-gray-700 font-['Playfair_Display']`}>
                            {product.sidesType}
                        </h3>

                        <p className={`${showImages ? 'text-xs' : 'text-lg'} uppercase text-gray-500 mt-1 font-sans font-bold`}>Furnizor: {product.furnizor}</p>

                        <div className="mt-auto mb-2 w-full">
                            <h2 className={`${showImages ? 'text-2xl' : 'text-5xl'} font-black mt-2 border-t-2 border-b-2 border-gray-800 py-1`}>
                                {product.price} {product.currency}
                            </h2>
                            <div className="mt-2">
                                <h3 className={`${showImages ? 'text-lg' : 'text-3xl'} font-bold uppercase tracking-widest text-gray-800 leading-none`}>
                                    {product.woodColor}
                                </h3>
                                <p className={`${showImages ? 'text-2xl' : 'text-5xl'} font-black uppercase text-gray-900 mt-1`}>
                                    {product.material}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Middle Column (Image) - ONLY VISIBLE IF showImages is TRUE */}
                    {showImages && (
                        <div className="w-1/3 flex flex-col items-center text-center border-r-2 border-dotted border-gray-400 px-2 pt-1">
                            {product.imageUrl && (
                                <div className="w-full h-24 mb-2 flex items-center justify-center">
                                    <img src={product.imageUrl} alt={product.modelName} className="max-h-full max-w-full object-contain border border-gray-200 p-1 bg-white" />
                                </div>
                            )}

                            <h4 className="text-sm font-bold uppercase border-b border-gray-400 pb-1 mb-1 w-full">Capitonaj Capac</h4>
                            <p className="text-lg font-bold uppercase mb-2">{product.lidFeature}</p>

                            <div className="flex flex-col gap-1 mt-1">
                                {product.accessories.map((acc, idx) => (
                                    <p key={idx} className="text-sm font-semibold uppercase leading-tight">{acc}</p>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Right Column */}
                    <div className={`${showImages ? 'w-1/3' : 'w-1/2'} flex flex-col items-center text-center pl-2 pt-2`}>

                        {/* If NO images, move the Capitonaj info here with bigger text */}
                        {!showImages && (
                            <div className="mb-4 w-full border-b-2 border-gray-300 pb-2">
                                <h4 className="text-xl font-bold uppercase text-gray-500">Capitonaj: <span className="text-black">{product.lidFeature}</span></h4>
                                <div className="flex flex-wrap justify-center gap-2 mt-1">
                                    {product.accessories.map((acc, idx) => (
                                        <span key={idx} className="text-lg font-bold uppercase border border-gray-400 px-2">{acc}</span>
                                    ))}
                                </div>
                            </div>
                        )}

                        <h4 className={`${showImages ? 'text-sm' : 'text-xl'} font-bold uppercase border-b border-gray-400 pb-1 mb-2 w-full`}>Cruce Inscripționată:</h4>
                        <ul className="w-full">
                            {product.crossOptions.map((opt, idx) => (
                                <li key={idx} className={`flex justify-between ${showImages ? 'text-sm' : 'text-xl'} font-bold uppercase px-1 mb-1`}>
                                    <span>{opt.type}</span>
                                    <span>{opt.price} LEI</span>
                                </li>
                            ))}
                        </ul>

                        <div className="mt-auto w-full mb-2">
                            <div className={`flex justify-between ${showImages ? 'text-sm' : 'text-xl'} font-bold uppercase px-1 mb-1`}>
                                <span>ACCESORII:</span>
                                <span>{product.accessoriesPrice} LEI</span>
                            </div>
                            <div className={`flex justify-between ${showImages ? 'text-sm' : 'text-xl'} font-bold uppercase px-1`}>
                                <span>CRUCIFIX:</span>
                                <span>{product.crucifixPrice} LEI</span>
                            </div>
                            {/* Barcode Area - SCALED UP when no images */}
                            <div className="mt-2 text-right opacity-80 flex flex-col items-end">
                                <div style={{ transform: showImages ? 'scaleX(2)' : 'scale(2.5) translateX(-20%)', transformOrigin: 'right bottom' }}>
                                    <span style={{ fontFamily: "'Libre Barcode EAN13 Text'" }} className={`${showImages ? 'text-5xl' : 'text-6xl'} leading-none`}>{encodedCode}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Bottom Section: Specs */}
                <div className="h-1/4 border-t-2 border-gray-800 flex mt-1 pt-1">
                    <div className="w-1/2 flex flex-col items-center justify-center border-r border-gray-400">
                        <h5 className={`${showImages ? 'text-sm' : 'text-xl'} font-bold uppercase mb-1 text-gray-600`}>Dimensiuni:</h5>
                        <p className={`${showImages ? 'text-2xl' : 'text-4xl'} font-black uppercase`}>
                            {[
                                product.dimensions.length > 0 ? `L-${product.dimensions.length}` : null,
                                product.dimensions.width > 0 ? `l-${product.dimensions.width}` : null,
                                product.dimensions.height > 0 ? `H-${product.dimensions.height}` : null
                            ].filter(Boolean).join(', ')} CM
                        </p>
                    </div>
                    <div className="w-1/2 flex flex-col items-center justify-center">
                        <h5 className={`${showImages ? 'text-sm' : 'text-xl'} font-bold uppercase mb-1 text-gray-600`}>Greutate Suportată:</h5>
                        <p className={`${showImages ? 'text-2xl' : 'text-4xl'} font-black`}>
                            Până la: {product.weightCapacityMin}-{product.weightCapacityMax} KG
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

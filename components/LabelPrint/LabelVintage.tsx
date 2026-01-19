
import React from 'react';
import { Product } from '../../types/labelTypes';
import { encodeEAN13 } from '../../utils/labelUtils';

interface LabelProps {
    product: Product;
    logoUrl: string | null;
    showImages: boolean;
}

export const LabelVintage: React.FC<LabelProps> = ({ product, logoUrl, showImages }) => {
    const encodedCode = encodeEAN13(product.code);

    return (
        <div className="w-[180mm] h-[130mm] bg-[#fdfbf7] p-3 box-border overflow-hidden relative text-[#4a4a4a]">
            {/* Vintage Border */}
            <div className="w-full h-full border-4 border-double border-[#8d6e63] rounded-lg p-1 relative">
                <div className="w-full h-full border border-[#8d6e63] rounded p-3 flex flex-col relative">

                    {/* Corners */}
                    <div className="absolute top-0 left-0 w-6 h-6 border-t-4 border-l-4 border-[#8d6e63] rounded-tl-lg"></div>
                    <div className="absolute top-0 right-0 w-6 h-6 border-t-4 border-r-4 border-[#8d6e63] rounded-tr-lg"></div>
                    <div className="absolute bottom-0 left-0 w-6 h-6 border-b-4 border-l-4 border-[#8d6e63] rounded-bl-lg"></div>
                    <div className="absolute bottom-0 right-0 w-6 h-6 border-b-4 border-r-4 border-[#8d6e63] rounded-br-lg"></div>

                    <div className="flex justify-between items-center mb-2 border-b-2 border-[#d7ccc8] pb-2">
                        <div className="w-1/4">
                            {logoUrl ? (
                                <img src={logoUrl} alt="Logo" className="max-h-14 max-w-full object-contain grayscale opacity-80" />
                            ) : (
                                <div className="text-[10px] text-center border p-1 italic">Logo</div>
                            )}
                            <div className="text-[9px] uppercase font-bold text-[#8d6e63] mt-1 text-center">{product.furnizor}</div>
                        </div>
                        <div className="text-center w-1/2">
                            <h1 className={`font-serif ${showImages ? 'text-3xl' : 'text-5xl'} text-[#5d4037] font-bold tracking-tight uppercase leading-none`}>{product.modelName}</h1>
                            <p className="font-serif italic text-[#8d6e63] text-sm">{product.woodColor} &mdash; {product.sidesType}</p>
                            <p className={`font-bold uppercase text-[#3e2723] ${showImages ? 'text-xl' : 'text-3xl'} mt-1`}>{product.material}</p>
                        </div>
                        <div className="w-1/4 text-right">
                            <div className="inline-block border-2 border-[#5d4037] p-1.5 rounded transform rotate-[-2deg] bg-[#efebe9]">
                                <p className={`${showImages ? 'text-xl' : 'text-4xl'} font-bold leading-none`}>{product.price}</p>
                                <p className="text-[10px] font-bold text-center">{product.currency}</p>
                            </div>
                        </div>
                    </div>

                    <div className="flex-grow grid grid-cols-12 gap-4">
                        {/* Left Text: Grows to col-span-6 if no images */}
                        <div className={showImages ? 'col-span-4' : 'col-span-6'}>
                            <h3 className="font-bold border-b border-[#8d6e63] mb-1 text-[#5d4037] uppercase text-xs">Specificații</h3>
                            <div className="pl-2 border-l-2 border-[#d7ccc8]">
                                <p className={`font-serif ${showImages ? 'text-lg' : 'text-2xl'} mb-1`}>{product.lidFeature}</p>
                                <ul className={`${showImages ? 'text-xs' : 'text-sm font-semibold'} list-disc list-inside space-y-0.5 italic text-gray-700`}>
                                    {product.accessories.map((acc, i) => (
                                        <li key={i}>{acc}</li>
                                    ))}
                                </ul>
                            </div>
                            <div className="mt-4">
                                <h3 className="font-bold border-b border-[#8d6e63] mb-1 text-[#5d4037] uppercase text-xs">Extra</h3>
                                <div className={`${showImages ? 'text-xs' : 'text-sm font-semibold'}`}>
                                    {product.crossOptions.map((opt, i) => (
                                        <div key={i} className="flex justify-between">
                                            <span>{opt.type}</span>
                                            <span className="font-bold">{opt.price} Lei</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Center Image: Hidden if no images */}
                        {showImages && (
                            <div className="col-span-4 flex flex-col items-center justify-center">
                                {product.imageUrl && (
                                    <div className="bg-white p-2 shadow-md border border-[#d7ccc8] transform rotate-1">
                                        <img src={product.imageUrl} alt="Product" className="w-full h-auto max-h-32 object-contain sepia-[.3]" />
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Right Costs & Specs: Grows to col-span-6 if no images */}
                        <div className={showImages ? 'col-span-4 text-right' : 'col-span-6 text-right'}>
                            <h3 className="font-bold border-b border-[#8d6e63] mb-1 text-[#5d4037] uppercase text-xs">Totaluri</h3>
                            <table className={`w-full ${showImages ? 'text-xs' : 'text-sm'}`}>
                                <tbody>
                                    <tr>
                                        <td className="py-1 italic pt-2">Accesorii</td>
                                        <td className="text-right pt-2 font-bold">{product.accessoriesPrice} Lei</td>
                                    </tr>
                                    <tr>
                                        <td className="py-1 italic">Crucifix</td>
                                        <td className="text-right font-bold">{product.crucifixPrice} Lei</td>
                                    </tr>
                                </tbody>
                            </table>

                            <div className="mt-4 border border-[#d7ccc8] p-2 bg-[#efebe9] text-center shadow-sm relative">
                                <p className="text-[10px] uppercase text-[#8d6e63]">Dimensiuni & Greutate</p>
                                <p className={`font-black ${showImages ? 'text-lg' : 'text-2xl'} text-[#3e2723] leading-none mb-1`}>{product.dimensions.length} x {product.dimensions.width} x {product.dimensions.height} cm</p>
                                <p className={`font-black ${showImages ? 'text-lg' : 'text-2xl'} text-[#3e2723] leading-none`}>{product.weightCapacityMin}-{product.weightCapacityMax} kg</p>
                            </div>

                            {/* EAN-13 Barcode */}
                            <div className="mt-2 opacity-80 transform rotate-1 text-right flex flex-col items-end">
                                <div style={{ transform: showImages ? 'scaleX(2)' : 'scale(2.5) translateX(-20%)', transformOrigin: 'right' }}>
                                    <span style={{ fontFamily: "'Libre Barcode EAN13 Text'" }} className="text-5xl leading-none">{encodedCode}</span>
                                </div>
                            </div>
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
};

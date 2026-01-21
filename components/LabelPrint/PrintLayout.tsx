
import React from 'react';
import { createPortal } from 'react-dom';
import { Product, TemplateStyle } from '../../types/labelTypes';
import { LabelClassic } from './LabelClassic';
import { LabelModern } from './LabelModern';
import { LabelMinimal } from './LabelMinimal';
import { LabelElegant } from './LabelElegant';
import { LabelRoyal } from './LabelRoyal';
import { LabelVintage } from './LabelVintage';
import { LabelPrestige } from './LabelPrestige';
import { LabelOrnamental } from './LabelOrnamental';

interface PrintLayoutProps {
    products: Product[];
    template: TemplateStyle;
    logoUrl: string | null;
    showImages: boolean;
}

export const PrintLayout: React.FC<PrintLayoutProps> = ({ products, template, logoUrl, showImages }) => {
    // We need to chunk products into groups of 2 for each A4 page
    const pages = [];
    for (let i = 0; i < products.length; i += 2) {
        pages.push(products.slice(i, i + 2));
    }

    return createPortal(
        <div className="print-area">
            {pages.map((pageProducts, pageIndex) => (
                <div key={pageIndex} className="label-page">
                    {pageProducts.map((product) => (
                        <div key={product.id} className="label-container">
                            {(() => {
                                const props = { product, logoUrl, showImages };
                                switch (template) {
                                    case TemplateStyle.MODERN:
                                        return <LabelModern {...props} />;
                                    case TemplateStyle.MINIMAL:
                                        return <LabelMinimal {...props} />;
                                    case TemplateStyle.ELEGANT:
                                        return <LabelElegant {...props} />;
                                    case TemplateStyle.ROYAL:
                                        return <LabelRoyal {...props} />;
                                    case TemplateStyle.VINTAGE:
                                        return <LabelVintage {...props} />;
                                    case TemplateStyle.PRESTIGE:
                                        return <LabelPrestige {...props} />;
                                    case TemplateStyle.ORNAMENTAL:
                                        return <LabelOrnamental {...props} />;
                                    case TemplateStyle.CLASSIC:
                                    default:
                                        return <LabelClassic {...props} />;
                                }
                            })()}
                        </div>
                    ))}
                </div>
            ))}
        </div>,
        document.body
    );
};

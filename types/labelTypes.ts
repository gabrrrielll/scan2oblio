
export interface CrossOption {
    type: string;
    price: number;
}

export interface Product {
    id: string;
    code: string;
    modelName: string;
    sidesType: string;
    woodColor: string;
    material: string;
    furnizor: string;
    price: number;
    currency: string;
    sizeClass?: string;     // New field for size classification (M, L, XL, etc.)

    // Lid Details
    lidFeature: string;
    accessories: string[];

    // Right Column options
    crossOptions: CrossOption[];
    accessoriesPrice: number;
    crucifixPrice: number;

    // Footer
    dimensions: {
        length: number;
        width: number;
        height: number;
    };
    weightCapacityMin: number;
    weightCapacityMax: number;

    imageUrl?: string;
}

export enum TemplateStyle {
    CLASSIC = 'CLASSIC',
    MODERN = 'MODERN',
    MINIMAL = 'MINIMAL',
    ELEGANT = 'ELEGANT',
    ROYAL = 'ROYAL',
    VINTAGE = 'VINTAGE',
    PRESTIGE = 'PRESTIGE',
    ORNAMENTAL = 'ORNAMENTAL',
}

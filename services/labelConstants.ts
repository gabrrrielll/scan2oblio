
import { Product } from '../types/labelTypes';

export const GLOBAL_PRODUCT_DEFAULTS = {
    lidFeature: "RESPETĂ",
    accessories: ["PERNĂ", "ORAR MIC ȘI MARE", "PÂNZĂ FAȚĂ"],
    crossOptions: [
        { type: 'BRAD', price: 250 },
        { type: 'FAG', price: 350 },
        { type: 'TRIFOI', price: 350 }
    ],
    accessoriesPrice: 250,
    crucifixPrice: 100,
    dimensions: { length: 195, width: 60, height: 50 },
    weightCapacityMin: 100,
    weightCapacityMax: 120,
    currency: 'RON',
    imageUrl: 'https://funerare24.ro/wp-content/smush-webp/s03-f24-1500-lei.jpg.webp',
    showCompleteEchipat: true,
    showDetaliiInterior: true
};

export const SIZE_CLASSES = [
    { id: 'S', label: 'SOCIAL (S)', dims: { length: 180, width: 55, height: 45 }, weight: 100 },
    { id: 'M', label: 'STANDARD (M)', dims: { length: 190, width: 60, height: 45 }, weight: 100 },
    { id: 'L', label: 'LARGE (L)', dims: { length: 195, width: 60, height: 50 }, weight: 120 },
    { id: 'XL', label: 'EXTRA LARGE (XL)', dims: { length: 200, width: 65, height: 50 }, weight: 130 },
    { id: 'XXL', label: 'GIANT (XXL)', dims: { length: 210, width: 75, height: 55 }, weight: 150 },
];

export const EMPTY_PRODUCT: Product = {
    id: 'new',
    code: '',
    modelName: '',
    sidesType: '',
    woodColor: '',
    material: '',
    furnizor: '',
    price: 0,
    ...GLOBAL_PRODUCT_DEFAULTS,
    sizeClass: 'L'
};

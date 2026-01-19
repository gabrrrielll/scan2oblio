
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
    imageUrl: 'https://funerare24.ro/wp-content/smush-webp/s03-f24-1500-lei.jpg.webp'
};

export const EMPTY_PRODUCT: Product = {
    id: 'new',
    code: '',
    modelName: '',
    sidesType: '',
    woodColor: '',
    material: '',
    furnizor: '',
    price: 0,
    ...GLOBAL_PRODUCT_DEFAULTS
};

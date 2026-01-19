
import { Product } from '../types';

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

export const JSON_EXAMPLE_content = `[
  {
    "Denumire produs": "PADOVA BOSTON",
    "Tip": "Marfa",
    "Cod produs": "5940000000011",
    "Stoc": 0,
    "U.M.": "BUC",
    "Cost achizitie fara TVA": 1150,
    "Moneda achizitie": "RON",
    "Pret vanzare": 3950,
    "Cota TVA": 19,
    "TVA inclus": "DA",
    "Moneda vanzare": "RON",
    "Furnizor": "BOSTON",
    "sidesType": "6 LATURI",
    "woodColor": "BOSTON",
    "material": "BRAD"
  },
  {
    "Denumire produs": "VERONA MAHON",
    "Tip": "Marfa",
    "Cod produs": "5940000000028",
    "Stoc": 0,
    "U.M.": "BUC",
    "Cost achizitie fara TVA": 950,
    "Moneda achizitie": "RON",
    "Pret vanzare": 2800,
    "Cota TVA": 19,
    "TVA inclus": "DA",
    "Moneda vanzare": "RON",
    "Furnizor": "Valforest",
    "sidesType": "4 LATURI",
    "woodColor": "MAHON",
    "material": "FAG"
  }
]`;

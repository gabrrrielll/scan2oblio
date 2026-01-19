
import { Product } from '../types';
import { generateEAN13 } from '../utils';

export const generateDemoData = (): Product[] => {
  const models = ['PADOVA', 'TORINO', 'VERONA', 'ROMA', 'MILANO', 'GENOVA', 'NAPOLI', 'FLORENTA', 'VENETIA', 'SICILIA'];
  const sides = ['4 LATURI', '6 LATURI', '8 LATURI'];
  const colors = ['BOSTON', 'MAHON', 'NUC', 'CIRES', 'WENGE', 'STEJAR', 'FAG NATUR', 'NEGRU', 'ALB', 'ANTRACIT'];
  const materials = ['BRAD', 'FAG', 'STEJAR', 'FRASIN', 'PIN', 'TEI'];
  const lids = ['RESPETĂ', 'SATIN', 'MATASE', 'CATIFEA'];
  const suppliers = ['BOSTON', 'ARAD', 'ORADEA', 'IMPORT'];

  const products: Product[] = [];

  for (let i = 1; i <= 20; i++) {
    const randomModel = models[Math.floor(Math.random() * models.length)];
    const randomSide = sides[Math.floor(Math.random() * sides.length)];
    const randomColor = colors[Math.floor(Math.random() * colors.length)];
    const randomMaterial = materials[Math.floor(Math.random() * materials.length)];
    const randomLid = lids[Math.floor(Math.random() * lids.length)];
    const randomSupplier = suppliers[Math.floor(Math.random() * suppliers.length)];
    const basePrice = 2000 + Math.floor(Math.random() * 50) * 100; // Random price step 100
    
    products.push({
      id: `demo-${i}`,
      code: generateEAN13(),
      modelName: randomModel,
      sidesType: randomSide,
      woodColor: randomColor,
      material: randomMaterial,
      furnizor: randomSupplier,
      price: basePrice,
      currency: 'LEI',
      lidFeature: randomLid,
      accessories: ['PERNĂ', 'ORAR MIC ȘI MARE', 'PÂNZĂ FAȚĂ'],
      crossOptions: [
        { type: 'BRAD', price: 250 },
        { type: 'FAG', price: 350 },
        { type: 'TRIFOI', price: 350 + Math.floor(Math.random() * 2) * 50 }
      ],
      accessoriesPrice: 250,
      crucifixPrice: 100,
      dimensions: {
        length: 195 + Math.floor(Math.random() * 10),
        width: 60 + Math.floor(Math.random() * 10),
        height: 50
      },
      weightCapacityMin: 100,
      weightCapacityMax: 120 + Math.floor(Math.random() * 3) * 10,
      imageUrl: 'https://funerare24.ro/wp-content/smush-webp/s03-f24-1500-lei.jpg.webp'
    });
  }

  return products;
};

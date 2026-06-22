const path = require('path');
const fs = require('fs');
const dotenv = require('dotenv');
const connectDB = require('../config/db');
const Product = require('../models/Product');
const { createProductData } = require('../utils/productGenerator');

dotenv.config({ path: path.resolve(__dirname, '../.env') });

const IMAGES_ROOT = path.resolve(__dirname, '../../frontend/src/images');

/* ── Canonical product categories and their image files ── */
const CATEGORIES = [
  {
    name: 'tws',
    images: [
      'amanz-hwGG6R1kxqg-unsplash.jpg',
      'andrey-matveev-0x0ImRD-Vw4-unsplash.jpg',
      'andrey-matveev-0yGqGMdx4_o-unsplash.jpg',
      'andrey-matveev-BNgfRl4g4cI-unsplash.jpg',
      'andrey-matveev-ElddEjq2pz8-unsplash.jpg',
      'andrey-matveev-nNzVfc-1_80-unsplash.jpg',
      'andrey-matveev-S9vwz7Uvnmg-unsplash.jpg',
      'andrey-matveev-z5stczZVL4c-unsplash.jpg',
      'i-m-zion-FNOgcnH20VQ-unsplash.jpg',
      'onur-binay-kQPw_UieMJQ-unsplash.jpg',
      'pablo-figueroa-qbNRQBsOxcc-unsplash.jpg',
      'sophia-stark-_buuYaWD6_U-unsplash.jpg',
      'still-life-wireless-cyberpunk-headphones.jpg',
      'theregisti-TUBEp7DPL9o-unsplash.jpg',
      'wireless-earbuds-with-neon-cyberpunk-style-lighting.jpg',
      'yasin-hasan-_h50cvQCj_M-unsplash.jpg',
    ],
  },
  {
    name: 'headphones',
    images: [
      'alexunder-hess-bWZAPKm0zZE-unsplash.jpg',
      'andrey-matveev-OnUG2D_cWpg-unsplash.jpg',
      'c-d-x-PDX_a_82obo-unsplash.jpg',
      'ciocan-ciprian-IFlTsdoU9Mo-unsplash.jpg',
      'cosmin-ursea-0QAe85hi_Mw-unsplash.jpg',
      'ervo-rocks-Zam8TvEgN5o-unsplash.jpg',
      'karan-mandre-5lJhMXg_zHk-unsplash.jpg',
      'kiran-ck-LSNJ-pltdu8-unsplash.jpg',
      'kiran-ck-RZmiDOpv1lM-unsplash.jpg',
      'luke-peterson-lUMj2Zv5HUE-unsplash.jpg',
      'michael-soledad-dJt4lxWy5nk-unsplash.jpg',
      'padmanav-borah-Dwxg6q1GlUc-unsplash.jpg',
      'petri-r-QsjLjEfhlZg-unsplash.jpg',
      'qasim-malick-HH-s1g79xX0-unsplash.jpg',
      'sam-grozyan-yDC3NXxrtyc-unsplash.jpg',
      'tomasz-gawlowski-YDZPdqv3FcA-unsplash.jpg',
      'totte-annerbrink-NehdOHCXsjs-unsplash.jpg',
    ],
  },
  {
    name: 'powerbanks',
    images: [
      'i-m-zion-APdfyW0Aq-E-unsplash.jpg',
      'i-m-zion-izkoD-tNR1o-unsplash.jpg',
      'i-m-zion-oQaSkM2IuAw-unsplash.jpg',
      'i-m-zion-SDzrZdS2_IE-unsplash.jpg',
      'robert-torres-CRVjL2q8IF8-unsplash.jpg',
      'robert-torres-s412XgdhShc-unsplash.jpg',
      'taitopia-render-umiOsSjP8YI-unsplash.jpg',
      'tonny-zhong-5NbAIWrBFx8-unsplash.jpg',
    ],
  },
  {
    name: 'smart_watch',
    images: [
      'andrey-matveev-XK7O4nGz3xY-unsplash.jpg',
      'daniel-storek-JM-qKEd1GMI-unsplash.jpg',
      'fernando-zamora-mhwozX2rV0A-unsplash.jpg',
      'heftiba-2zZpWlYx4Xc-unsplash.jpg',
      'neon-brand-sKrlRZ0EemU-unsplash.jpg',
    ],
  },
];

const seedProducts = async () => {
  try {
    await connectDB();
    console.log('Seeding products from canonical category definitions...\n');

    const products = [];

    for (const { name: category, images } of CATEGORIES) {
      const folder = path.join(IMAGES_ROOT, category);
      let count = 0;

      for (const file of images) {
        const imagePath = path.join(folder, file);
        if (!fs.existsSync(imagePath)) {
          console.warn(`  ⚠  ${category}/${file} — file not found, skipping`);
          continue;
        }
        products.push(createProductData({ category, imagePath: path.posix.join(category, file) }));
        count++;
      }

      console.log(`  ${category}: ${count} products`);
    }

    if (products.length === 0) {
      throw new Error('No product images found. Seed aborted.');
    }

    console.log(`\nWriting ${products.length} products to database (upsert by image)...`);
    const ops = products.map((p) => ({
      updateOne: {
        filter: { image: p.image },
        update: { $set: p },
        upsert: true,
      },
    }));
    const result = await Product.bulkWrite(ops, { ordered: false });

    const upserted = result.upsertedCount || 0;
    console.log(`\nSeed complete: ${products.length} products (${upserted} new, ${products.length - upserted} existing).`);
    process.exit(0);
  } catch (error) {
    console.error('Seed failed:', error.message || error);
    process.exit(1);
  }
};

seedProducts();

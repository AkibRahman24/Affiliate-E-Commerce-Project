const path = require('path');

const CATEGORY_TYPE_MAP = {
  headphones: 'electronics',
  powerbanks: 'electronics',
  tws: 'electronics',
  smart_watch: 'electronics',
  chargers: 'electronics',
  earbuds: 'electronics',
  speakers: 'electronics',
  phones: 'electronics',
  laptops: 'electronics',
  accessories: 'fashion',
  apparel: 'fashion',
  shoes: 'fashion',
  clothing: 'fashion',
  bags: 'fashion',
  furniture: 'home',
  decor: 'home',
  kitchen: 'home',
  bedding: 'home',
  sports: 'sports',
  outdoors: 'sports',
  fitness: 'sports',
  food: 'food',
  groceries: 'food',
  snacks: 'food',
};

const CATEGORY_TEMPLATES = {
  headphones: {
    base: 'Headphones',
    adjectives: ['Wireless', 'Noise Cancelling', 'Bluetooth', 'Studio', 'Gaming', 'Over-Ear', 'Premium', 'Comfort-Fit'],
    features: ['deep bass', 'crystal-clear sound', 'long battery life', 'foldable design', 'built-in microphone', 'adaptive noise cancellation', 'soft ear cushions'],
  },
  powerbanks: {
    base: 'Power Bank',
    adjectives: ['Fast Charge', 'Ultra Slim', 'Dual-Port', 'High Capacity', 'Portable', 'Rugged', 'Solar Ready', 'Compact'],
    features: ['rapid charging', 'multi-device support', 'smart protection', 'USB-C input', 'LED display', 'shock-resistant housing'],
  },
  tws: {
    base: 'True Wireless Earbuds',
    adjectives: ['Bluetooth', 'Noise Cancelling', 'Sport', 'Hi-Fi', 'Premium', 'Compact', 'Sweatproof', 'Stylish'],
    features: ['stable connection', 'touch controls', 'fast pairing', 'long playtime', 'low latency', 'secure fit'],
  },
  smart_watch: {
    base: 'Smart Watch',
    adjectives: ['Digital', 'Fitness', 'Premium', 'Waterproof', 'Sport', 'Stylish', 'Smart', 'Classic'],
    features: ['heart rate monitoring', 'step tracking', 'sleep analysis', 'notification alerts', 'long battery life', 'water resistant design'],
  },
  default: {
    base: null,
    adjectives: ['Premium', 'Deluxe', 'Modern', 'Classic', 'Essential', 'Advanced', 'Signature', 'Smart'],
    features: ['quality craftsmanship', 'reliable performance', 'sleek styling', 'unmatched comfort', 'durable materials', 'real-world convenience', 'expertly tuned design'],
  },
};

const randomFrom = (list) => list[Math.floor(Math.random() * list.length)];

const formatNameToken = (raw) => {
  return raw
    .replace(/[-_]+/g, ' ')
    .replace(/\b\w/g, (char) => char.toUpperCase())
    .trim();
};

const resolveCategoryType = (folderName) => CATEGORY_TYPE_MAP[folderName.toLowerCase()] || 'other';

const generateCategoryMetadata = (folderName) => {
  const normalized = folderName.toLowerCase();
  return CATEGORY_TEMPLATES[normalized] || {
    ...CATEGORY_TEMPLATES.default,
    base: formatNameToken(normalized),
  };
};

const generateProductName = (folderName) => {
  const template = generateCategoryMetadata(folderName);
  const suffixOptions = ['Pro', 'X', 'Elite', 'Max', 'Plus', 'Edition', 'Series', 'Lite'];
  const suffix = randomFrom(suffixOptions);
  const adjective = randomFrom(template.adjectives);
  const nameParts = [adjective, template.base, suffix].filter(Boolean);
  return nameParts.join(' ');
};

const generateDescription = (productName, folderName) => {
  const template = generateCategoryMetadata(folderName);
  const featureA = randomFrom(template.features);
  const featureB = randomFrom(template.features.filter((feature) => feature !== featureA));
  return `${productName} delivers ${featureA} and ${featureB}. This ${template.base.toLowerCase()} is crafted for everyday use with dependable performance and modern styling.`;
};

const createSlug = (text) => {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
};

const generatePrice = (folderName) => {
  const ranges = {
    tws: [2000, 5000],
    headphones: [2200, 5400],
    powerbanks: [1200, 4500],
    smart_watch: [3500, 6000],
  };
  const [min, max] = ranges[folderName.toLowerCase()] || [1500, 5000];
  return Math.floor(Math.random() * (max - min + 1)) + min;
};

const generateStock = () => Math.floor(Math.random() * 80) + 10;

const createProductData = ({ category, imagePath }) => {
  const productName = generateProductName(category);
  const imageBase = path.basename(imagePath, path.extname(imagePath));
  const uniqueSlug = `${productName} ${imageBase}`;

  return {
    name: productName,
    slug: createSlug(uniqueSlug),
    description: generateDescription(productName, category),
    price: generatePrice(category),
    image: `/images/${imagePath}`,
    stock: generateStock(),
    category,
    type: resolveCategoryType(category),
    isActive: true,
  };
};

module.exports = {
  createProductData,
};

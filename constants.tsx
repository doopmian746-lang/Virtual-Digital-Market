
import { Category, Product, Role, Order, Campaign } from './types';

export const CATEGORIES: Category[] = [
  { id: '1', name: 'Electronics', icon: 'fas fa-laptop', subcategories: ['Mobiles', 'Laptops', 'Tablets'] },
  { id: '2', name: 'Fashion', icon: 'fas fa-tshirt', subcategories: ['Men', 'Women', 'Kids'] },
  { id: '3', name: 'Home & Living', icon: 'fas fa-couch', subcategories: ['Kitchen', 'Furniture', 'Decor'] },
  { id: '4', name: 'Health & Beauty', icon: 'fas fa-spa', subcategories: ['Skincare', 'Makeup', 'Haircare'] },
  { id: '5', name: 'Groceries', icon: 'fas fa-apple-alt', subcategories: ['Fruits', 'Vegetables', 'Beverages'] },
  { id: '6', name: 'Sports', icon: 'fas fa-football-ball', subcategories: ['Fitness', 'Outdoor', 'Accessories'] },
];

const now = new Date();
const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000).toISOString();

export const MOCK_PRODUCTS: Product[] = [
  {
    id: 'p1',
    name: 'iPhone 15 Pro Max - 256GB',
    description: 'The latest flagship from Apple with Titanium design and A17 Pro chip.',
    brand: 'Apple',
    price: 345000,
    discountPrice: 330000,
    category: 'Electronics',
    images: ['https://picsum.photos/seed/iphone/600/600'],
    stock: 15,
    totalInitialStock: 50,
    soldCount: 35,
    sellerId: 's1',
    sellerName: 'Apple Store PK',
    rating: 4.8,
    reviewsCount: 120,
    isFlashSale: true,
    flashSaleEndsAt: tomorrow,
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString() // 1 day ago
  },
  {
    id: 'p2',
    name: 'Sony WH-1000XM5 Headphones',
    description: 'High-fidelity audio with industry-leading noise cancellation.',
    brand: 'Sony',
    price: 45000,
    discountPrice: 38000,
    category: 'Electronics',
    images: ['https://picsum.photos/seed/headphone/600/600'],
    stock: 50,
    totalInitialStock: 100,
    soldCount: 50,
    sellerId: 's2',
    sellerName: 'TechHub',
    rating: 4.5,
    reviewsCount: 85,
    isDailyDeal: true,
    dealEndsAt: tomorrow,
    createdAt: new Date().toISOString()
  },
  {
    id: 'p3',
    name: 'Leather Bomber Jacket',
    description: 'Premium faux leather jacket with ribbed cuffs and collar.',
    brand: 'ZARA',
    price: 12000,
    discountPrice: 8500,
    category: 'Fashion',
    images: ['https://picsum.photos/seed/jacket/600/600'],
    stock: 10,
    totalInitialStock: 50,
    soldCount: 40,
    sellerId: 's3',
    sellerName: 'StyleStudio',
    rating: 4.2,
    reviewsCount: 45,
    isFlashSale: true,
    flashSaleEndsAt: tomorrow,
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 48).toISOString()
  },
  {
    id: 'p4',
    name: 'Ergonomic Office Chair',
    description: 'Breathable mesh back with adjustable lumbar support.',
    brand: 'Interwood',
    price: 25000,
    category: 'Home & Living',
    images: ['https://picsum.photos/seed/chair/600/600'],
    stock: 20,
    sellerId: 's4',
    sellerName: 'ModernHome',
    rating: 4.7,
    reviewsCount: 30,
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 72).toISOString()
  },
  {
    id: 'p5',
    name: 'Advanced Hydra-Serum',
    description: 'Clinical grade hydration for all skin types.',
    brand: 'The Ordinary',
    price: 3500,
    discountPrice: 2800,
    category: 'Health & Beauty',
    images: ['https://picsum.photos/seed/serum/600/600'],
    stock: 100,
    totalInitialStock: 200,
    soldCount: 100,
    sellerId: 's5',
    sellerName: 'PureSkin',
    rating: 4.9,
    reviewsCount: 200,
    isDailyDeal: true,
    dealEndsAt: tomorrow,
    createdAt: new Date().toISOString()
  },
  {
    id: 'p6',
    name: 'Performance Running Shoes',
    description: 'Lightweight foam cushioning for long distance runs.',
    brand: 'Nike',
    price: 18000,
    category: 'Sports',
    images: ['https://picsum.photos/seed/shoes/600/600'],
    stock: 45,
    sellerId: 's6',
    sellerName: 'SportsPro',
    rating: 4.6,
    reviewsCount: 60,
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 120).toISOString()
  }
];

export const MOCK_ORDERS: Order[] = [
  {
    id: 'ORD-1001',
    userId: 'b1',
    // Fixed mapping to match OrderItem properties (orderId, productId, image, price, etc.)
    items: [
      {
        orderId: 'ORD-1001',
        productId: MOCK_PRODUCTS[0].id,
        name: MOCK_PRODUCTS[0].name,
        image: MOCK_PRODUCTS[0].images[0],
        quantity: 1,
        price: MOCK_PRODUCTS[0].discountPrice || MOCK_PRODUCTS[0].price,
        sellerId: MOCK_PRODUCTS[0].sellerId
      }
    ],
    total: 330000,
    status: 'PENDING',
    paymentMethod: 'COD',
    paymentStatus: 'UNPAID',
    // Added missing required shippingAddress property to fix TypeScript error
    shippingAddress: {
      fullName: 'John Doe',
      phone: '0300-1234567',
      address: 'House 123, Street 4, Satellite Town',
      city: 'Rawalpindi',
      province: 'Punjab'
    },
    createdAt: new Date().toISOString()
  }
];

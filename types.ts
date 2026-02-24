
export type Role = 'BUYER' | 'SELLER' | 'ADMIN';

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  avatar?: string;
}

export interface Category {
  id: string;
  name: string;
  icon: string;
  subcategories: string[];
}

export interface Campaign {
  id: string;
  name: string;
  image: string;
  link?: string;
}

export interface ProductAttribute {
  name: string;
  value: string;
}

export interface PackageDetails {
  size?: string;
  weight?: string;
  dimensions?: string;
}

export interface Product {
  id: string;
  sellerId: string;
  sellerName: string;
  name: string;
  description: string;
  brand?: string;
  price: number;
  discountPrice?: number;
  discountPercentage?: number;
  category: string;
  images: string[];
  stock: number;
  totalInitialStock?: number;
  soldCount?: number;
  rating: number;
  reviewsCount: number;
  isFlashSale?: boolean;
  isDailyDeal?: boolean;
  dealEndsAt?: string;
  flashSaleEndsAt?: string;
  sku?: string;
  createdAt: string;
  attributes?: ProductAttribute[];
  packageDetails?: PackageDetails;
}

export interface OrderItem {
  orderId: string;
  productId: string;
  name: string;
  image: string;
  quantity: number;
  price: number;
  sellerId: string;
}

// Expanded Order Status Flow
export type OrderStatus = 
  | 'PENDING' 
  | 'CONFIRMED' 
  | 'PICKED' 
  | 'PACKED' 
  | 'READY_TO_SHIP' 
  | 'SHIPPED' 
  | 'DELIVERED' 
  | 'CANCELLED';

export type PaymentStatus = 'PAID' | 'UNPAID';

export interface StatusLog {
  status: OrderStatus;
  timestamp: string;
}

export interface Order {
  id: string;
  userId: string;
  total: number;
  status: OrderStatus;
  paymentMethod: 'COD' | 'STRIPE';
  paymentStatus: PaymentStatus;
  shippingAddress: ShippingAddress;
  createdAt: string;
  trackingNumber?: string;
  courierName?: string;
  items?: OrderItem[];
  statusHistory?: StatusLog[]; // Tracking status changes
}

export interface ShippingAddress {
  fullName: string;
  phone: string;
  address: string;
  city: string;
  province: string;
  postalCode?: string;
  landmark?: string;
}

export interface CartItem extends Product {
  quantity: number;
}


import { Product, Order, OrderItem, ShippingAddress, OrderStatus, CartItem, User } from '../types';
import { MOCK_PRODUCTS } from '../constants';

const STORAGE_KEYS = {
  PRODUCTS: 'vdm_products_table',
  ORDERS: 'vdm_orders_table',
  ORDER_ITEMS: 'vdm_order_items_table',
  USERS: 'vdm_users_table'
};

const getTable = <T>(key: string): T[] => {
  const data = localStorage.getItem(key);
  return data ? JSON.parse(data) : [];
};

const saveTable = <T>(key: string, data: T[]) => {
  localStorage.setItem(key, JSON.stringify(data));
};

// Initial data setup
if (getTable(STORAGE_KEYS.PRODUCTS).length === 0) {
  saveTable(STORAGE_KEYS.PRODUCTS, MOCK_PRODUCTS);
}

// Default admin user
if (getTable(STORAGE_KEYS.USERS).length === 0) {
  saveTable(STORAGE_KEYS.USERS, [{
    id: 's1',
    name: 'My Store',
    email: 'admin@gmail.com',
    password: '123456',
    role: 'SELLER'
  }]);
}

export const api = {
  // --- Users API ---
  async login(email: string, password: string): Promise<User> {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        const users = getTable<any>(STORAGE_KEYS.USERS);
        const user = users.find(u => u.email === email && u.password === password);
        if (user) {
          const { password, ...userWithoutPassword } = user;
          resolve(userWithoutPassword);
        } else {
          reject(new Error("Invalid email or password"));
        }
      }, 500);
    });
  },

  async register(userData: any): Promise<User> {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        const users = getTable<any>(STORAGE_KEYS.USERS);
        if (users.find(u => u.email === userData.email)) {
          reject(new Error("Email already exists"));
          return;
        }
        const newUser = { ...userData, id: `u${Date.now()}` };
        users.push(newUser);
        saveTable(STORAGE_KEYS.USERS, users);
        const { password, ...userWithoutPassword } = newUser;
        resolve(userWithoutPassword);
      }, 500);
    });
  },

  // --- Products API ---
  async fetchProducts(): Promise<Product[]> {
    return new Promise((resolve) => {
      setTimeout(() => {
        const data = getTable<Product>(STORAGE_KEYS.PRODUCTS);
        resolve(data.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
      }, 300);
    });
  },

  async addProduct(product: Product): Promise<Product> {
    const products = getTable<Product>(STORAGE_KEYS.PRODUCTS);
    products.unshift(product);
    saveTable(STORAGE_KEYS.PRODUCTS, products);
    return product;
  },

  async updateProduct(id: string, updates: Partial<Product>): Promise<Product> {
    const products = getTable<Product>(STORAGE_KEYS.PRODUCTS);
    const index = products.findIndex(p => p.id === id);
    if (index === -1) throw new Error("Product not found");
    products[index] = { ...products[index], ...updates };
    saveTable(STORAGE_KEYS.PRODUCTS, products);
    return products[index];
  },

  async deleteProduct(id: string): Promise<void> {
    const products = getTable<Product>(STORAGE_KEYS.PRODUCTS);
    saveTable(STORAGE_KEYS.PRODUCTS, products.filter(p => p.id !== id));
  },

  // --- Orders API ---
  async createOrder(userId: string, cartItems: CartItem[], address: ShippingAddress, method: 'COD' | 'STRIPE'): Promise<Order> {
    const orderId = `ORD-${Math.floor(Math.random() * 900000 + 100000)}`;
    const subtotal = cartItems.reduce((sum, item) => sum + (item.discountPrice || item.price) * item.quantity, 0);
    
    const newOrder: Order = {
      id: orderId,
      userId,
      total: subtotal + 250,
      status: 'PENDING',
      paymentMethod: method,
      paymentStatus: method === 'STRIPE' ? 'PAID' : 'UNPAID',
      shippingAddress: address,
      createdAt: new Date().toISOString(),
      statusHistory: [{ status: 'PENDING', timestamp: new Date().toISOString() }]
    };

    const orderItems: OrderItem[] = cartItems.map(item => ({
      orderId,
      productId: item.id,
      name: item.name,
      image: item.images[0],
      quantity: item.quantity,
      price: item.discountPrice || item.price,
      sellerId: item.sellerId
    }));

    const allOrders = getTable<Order>(STORAGE_KEYS.ORDERS);
    allOrders.unshift(newOrder);
    saveTable(STORAGE_KEYS.ORDERS, allOrders);

    const allOrderItems = getTable<OrderItem>(STORAGE_KEYS.ORDER_ITEMS);
    saveTable(STORAGE_KEYS.ORDER_ITEMS, [...orderItems, ...allOrderItems]);

    const allProducts = getTable<Product>(STORAGE_KEYS.PRODUCTS);
    const updatedProducts = allProducts.map(p => {
      const purchased = cartItems.find(ci => ci.id === p.id);
      if (purchased) {
        return {
          ...p,
          stock: Math.max(0, p.stock - purchased.quantity),
          soldCount: (p.soldCount || 0) + purchased.quantity
        };
      }
      return p;
    });
    saveTable(STORAGE_KEYS.PRODUCTS, updatedProducts);

    return { ...newOrder, items: orderItems };
  },

  async fetchCustomerOrders(userId: string): Promise<Order[]> {
    const orders = getTable<Order>(STORAGE_KEYS.ORDERS).filter(o => o.userId === userId || userId === 'guest');
    const allItems = getTable<OrderItem>(STORAGE_KEYS.ORDER_ITEMS);
    return orders.map(o => ({
      ...o,
      items: allItems.filter(item => item.orderId === o.id)
    }));
  },

  async fetchSellerOrders(sellerId: string): Promise<Order[]> {
    const allItems = getTable<OrderItem>(STORAGE_KEYS.ORDER_ITEMS);
    const sellerOrderIds = Array.from(new Set(allItems.filter(item => item.sellerId === sellerId).map(i => i.orderId)));
    
    const allOrders = getTable<Order>(STORAGE_KEYS.ORDERS);
    return allOrders
      .filter(o => sellerOrderIds.includes(o.id))
      .map(o => ({
        ...o,
        items: allItems.filter(item => item.orderId === o.id && item.sellerId === sellerId)
      }));
  },

  async updateOrderStatus(orderId: string, status: OrderStatus, trackingNumber?: string, courierName?: string): Promise<void> {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        const orders = getTable<Order>(STORAGE_KEYS.ORDERS);
        const index = orders.findIndex(o => o.id === orderId);
        if (index === -1) {
          reject(new Error("Order not found"));
          return;
        }

        const oldStatus = orders[index].status;
        orders[index].status = status;
        if (trackingNumber) orders[index].trackingNumber = trackingNumber;
        if (courierName) orders[index].courierName = courierName;
        
        // Log status change
        if (!orders[index].statusHistory) orders[index].statusHistory = [];
        orders[index].statusHistory.push({ status, timestamp: new Date().toISOString() });

        saveTable(STORAGE_KEYS.ORDERS, orders);

        if (status === 'CANCELLED' && oldStatus !== 'CANCELLED') {
          const orderItems = getTable<OrderItem>(STORAGE_KEYS.ORDER_ITEMS).filter(i => i.orderId === orderId);
          const products = getTable<Product>(STORAGE_KEYS.PRODUCTS);
          const updatedProducts = products.map(p => {
            const item = orderItems.find(oi => oi.productId === p.id);
            if (item) {
              return {
                ...p,
                stock: p.stock + item.quantity,
                soldCount: Math.max(0, (p.soldCount || 0) - item.quantity)
              };
            }
            return p;
          });
          saveTable(STORAGE_KEYS.PRODUCTS, updatedProducts);
        }
        resolve();
      }, 500); // Artificial delay for loading states
    });
  }
};

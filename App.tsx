
import React, { useState, useEffect, useMemo } from 'react';
import { Product, User, CartItem, Role, Order, ShippingAddress } from './types';
import { api } from './services/api';
import Navbar from './components/Navbar';
import ProductCard from './components/ProductCard';
import CartModal from './components/CartModal';
import SellerDashboard from './components/SellerDashboard';
import CheckoutView from './components/CheckoutView';
import OrderHistory from './components/OrderHistory';
import ListingView from './components/ListingView';
import LoginView from './components/LoginView';
import Logo from './components/Logo';

type ViewState = 'home' | 'search' | 'seller_dashboard' | 'checkout' | 'my_orders' | 'new_arrivals' | 'daily_deals' | 'flash_sale' | 'category' | 'login';

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [view, setView] = useState<ViewState>('home');
  const [searchQuery, setSearchQuery] = useState('');
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [notification, setNotification] = useState<{message: string, type: 'success' | 'error'} | null>(null);
  const [directCheckoutProduct, setDirectCheckoutProduct] = useState<Product | null>(null);

  // Initialize App
  useEffect(() => {
    const init = async () => {
      setLoading(true);
      const savedUser = localStorage.getItem('vdm_user');
      if (savedUser) {
        const u = JSON.parse(savedUser);
        setUser(u);
        if (u.role === 'SELLER') setView('seller_dashboard');
      }

      const savedCart = localStorage.getItem('vdm_cart');
      if (savedCart) setCart(JSON.parse(savedCart));

      const fetchedProducts = await api.fetchProducts();
      setProducts(fetchedProducts);
      setLoading(false);
    };
    init();
  }, []);

  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => setNotification(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [notification]);

  // Sync products when user is in Seller Dashboard
  useEffect(() => {
    if (view === 'seller_dashboard') {
      if (!user) {
        setView('login');
        return;
      }
      api.fetchProducts().then(setProducts);
    }
  }, [view, user]);

  // Fetch orders when view changes to history
  useEffect(() => {
    if (view === 'my_orders' && user) {
      api.fetchCustomerOrders(user.id).then(setOrders);
    }
  }, [view, user]);

  useEffect(() => { localStorage.setItem('vdm_cart', JSON.stringify(cart)); }, [cart]);

  // Filter products for customer views: Must have stock > 0
  const activeProducts = useMemo(() => {
    const now = new Date();
    return products.filter(p => {
      // Stock requirement
      if (p.stock <= 0) return false;
      // Date validity for deals
      if (p.isDailyDeal && p.dealEndsAt && new Date(p.dealEndsAt) < now) return false;
      if (p.isFlashSale && p.flashSaleEndsAt && new Date(p.flashSaleEndsAt) < now) return false;
      return true;
    });
  }, [products]);

  const filteredProducts = useMemo(() => {
    let result = activeProducts;
    if (view === 'search' && searchQuery) {
      result = result.filter(p => p.name.toLowerCase().includes(searchQuery.toLowerCase()) || p.description.toLowerCase().includes(searchQuery.toLowerCase()));
    } else if (view === 'new_arrivals') {
      result = [...result].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    } else if (view === 'daily_deals') {
      result = result.filter(p => p.isDailyDeal);
    } else if (view === 'flash_sale') {
      result = result.filter(p => p.isFlashSale);
    } else if (view === 'category' && selectedCategory) {
      result = result.filter(p => p.category === selectedCategory);
    }
    return result;
  }, [activeProducts, view, searchQuery, selectedCategory]);

  const handleAddToCart = (product: Product) => {
    setCart(prev => {
      const existing = prev.find(item => item.id === product.id);
      if (existing) return prev.map(item => item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item);
      return [...prev, { ...product, quantity: 1 }];
    });
    setIsCartOpen(true);
  };

  const handleUpdateCartQuantity = (id: string, delta: number) => {
    setCart(prev => prev.map(item => item.id === id ? { ...item, quantity: Math.max(1, item.quantity + delta) } : item));
  };

  const handleRemoveFromCart = (id: string) => {
    setCart(prev => prev.filter(item => item.id !== id));
  };

  const handlePlaceOrder = async (address: ShippingAddress, method: 'COD' | 'STRIPE') => {
    if (!user) {
      handleLogin('BUYER');
    }
    const finalUserId = user?.id || 'guest';
    const itemsToOrder = directCheckoutProduct ? [{ ...directCheckoutProduct, quantity: 1 }] : cart;
    
    await api.createOrder(finalUserId, itemsToOrder, address, method);
    
    // Refresh local state immediately
    const refreshedProducts = await api.fetchProducts();
    setProducts(refreshedProducts);
    
    if (!directCheckoutProduct) {
      setCart([]);
    } else {
      setDirectCheckoutProduct(null);
    }
    
    setView('my_orders');
    window.scrollTo(0, 0);
  };

  const handleDirectOrder = (product: Product) => {
    setDirectCheckoutProduct(product);
    setView('checkout');
    window.scrollTo(0, 0);
  };

  const handleUpdateOrder = async (id: string, status: any, trackingNumber?: string) => {
    await api.updateOrderStatus(id, status, trackingNumber);
    if (user) {
      const updatedOrders = await api.fetchCustomerOrders(user.id);
      setOrders(updatedOrders);
    }
    const refreshedProducts = await api.fetchProducts();
    setProducts(refreshedProducts);
  };

  const handleLogin = (role: Role) => {
    setView('login');
  };

  const handleLoginSuccess = (loggedInUser: User) => {
    setUser(loggedInUser);
    localStorage.setItem('vdm_user', JSON.stringify(loggedInUser));
    if (loggedInUser.role === 'SELLER') setView('seller_dashboard');
    else setView('home');
    window.scrollTo(0, 0);
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('vdm_user');
    setView('login');
  };

  const goHome = () => {
    setView('home');
    setSelectedCategory(null);
    setSearchQuery('');
    window.scrollTo(0, 0);
  };

  const handleAddProduct = async (p: Partial<Product>) => {
    const newProduct = await api.addProduct({ ...p, id: `p${Date.now()}`, createdAt: new Date().toISOString() } as Product);
    setProducts(prev => [newProduct, ...prev]);
  };

  const handleUpdateProduct = async (id: string, u: Partial<Product>) => {
    const updated = await api.updateProduct(id, u);
    setProducts(prev => prev.map(p => p.id === id ? updated : p));
  };

  const handleDeleteProduct = async (id: string) => {
    await api.deleteProduct(id);
    setProducts(prev => prev.filter(p => p.id !== id));
  };

  const handleUpdateSellerName = (newName: string) => {
    if (user) {
      const updatedUser = { ...user, name: newName };
      setUser(updatedUser);
      localStorage.setItem('vdm_user', JSON.stringify(updatedUser));
    }
  };

  const renderProductRow = (title: string, productsToRender: Product[]) => (
    <section className="max-w-[1400px] mx-auto px-4 sm:px-8">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-900">{title}</h2>
        <button 
          onClick={() => {
            if (title.toLowerCase().includes("flash")) setView('flash_sale');
            else if (title.toLowerCase().includes("new")) setView('new_arrivals');
            else if (title.toLowerCase().includes("daily")) setView('daily_deals');
            else setView('new_arrivals');
          }}
          className="text-sm font-bold text-gray-900 hover:underline flex items-center gap-1"
        >
          View all
          <i className="fas fa-arrow-right text-[10px]"></i>
        </button>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-6">
        {productsToRender.map(p => (
          <ProductCard 
            key={p.id} 
            product={p} 
            onClick={() => {}} 
            onAddToCart={(e) => { e.stopPropagation(); handleAddToCart(p); }}
            onPlaceOrder={(e) => { e.stopPropagation(); handleDirectOrder(p); }}
          />
        ))}
      </div>
    </section>
  );

  if (loading) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-white">
        <div className="flex flex-col items-center gap-6">
          <div className="w-16 h-16 border-4 border-gray-100 border-t-[#FF5C00] rounded-full animate-spin"></div>
          <p className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-400">Loading Market Protocol</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white selection:bg-[#FF5C00] selection:text-white no-scrollbar">
      {notification && (
        <div className={`fixed top-24 left-1/2 -translate-x-1/2 z-[1000] px-6 py-3 rounded-xl shadow-xl flex items-center gap-3 animate-slide-up ${
          notification.type === 'success' ? 'bg-gray-900 text-white' : 'bg-red-500 text-white'
        }`}>
          <i className={`fas ${notification.type === 'success' ? 'fa-check-circle text-green-400' : 'fa-exclamation-circle'}`}></i>
          <span className="text-xs font-bold">{notification.message}</span>
        </div>
      )}
      <Navbar 
        user={user} 
        onLogout={handleLogout} 
        onSearch={q => { setSearchQuery(q); setView('search'); }} 
        cartCount={cart.reduce((s, i) => s + i.quantity, 0)} 
        onViewCart={() => setIsCartOpen(true)} 
        onOpenAuth={handleLogin} 
        onGoHome={goHome} 
        onViewOrders={() => setView('my_orders')} 
        onGoSellerCenter={() => {
          if (user?.role === 'SELLER') setView('seller_dashboard');
          else if (!user) setView('login');
          else alert('Please logout and login as a Seller to access this area.');
        }}
        onViewSection={(targetView, category) => {
          setView(targetView as any);
          if (category) setSelectedCategory(category);
          else setSelectedCategory(null);
          window.scrollTo(0, 0);
        }}
        hideCategories={view === 'seller_dashboard'} // Hide category strip on seller side
      />
      
      <main className={view === 'seller_dashboard' ? 'pt-24' : 'pt-36'}>
        {view === 'home' && (
          <div className="space-y-16 pb-24 animate-fade-in">
            {renderProductRow("Fresh from the market", activeProducts.slice(0, 6))}
            {renderProductRow("Deals you'll love", activeProducts.filter(p => p.isDailyDeal).slice(0, 6))}
            {renderProductRow("Flash sales", activeProducts.filter(p => p.isFlashSale).slice(0, 6))}
            {renderProductRow("Trending now", [...activeProducts].sort((a,b) => (b.soldCount || 0) - (a.soldCount || 0)).slice(0, 12))}
          </div>
        )}

        {(view === 'search' || view === 'new_arrivals' || view === 'daily_deals' || view === 'flash_sale' || view === 'category') && (
          <ListingView 
            title={
              view === 'search' ? `Results for "${searchQuery}"` :
              view === 'new_arrivals' ? "New Arrivals" :
              view === 'daily_deals' ? "Daily Hot Deals" :
              view === 'flash_sale' ? "Velocity Flash Sale" :
              selectedCategory || "Listing"
            }
            products={filteredProducts}
            onAddToCart={handleAddToCart}
            onPlaceOrder={handleDirectOrder}
          />
        )}

        {view === 'login' && <LoginView onLoginSuccess={handleLoginSuccess} onCancel={goHome} />}
        {view === 'seller_dashboard' && user?.role === 'SELLER' && (
          <SellerDashboard 
            user={user} 
            products={products} 
            onAddProduct={handleAddProduct} 
            onUpdateProduct={handleUpdateProduct} 
            onDeleteProduct={handleDeleteProduct} 
            onUpdateSellerName={handleUpdateSellerName}
            onLogout={handleLogout}
          />
        )}
        {view === 'checkout' && (
          <CheckoutView 
            items={directCheckoutProduct ? [{ ...directCheckoutProduct, quantity: 1 }] : cart} 
            onCancel={() => {
              setDirectCheckoutProduct(null);
              setView('home');
            }} 
            onPlaceOrder={handlePlaceOrder} 
          />
        )}
        {view === 'my_orders' && (
          <OrderHistory 
            orders={orders} 
            onGoShopping={goHome} 
            onCancelOrder={(id) => handleUpdateOrder(id, 'CANCELLED')}
          />
        )}
      </main>

      <CartModal isOpen={isCartOpen} onClose={() => setIsCartOpen(false)} items={cart} onUpdateQuantity={handleUpdateCartQuantity} onRemove={handleRemoveFromCart} onCheckout={() => { setIsCartOpen(false); setView('checkout'); }} />
      
      <footer className="bg-gray-900 py-32 mt-24">
        <div className="max-w-7xl mx-auto px-4 grid grid-cols-1 md:grid-cols-4 gap-12 text-white/50">
          <div className="col-span-1 md:col-span-2 space-y-8">
            <Logo textSize="text-2xl text-white" onClick={goHome} />
            <p className="max-w-md text-sm leading-relaxed text-white/70">Defining the parameters of modern commerce. A high-fidelity marketplace built for speed, security, and elite consumption.</p>
          </div>
          <div className="space-y-6">
            <h4 className="text-white font-black text-[10px] uppercase tracking-widest">Platform Node</h4>
            <ul className="space-y-3 text-sm">
              <li><a href="#" className="hover:text-white transition-colors">Privacy Protocol</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Merchant Guidelines</a></li>
            </ul>
          </div>
          <div className="space-y-6">
            <h4 className="text-white font-black text-[10px] uppercase tracking-widest">Support Core</h4>
            <ul className="space-y-3 text-sm">
              <li><a href="#" className="hover:text-white transition-colors">Help Terminal</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Logistics Tracking</a></li>
            </ul>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default App;

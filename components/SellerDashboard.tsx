
import React, { useState, useMemo, useEffect } from 'react';
import { Product, User, Order, OrderStatus, ProductAttribute, PackageDetails } from '../types';
import { CATEGORIES } from '../constants';
import { api } from '../services/api';
import { generateProductDescription, smartProductFill } from '../services/geminiService';

interface SellerDashboardProps {
  user: User;
  products: Product[];
  onAddProduct: (product: Partial<Product>) => void;
  onUpdateProduct: (id: string, updates: Partial<Product>) => void;
  onDeleteProduct: (id: string) => void;
  onUpdateSellerName: (newName: string) => void;
  onLogout: () => void;
}

type Tab = 'home' | 'orders' | 'products' | 'messages' | 'profile';
type OrderSubTab = 'active' | 'completed' | 'cancelled';
type StockFilter = 'all' | 'low_stock' | 'out_of_stock';
type SubView = 'list' | 'order_detail';

interface Notification {
  message: string;
  type: 'success' | 'error';
}

const SellerDashboard: React.FC<SellerDashboardProps> = ({ 
  user, products, onAddProduct, onUpdateProduct, onDeleteProduct, onUpdateSellerName, onLogout 
}) => {
  const [activeTab, setActiveTab] = useState<Tab>('home');
  const [activeSubView, setActiveSubView] = useState<SubView>('list');
  const [orderSubTab, setOrderSubTab] = useState<OrderSubTab>('active');
  const [stockFilter, setStockFilter] = useState<StockFilter>('all');
  const [sellerOrders, setSellerOrders] = useState<Order[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(false);
  const [processingOrder, setProcessingOrder] = useState<string | null>(null);
  const [notification, setNotification] = useState<Notification | null>(null);
  
  const [showAddModal, setShowAddModal] = useState(false);
  // Fix: Added missing formData state
  const [formData, setFormData] = useState({
    name: '',
    price: '',
    specialPrice: '',
    discountPercentage: '',
    stock: '',
    description: '',
    category: 'Electronics',
    brand: '',
    sku: '',
    weight: '',
    dimensions: '',
    images: [] as string[]
  });
  const [isGenerating, setIsGenerating] = useState(false);
  const [aiPrompt, setAiPrompt] = useState('');
  const [orderSearchQuery, setOrderSearchQuery] = useState('');
  const [invSearchQuery, setInvSearchQuery] = useState('');
  const [productSearchQuery, setProductSearchQuery] = useState('');
  const [productCategoryFilter, setProductCategoryFilter] = useState('All');
  const [productStockFilter, setProductStockFilter] = useState('all');
  const [productSort, setProductSort] = useState('newest');
  
  const [selectedOrderDetail, setSelectedOrderDetail] = useState<Order | null>(null);
  const [trackingModalOrder, setTrackingModalOrder] = useState<Order | null>(null);
  const [courierName, setCourierName] = useState('');
  const [trackingNumber, setTrackingNumber] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [confirmStatusModal, setConfirmStatusModal] = useState<{ id: string, nextStatus: OrderStatus, label: string } | null>(null);
  const [sellerName, setSellerName] = useState(() => localStorage.getItem('sellerName') || 'My Store');
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [newStoreName, setNewStoreName] = useState(sellerName);

  useEffect(() => {
    const fetchOrders = async () => {
      if (!['home', 'orders'].includes(activeTab)) return;
      setLoadingOrders(true);
      const data = await api.fetchSellerOrders(user.id);
      setSellerOrders(data);
      setLoadingOrders(false);
    };
    fetchOrders();
  }, [user.id, activeTab]);

  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => setNotification(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [notification]);

  const sellerProducts = useMemo(() => products.filter(p => p.sellerId === user.id), [products, user.id]);

  const filteredProducts = useMemo(() => {
    let list = [...sellerProducts];
    
    // Search
    if (productSearchQuery) {
      list = list.filter(p => p.name.toLowerCase().includes(productSearchQuery.toLowerCase()));
    }
    
    // Category
    if (productCategoryFilter !== 'All') {
      list = list.filter(p => p.category === productCategoryFilter);
    }
    
    // Stock Status
    if (productStockFilter === 'in_stock') {
      list = list.filter(p => p.stock > 0);
    } else if (productStockFilter === 'low_stock') {
      list = list.filter(p => p.stock > 0 && p.stock < 10);
    } else if (productStockFilter === 'out_of_stock') {
      list = list.filter(p => p.stock === 0);
    }
    
    // Sort
    if (productSort === 'newest') {
      list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    } else if (productSort === 'price_low') {
      list.sort((a, b) => a.price - b.price);
    } else if (productSort === 'price_high') {
      list.sort((a, b) => b.price - a.price);
    }
    
    return list;
  }, [sellerProducts, productSearchQuery, productCategoryFilter, productStockFilter, productSort]);

  const filteredOrders = useMemo(() => {
    let list = sellerOrders;
    if (orderSearchQuery) {
      list = list.filter(o => 
        o.id.toLowerCase().includes(orderSearchQuery.toLowerCase()) || 
        o.shippingAddress?.fullName.toLowerCase().includes(orderSearchQuery.toLowerCase())
      );
    }
    
    if (orderSubTab === 'active') {
      list = list.filter(o => !['DELIVERED', 'CANCELLED'].includes(o.status));
    } else if (orderSubTab === 'completed') {
      list = list.filter(o => o.status === 'DELIVERED');
    } else if (orderSubTab === 'cancelled') {
      list = list.filter(o => o.status === 'CANCELLED');
    }

    return list;
  }, [sellerOrders, orderSubTab, orderSearchQuery]);

  const inventoryList = useMemo(() => {
    let list = sellerProducts;
    if (invSearchQuery) list = list.filter(p => p.name.toLowerCase().includes(invSearchQuery.toLowerCase()) || p.sku?.toLowerCase().includes(invSearchQuery.toLowerCase()));
    if (stockFilter === 'low_stock') list = list.filter(p => p.stock > 0 && p.stock < 10);
    if (stockFilter === 'out_of_stock') list = list.filter(p => p.stock === 0);
    return list;
  }, [sellerProducts, invSearchQuery, stockFilter]);

  const executeStatusChange = async (id: string, nextStatus: OrderStatus) => {
    setProcessingOrder(id);
    try {
      await api.updateOrderStatus(id, nextStatus);
      const data = await api.fetchSellerOrders(user.id);
      setSellerOrders(data);
      setConfirmStatusModal(null);
      setNotification({ message: `Order successfully ${nextStatus.toLowerCase()}`, type: 'success' });
      
      const updatedOrder = data.find(o => o.id === id);
      if (updatedOrder) {
        setSelectedOrderDetail(updatedOrder);
        // "Jump" logic: if it was just confirmed, go to the detail page automatically
        if (nextStatus === 'CONFIRMED') {
          setActiveSubView('order_detail');
        }
      }
    } catch (err) {
      setNotification({ message: 'Operation failed. Please try again.', type: 'error' });
    } finally {
      setProcessingOrder(null);
    }
  };

  const confirmShipment = async () => {
    if (trackingModalOrder && trackingNumber && courierName) {
      setProcessingOrder(trackingModalOrder.id);
      try {
        await api.updateOrderStatus(trackingModalOrder.id, 'SHIPPED', trackingNumber, courierName);
        const data = await api.fetchSellerOrders(user.id);
        setSellerOrders(data);
        setTrackingModalOrder(null);
        setNotification({ message: 'Shipment confirmed successfully', type: 'success' });
        
        const updated = data.find(o => o.id === trackingModalOrder.id);
        if (updated) setSelectedOrderDetail(updated);
      } catch (err) {
        setNotification({ message: 'Shipment failed to initialize', type: 'error' });
      } finally {
        setProcessingOrder(null);
      }
    }
  };

  const getStatusStyle = (status: OrderStatus) => {
    switch (status) {
      case 'PENDING': return 'bg-amber-50 text-amber-600 border-amber-100';
      case 'SHIPPED': return 'bg-emerald-50 text-emerald-600 border-emerald-100';
      case 'DELIVERED': return 'bg-green-100 text-green-800 border-green-200';
      case 'CANCELLED': return 'bg-red-50 text-red-600 border-red-100';
      default: return 'bg-gray-50 text-gray-600 border-gray-100';
    }
  };

  const getStatusLabel = (status: OrderStatus) => {
    switch (status) {
      case 'PENDING': return 'To Process';
      case 'SHIPPED': return 'Shipping';
      case 'DELIVERED': return 'Completed';
      default: return status.replace(/_/g, ' ');
    }
  };

  const getNextAction = (status: OrderStatus): { label: string, next: OrderStatus } | null => {
    switch (status) {
      case 'PENDING': return { label: 'Accept Order', next: 'SHIPPED' };
      case 'SHIPPED': return { label: 'Mark as Delivered', next: 'DELIVERED' };
      default: return null;
    }
  };

  const ORDER_STEPS: OrderStatus[] = ['PENDING', 'CONFIRMED', 'PICKED', 'PACKED', 'READY_TO_SHIP', 'SHIPPED', 'DELIVERED'];

  const renderProgressIndicator = (currentStatus: OrderStatus) => {
    if (currentStatus === 'CANCELLED') return <div className="p-4 bg-red-50 text-red-700 rounded-2xl text-xs font-bold text-center">Order Cancelled</div>;
    
    const currentIndex = ORDER_STEPS.indexOf(currentStatus);
    
    return (
      <div className="flex items-center justify-between px-2 py-8 relative">
        <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-gray-100 -translate-y-1/2 z-0"></div>
        {ORDER_STEPS.map((step, idx) => {
          const isDone = idx <= currentIndex;
          const isCurrent = idx === currentIndex;
          return (
            <div key={step} className="relative z-10 flex flex-col items-center group">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center transition-all duration-500 border-4 ${
                isDone ? 'bg-[#FF5C00] border-orange-100 text-white' : 'bg-white border-gray-100 text-gray-300'
              } ${isCurrent ? 'scale-125 shadow-xl shadow-orange-500/20' : ''}`}>
                {isDone ? <i className="fas fa-check text-[10px]"></i> : <span className="text-[10px] font-bold">{idx + 1}</span>}
              </div>
              <span className={`absolute -bottom-8 whitespace-nowrap text-[8px] font-black uppercase tracking-tight ${isDone ? 'text-gray-900' : 'text-gray-300'}`}>
                {step.replace(/_/g, ' ')}
              </span>
            </div>
          );
        })}
      </div>
    );
  };

  const orderCounts = useMemo(() => {
    return {
      toProcess: sellerOrders.filter(o => ['PENDING', 'CONFIRMED', 'PICKED', 'PACKED', 'READY_TO_SHIP'].includes(o.status)).length,
      shipping: sellerOrders.filter(o => o.status === 'SHIPPED').length,
      review: sellerOrders.filter(o => o.status === 'DELIVERED').length
    };
  }, [sellerOrders]);

  const latestOrder = useMemo(() => {
    const sorted = [...sellerOrders].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    return sorted[0] || null;
  }, [sellerOrders]);

  const handleUpdateStoreName = () => {
    localStorage.setItem('sellerName', newStoreName);
    setSellerName(newStoreName);
    onUpdateSellerName(newStoreName);
    setShowSettingsModal(false);
    setNotification({ message: 'Store name updated successfully', type: 'success' });
  };

  const renderHome = () => (
    <div className="space-y-6 animate-fade-in pb-24">
      {/* Header Section */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-full bg-gray-100 border-2 border-white shadow-sm overflow-hidden">
            <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${sellerName}`} alt="Store" className="w-full h-full object-cover" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900">Seller Center</h1>
            <div className="flex items-center gap-2 mt-0.5">
              <p className="text-sm font-bold text-[#FF5C00]">{sellerName}</p>
              <span className="w-1 h-1 rounded-full bg-gray-300"></span>
              <p className="text-xs text-gray-500 font-medium">4.8 ★ (1.2k Followers)</p>
            </div>
          </div>
        </div>
        <button className="relative w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-sm border border-gray-100">
          <i className="fas fa-bell text-gray-600"></i>
          <span className="absolute top-2 right-2 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white"></span>
        </button>
      </div>

      {/* Important Notification Card */}
      {latestOrder && (
        <button 
          onClick={() => { setActiveTab('orders'); setOrderSubTab('active'); }}
          className="w-full bg-orange-50 border border-orange-100 rounded-2xl p-5 flex items-center justify-between group hover:bg-orange-100 transition-all text-left"
        >
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-[#FF5C00] shadow-sm">
              <i className="fas fa-shopping-cart"></i>
            </div>
            <div>
              <p className="text-sm font-bold text-gray-900">You've got a new order</p>
              <p className="text-xs text-gray-500 mt-0.5">Check details and start processing</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">{new Date(latestOrder.createdAt).toLocaleDateString()}</p>
            <i className="fas fa-chevron-right text-orange-300 mt-1 group-hover:translate-x-1 transition-transform"></i>
          </div>
        </button>
      )}

      {/* Order Summary Section */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
        <h3 className="text-sm font-bold text-gray-900 mb-6">Order Summary</h3>
        <div className="grid grid-cols-3 gap-4">
          <button 
            onClick={() => { setActiveTab('orders'); setOrderSubTab('active'); }}
            className="flex flex-col items-center gap-2 group"
          >
            <span className="text-2xl font-bold text-gray-900 group-hover:text-[#FF5C00] transition-colors">{orderCounts.toProcess}</span>
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">To Process</span>
          </button>
          <button 
            onClick={() => { setActiveTab('orders'); setOrderSubTab('active'); }}
            className="flex flex-col items-center gap-2 group border-x border-gray-100"
          >
            <span className="text-2xl font-bold text-gray-900 group-hover:text-[#FF5C00] transition-colors">{orderCounts.shipping}</span>
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Shipping</span>
          </button>
          <button 
            onClick={() => { setActiveTab('orders'); setOrderSubTab('completed'); }}
            className="flex flex-col items-center gap-2 group"
          >
            <span className="text-2xl font-bold text-gray-900 group-hover:text-[#FF5C00] transition-colors">{orderCounts.review}</span>
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Review</span>
          </button>
        </div>
      </div>

      {/* Learning / Info Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-gray-900">Seller Academy</h3>
          <button className="text-xs font-bold text-[#FF5C00]">View All</button>
        </div>
        <div className="flex gap-4 overflow-x-auto no-scrollbar pb-2">
          {[
            { title: 'How to boost sales', desc: '5 tips for better conversion', icon: 'fa-chart-line', color: 'bg-blue-50 text-blue-600' },
            { title: 'New policy update', desc: 'Effective from next month', icon: 'fa-file-alt', color: 'bg-purple-50 text-purple-600' },
            { title: 'Packaging guide', desc: 'Reduce damage during transit', icon: 'fa-box', color: 'bg-teal-50 text-teal-600' },
          ].map((tip, i) => (
            <div key={i} className="min-w-[240px] bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex flex-col gap-3">
              <div className={`w-10 h-10 ${tip.color} rounded-xl flex items-center justify-center`}>
                <i className={`fas ${tip.icon}`}></i>
              </div>
              <div>
                <h4 className="text-sm font-bold text-gray-900">{tip.title}</h4>
                <p className="text-xs text-gray-500 mt-1">{tip.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderMessages = () => (
    <div className="flex flex-col items-center justify-center py-20 text-center animate-fade-in">
      <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center text-gray-400 mb-6">
        <i className="fas fa-comments text-3xl"></i>
      </div>
      <h3 className="text-lg font-bold text-gray-900">Messages</h3>
      <p className="text-sm text-gray-500 mt-2 max-w-xs">Chat with your customers will appear here.</p>
    </div>
  );

  const renderProfile = () => (
    <div className="space-y-6 animate-fade-in pb-24">
      <div className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100 text-center">
        <div className="w-24 h-24 rounded-full bg-gray-100 border-4 border-white shadow-md mx-auto mb-4 overflow-hidden">
          <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${sellerName}`} alt="Profile" className="w-full h-full object-cover" />
        </div>
        <h2 className="text-xl font-bold text-gray-900">{sellerName}</h2>
        <p className="text-sm text-gray-500 font-medium">Official Store</p>
        
        <div className="grid grid-cols-3 gap-4 mt-8 pt-8 border-t border-gray-50">
          <div>
            <p className="text-lg font-bold text-gray-900">1.2k</p>
            <p className="text-[10px] font-bold text-gray-400 uppercase">Followers</p>
          </div>
          <div>
            <p className="text-lg font-bold text-gray-900">4.8</p>
            <p className="text-[10px] font-bold text-gray-400 uppercase">Rating</p>
          </div>
          <div>
            <p className="text-lg font-bold text-gray-900">98%</p>
            <p className="text-[10px] font-bold text-gray-400 uppercase">Response</p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-3xl overflow-hidden shadow-sm border border-gray-100">
        {[
          { icon: 'fa-store', label: 'Store Settings', onClick: () => setShowSettingsModal(true) },
          { icon: 'fa-shield-alt', label: 'Security' },
          { icon: 'fa-question-circle', label: 'Help Center' },
        ].map((item, i) => (
          <button key={i} onClick={item.onClick} className="w-full flex items-center justify-between p-5 hover:bg-gray-50 transition-colors border-b border-gray-50 last:border-0">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-gray-50 rounded-xl flex items-center justify-center text-gray-500">
                <i className={`fas ${item.icon}`}></i>
              </div>
              <span className="text-sm font-bold text-gray-700">{item.label}</span>
            </div>
            <i className="fas fa-chevron-right text-gray-300 text-xs"></i>
          </button>
        ))}
      </div>

      <button 
        onClick={onLogout}
        className="w-full py-4 bg-red-50 text-red-600 rounded-2xl font-bold text-sm hover:bg-red-100 transition-all flex items-center justify-center gap-3"
      >
        <i className="fas fa-sign-out-alt"></i>
        Log Out
      </button>
    </div>
  );
  const renderOrderDetail = (order: Order) => (
    <div className="space-y-10 animate-fade-in pb-20">
      <div className="flex items-center gap-6">
        <button onClick={() => setActiveSubView('list')} className="w-12 h-12 rounded-2xl bg-white border border-gray-100 text-gray-400 hover:text-gray-900 transition-all flex items-center justify-center">
          <i className="fas fa-arrow-left"></i>
        </button>
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Order Details</h2>
          <p className="text-sm text-[#FF5C00] font-bold mt-1">Order ID: #{order.id}</p>
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-2xl p-8 shadow-sm">
        <h5 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4">Order Progress</h5>
        {renderProgressIndicator(order.status)}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
        <div className="space-y-8">
           <div className="bg-white p-8 rounded-2xl border border-gray-200 relative overflow-hidden group">
              <h5 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-6">Customer Information</h5>
              <div className="space-y-2">
                <p className="text-lg font-bold text-gray-900">{order.shippingAddress?.fullName}</p>
                <p className="text-sm text-gray-500 font-medium leading-relaxed max-w-xs">{order.shippingAddress?.address}, {order.shippingAddress?.city}, {order.shippingAddress?.province}</p>
              </div>
              <div className="mt-8 pt-8 border-t border-gray-100 flex items-center gap-4">
                <div className="w-10 h-10 bg-gray-50 rounded-xl flex items-center justify-center text-[#FF5C00]"><i className="fas fa-phone"></i></div>
                <p className="text-sm font-bold text-gray-900">{order.shippingAddress?.phone}</p>
              </div>
           </div>

           <div className="bg-white p-8 rounded-2xl border border-gray-200">
              <h5 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-6">Payment & Shipping</h5>
              <div className="space-y-4">
                <div className="flex justify-between border-b border-gray-50 pb-3">
                  <span className="text-xs font-bold text-gray-400 uppercase">Method</span>
                  <span className="text-xs font-bold text-gray-900 uppercase">{order.paymentMethod}</span>
                </div>
                <div className="flex justify-between border-b border-gray-50 pb-3">
                  <span className="text-xs font-bold text-gray-400 uppercase">Payment</span>
                  <span className={`text-xs font-bold uppercase ${order.paymentStatus === 'PAID' ? 'text-green-600' : 'text-orange-600'}`}>{order.paymentStatus}</span>
                </div>
                {order.trackingNumber && (
                   <div className="pt-4 space-y-3">
                      <p className="text-xs font-bold text-gray-400 uppercase">Tracking Info</p>
                      <div className="bg-gray-50 p-4 rounded-xl flex justify-between items-center border border-gray-200">
                        <span className="text-xs font-bold uppercase">{order.courierName}</span>
                        <span className="text-xs font-bold text-[#FF5C00]">{order.trackingNumber}</span>
                      </div>
                   </div>
                )}
              </div>
           </div>

           {order.statusHistory && order.statusHistory.length > 0 && (
              <div className="bg-white p-8 rounded-2xl border border-gray-200">
                <h5 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-6">Status History</h5>
                <div className="space-y-4">
                  {order.statusHistory.map((log, i) => (
                    <div key={i} className="flex justify-between items-center text-xs">
                      <span className="font-bold uppercase text-gray-400">{log.status}</span>
                      <span className="font-medium text-gray-900">{new Date(log.timestamp).toLocaleString()}</span>
                    </div>
                  ))}
                </div>
              </div>
           )}
        </div>

        <div className="space-y-8">
           <div className="bg-white p-8 rounded-2xl border border-gray-200">
              <h5 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-8">Order Items</h5>
              <div className="space-y-6">
                 {order.items?.map((item, idx) => (
                   <div key={idx} className="flex gap-6 items-center">
                      <img src={item.image} className="w-16 h-16 rounded-xl object-cover shadow-sm" />
                      <div className="flex-1">
                         <p className="text-sm font-bold text-gray-900 line-clamp-1">{item.name}</p>
                         <p className="text-xs font-medium text-gray-400 mt-1 uppercase">Qty: {item.quantity} | Price: Rs. {item.price.toLocaleString()}</p>
                      </div>
                   </div>
                 ))}
              </div>
              <div className="mt-10 pt-10 border-t border-gray-100 flex items-center justify-between">
                 <p className="text-xs font-bold text-gray-400 uppercase">Total Amount</p>
                 <p className="text-2xl font-bold text-[#FF5C00]">Rs. {order.total.toLocaleString()}</p>
              </div>
           </div>

           <div className="flex gap-4">
               {getNextAction(order.status) && (
                 <button 
                   onClick={() => {
                     const action = getNextAction(order.status)!;
                     if (action.next === 'SHIPPED') setTrackingModalOrder(order);
                     else setConfirmStatusModal({ id: order.id, nextStatus: action.next, label: action.label });
                   }} 
                   className="flex-1 py-4 bg-[#FF5C00] text-white rounded-xl font-bold text-sm shadow-lg shadow-orange-500/20 hover:bg-orange-600 transition-all"
                   disabled={processingOrder === order.id}
                 >
                   {processingOrder === order.id ? <i className="fas fa-spinner fa-spin mr-2"></i> : null}
                   {getNextAction(order.status)!.label}
                 </button>
               )}
           </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#FDFDFD] flex flex-col">
      {/* Toast Notification */}
      {notification && (
        <div className={`fixed top-10 left-1/2 -translate-x-1/2 z-[500] px-8 py-4 rounded-3xl shadow-2xl flex items-center gap-3 animate-slide-up ${
          notification.type === 'success' ? 'bg-gray-900 text-white' : 'bg-red-500 text-white'
        }`}>
          <i className={`fas ${notification.type === 'success' ? 'fa-check-circle text-green-400' : 'fa-exclamation-circle'}`}></i>
          <span className="text-[10px] font-black uppercase tracking-widest">{notification.message}</span>
        </div>
      )}

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar for Desktop */}
        <aside className="hidden lg:flex w-[280px] bg-white border-r border-gray-200 shrink-0 sticky top-0 h-screen z-40 p-6 flex-col">
          <div className="flex items-center gap-4 mb-10 px-2">
            <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center text-gray-700 font-bold text-lg border border-gray-200">
              {sellerName.charAt(0)}
            </div>
            <div className="overflow-hidden">
              <h2 className="text-sm font-bold text-gray-900 truncate">{sellerName}</h2>
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-green-500"></span>
                <p className="text-[10px] text-gray-500 font-medium uppercase tracking-wider">Seller Account</p>
              </div>
            </div>
          </div>

          <nav className="space-y-1.5 flex-1">
            {[
              { id: 'home', label: 'Home', icon: 'fa-home' },
              { id: 'orders', label: 'Orders', icon: 'fa-shopping-bag' },
              { id: 'products', label: 'Products', icon: 'fa-th-large' },
              { id: 'messages', label: 'Messages', icon: 'fa-comments' },
              { id: 'profile', label: 'Profile', icon: 'fa-user' },
            ].map(item => (
              <button
                key={item.id} 
                onClick={() => { setActiveTab(item.id as Tab); setActiveSubView('list'); }}
                className={`w-full flex items-center gap-4 px-4 py-3 rounded-xl transition-all duration-200 ${
                  activeTab === item.id 
                    ? 'bg-orange-50 text-[#FF5C00] font-bold' 
                    : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'
                }`}
              >
                <i className={`fas ${item.icon} text-lg w-6 text-center`}></i>
                <span className="text-sm">{item.label}</span>
              </button>
            ))}
          </nav>

          <div className="mt-auto pt-6 border-t border-gray-100">
            <button 
              onClick={onLogout}
              className="w-full flex items-center gap-4 px-4 py-3 rounded-xl text-gray-500 hover:bg-red-50 hover:text-red-600 transition-all duration-200"
            >
              <i className="fas fa-sign-out-alt text-lg w-6 text-center"></i>
              <span className="text-sm">Log Out</span>
            </button>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 bg-gray-50/30 overflow-y-auto no-scrollbar pb-20 lg:pb-0">
          <div className="max-w-4xl mx-auto p-6 lg:p-12">
            {activeTab === 'home' && renderHome()}
            
            {activeTab === 'orders' && (
              activeSubView === 'order_detail' && selectedOrderDetail ? (
                renderOrderDetail(selectedOrderDetail)
              ) : (
                <div className="space-y-8 animate-fade-in">
                  <div className="flex flex-col md:flex-row gap-6 items-center justify-between">
                    <div>
                      <h2 className="text-2xl font-bold text-gray-900">Orders</h2>
                      <p className="text-sm text-gray-500 mt-1">Manage and track your customer orders</p>
                    </div>
                    <div className="relative w-full md:w-80">
                      <i className="fas fa-search absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"></i>
                      <input type="text" placeholder="Search orders..." className="w-full pl-11 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:border-orange-500 outline-none transition-all shadow-sm" value={orderSearchQuery} onChange={(e) => setOrderSearchQuery(e.target.value)} />
                    </div>
                  </div>

                  <div className="flex gap-2 p-1 bg-white border border-gray-200 rounded-xl w-fit shadow-sm">
                    {(['active', 'completed', 'cancelled'] as OrderSubTab[]).map(tab => (
                      <button key={tab} onClick={() => setOrderSubTab(tab)} className={`px-6 py-2 rounded-lg text-xs font-bold capitalize transition-all ${orderSubTab === tab ? 'bg-gray-900 text-white' : 'text-gray-500 hover:bg-gray-50'}`}>{tab}</button>
                    ))}
                  </div>

                  <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
                    {loadingOrders ? <div className="p-20 text-center animate-pulse text-sm text-gray-500">Loading orders...</div> : (
                      <div className="overflow-x-auto">
                        <table className="w-full text-left">
                          <thead className="bg-gray-50 border-b border-gray-200 text-[10px] font-black text-gray-500 uppercase tracking-widest">
                            <tr>
                              <th className="px-6 py-4">Order ID</th>
                              <th className="px-6 py-4">Product Name</th>
                              <th className="px-6 py-4">Customer</th>
                              <th className="px-6 py-4 text-center">Price</th>
                              <th className="px-6 py-4 text-center">Status</th>
                              <th className="px-6 py-4">Date</th>
                              <th className="px-6 py-4 text-right">Actions</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-100 text-sm">
                            {filteredOrders.length === 0 ? (
                              <tr><td colSpan={7} className="p-20 text-center text-gray-400">No orders found</td></tr>
                            ) : (
                              filteredOrders.map(o => {
                                const isToProcess = o.status === 'PENDING';
                                const isShipping = o.status === 'SHIPPED';
                                const productName = o.items?.[0]?.name || 'Multiple Items';
                                
                                return (
                                  <tr key={o.id} className="hover:bg-gray-50/50 transition-colors">
                                    <td className="px-6 py-4 font-bold text-gray-900">#{o.id}</td>
                                    <td className="px-6 py-4">
                                      <p className="font-medium text-gray-700 line-clamp-1 max-w-[150px]">{productName}</p>
                                    </td>
                                    <td className="px-6 py-4 text-gray-600">{o.shippingAddress?.fullName}</td>
                                    <td className="px-6 py-4 text-center">
                                      <p className="font-bold text-[#FF5C00]">Rs. {o.total.toLocaleString()}</p>
                                    </td>
                                    <td className="px-6 py-4 text-center">
                                      <span className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider border ${getStatusStyle(o.status)}`}>
                                        {getStatusLabel(o.status)}
                                      </span>
                                    </td>
                                    <td className="px-6 py-4 text-xs text-gray-500">
                                      {new Date(o.createdAt).toLocaleDateString()}
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                      <div className="flex items-center justify-end gap-2">
                                        {isToProcess && (
                                          <button 
                                            onClick={() => executeStatusChange(o.id, 'SHIPPED')}
                                            className="px-4 py-2 bg-[#FF5C00] text-white rounded-lg text-[10px] font-black uppercase tracking-widest hover:bg-orange-600 transition-all shadow-sm shadow-orange-100"
                                            disabled={processingOrder === o.id}
                                          >
                                            Accept Order
                                          </button>
                                        )}
                                        {isShipping && (
                                          <button 
                                            onClick={() => executeStatusChange(o.id, 'DELIVERED')}
                                            className="px-4 py-2 bg-emerald-500 text-white rounded-lg text-[10px] font-black uppercase tracking-widest hover:bg-emerald-600 transition-all shadow-sm shadow-emerald-100"
                                            disabled={processingOrder === o.id}
                                          >
                                            Mark Delivered
                                          </button>
                                        )}
                                        <button onClick={() => { setSelectedOrderDetail(o); setActiveSubView('order_detail'); }} className="w-8 h-8 rounded-lg bg-gray-100 text-gray-400 flex items-center justify-center hover:bg-gray-900 hover:text-white transition-all"><i className="fas fa-eye text-xs"></i></button>
                                      </div>
                                    </td>
                                  </tr>
                                );
                              })
                            )}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                </div>
              )
            )}

            {activeTab === 'products' && (
              <div className="space-y-8 animate-fade-in">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900">Product Catalog</h2>
                    <p className="text-sm text-gray-500 mt-1">Manage your shop's inventory</p>
                  </div>
                  <button 
                    onClick={() => { setEditingId(null); setFormData({ name: '', price: '', stock: '', description: '', category: 'Electronics', brand: '', sku: '' }); setShowAddModal(true); }} 
                    className="px-6 py-3 bg-[#FF5C00] text-white rounded-xl text-sm font-bold shadow-lg shadow-orange-500/20 hover:bg-orange-600 transition-all flex items-center justify-center gap-2"
                  >
                    <i className="fas fa-plus"></i>
                    Add Product
                  </button>
                </div>

                <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-sm flex flex-col lg:flex-row gap-4">
                  <div className="relative flex-1">
                    <i className="fas fa-search absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"></i>
                    <input 
                      type="text" 
                      placeholder="Search products..." 
                      className="w-full pl-11 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:bg-white focus:border-orange-500 outline-none transition-all"
                      value={productSearchQuery}
                      onChange={(e) => setProductSearchQuery(e.target.value)}
                    />
                  </div>
                  <div className="flex flex-wrap gap-3">
                    <select 
                      value={productCategoryFilter} 
                      onChange={e => setProductCategoryFilter(e.target.value)}
                      className="px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:bg-white outline-none"
                    >
                      <option value="All">Categories</option>
                      {CATEGORIES.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
                    </select>
                  </div>
                </div>

                {filteredProducts.length === 0 ? (
                  <div className="bg-white rounded-3xl border border-dashed border-gray-300 p-20 text-center">
                    <i className="fas fa-box-open text-3xl text-gray-300 mb-6 block"></i>
                    <h3 className="text-lg font-bold text-gray-900">No products found</h3>
                    <button onClick={() => setShowAddModal(true)} className="mt-8 px-6 py-3 bg-gray-900 text-white rounded-xl text-sm font-bold">Add Product</button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    {filteredProducts.map(p => (
                      <div key={p.id} className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm hover:shadow-md transition-all group flex flex-col h-full">
                        <div className="aspect-square relative overflow-hidden bg-gray-50">
                          <img src={p.images[0]} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" alt={p.name} />
                          <div className="absolute top-3 right-3">
                            <span className={`px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider shadow-sm ${p.stock === 0 ? 'bg-red-500 text-white' : p.stock < 10 ? 'bg-amber-500 text-white' : 'bg-green-500 text-white'}`}>
                              {p.stock === 0 ? 'Out of Stock' : p.stock < 10 ? 'Low Stock' : 'In Stock'}
                            </span>
                          </div>
                        </div>
                        <div className="p-5 flex flex-col flex-1">
                          <h4 className="text-sm font-bold text-gray-900 line-clamp-2 mb-2">{p.name}</h4>
                          <p className="text-lg font-bold text-[#FF5C00] mb-4">Rs. {p.price.toLocaleString()}</p>
                          <div className="mt-auto pt-4 border-t border-gray-50 flex items-center gap-2">
                            <button onClick={() => { setEditingId(p.id); setFormData({ name: p.name, price: p.price.toString(), stock: p.stock.toString(), description: p.description, category: p.category, brand: p.brand || '', sku: p.sku || '' }); setShowAddModal(true); }} className="flex-1 py-2 bg-gray-50 text-gray-700 rounded-lg text-xs font-bold hover:bg-gray-100 transition-all">Edit</button>
                            <button onClick={() => onDeleteProduct(p.id)} className="w-9 h-9 flex items-center justify-center bg-red-50 text-red-500 rounded-lg hover:bg-red-500 hover:text-white transition-all"><i className="fas fa-trash-alt text-xs"></i></button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {activeTab === 'messages' && renderMessages()}
            {activeTab === 'profile' && renderProfile()}
          </div>
        </main>
      </div>

      {/* Bottom Navigation for Mobile */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 px-6 py-3 flex items-center justify-between z-[100] shadow-[0_-4px_20px_rgba(0,0,0,0.05)]">
        {[
          { id: 'home', label: 'Home', icon: 'fa-home' },
          { id: 'orders', label: 'Orders', icon: 'fa-shopping-bag' },
          { id: 'products', label: 'Products', icon: 'fa-th-large' },
          { id: 'messages', label: 'Messages', icon: 'fa-comments' },
          { id: 'profile', label: 'Profile', icon: 'fa-user' },
        ].map(item => (
          <button
            key={item.id}
            onClick={() => { setActiveTab(item.id as Tab); setActiveSubView('list'); }}
            className={`flex flex-col items-center gap-1 transition-all duration-200 ${
              activeTab === item.id ? 'text-[#FF5C00]' : 'text-gray-400'
            }`}
          >
            <i className={`fas ${item.icon} text-lg`}></i>
            <span className="text-[10px] font-bold uppercase tracking-tight">{item.label}</span>
          </button>
        ))}
      </nav>   {/* CONFIRMATION MODAL */}
      {confirmStatusModal && (
        <div className="fixed inset-0 z-[400] flex items-center justify-center p-6 bg-gray-900/60 backdrop-blur-sm">
           <div className="bg-white rounded-3xl p-8 w-full max-w-sm animate-slide-up text-center shadow-2xl">
              <div className="w-16 h-16 bg-orange-50 rounded-full flex items-center justify-center mx-auto mb-6"><i className="fas fa-exclamation-triangle text-[#FF5C00] text-2xl"></i></div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Update Status</h3>
              <p className="text-gray-500 text-sm mb-8">Are you sure you want to update this order to <span className="text-[#FF5C00] font-bold">{confirmStatusModal.nextStatus.replace(/_/g, ' ')}</span>?</p>
              <div className="flex gap-3">
                 <button onClick={() => setConfirmStatusModal(null)} className="flex-1 py-3 bg-gray-50 rounded-xl text-sm font-bold text-gray-500 hover:bg-gray-100 transition-all" disabled={processingOrder !== null}>Cancel</button>
                 <button 
                  onClick={() => executeStatusChange(confirmStatusModal.id, confirmStatusModal.nextStatus)} 
                  className="flex-1 py-3 bg-[#FF5C00] text-white rounded-xl text-sm font-bold shadow-lg shadow-orange-500/20 hover:bg-orange-600 transition-all"
                  disabled={processingOrder !== null}
                >
                  {processingOrder !== null ? <i className="fas fa-spinner fa-spin mr-2"></i> : null}
                  Confirm
                 </button>
              </div>
           </div>
        </div>
      )}

      {/* DISPATCH (SHIPPING) MODAL */}
      {trackingModalOrder && (
        <div className="fixed inset-0 z-[300] flex items-center justify-center p-6 bg-gray-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-[32px] p-10 w-full max-w-md animate-slide-up shadow-2xl relative">
            <button onClick={() => setTrackingModalOrder(null)} className="absolute top-8 right-8 text-gray-400 hover:text-red-500">
              <i className="fas fa-times"></i>
            </button>
            <div className="mb-8">
               <h3 className="text-2xl font-bold text-gray-900">Dispatch Order</h3>
               <p className="text-sm text-gray-500 mt-1">Enter shipping details for Order #{trackingModalOrder.id}</p>
            </div>
            <div className="space-y-5">
              <div className="space-y-1.5">
                 <label className="text-xs font-bold text-gray-700 ml-1">Courier Partner</label>
                 <input type="text" value={courierName} onChange={(e) => setCourierName(e.target.value)} placeholder="e.g. FedEx, BlueEx, DHL" className="w-full px-5 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:bg-white focus:border-orange-500 outline-none transition-all" />
              </div>
              <div className="space-y-1.5">
                 <label className="text-xs font-bold text-gray-700 ml-1">Tracking Number</label>
                 <input type="text" value={trackingNumber} onChange={(e) => setTrackingNumber(e.target.value)} placeholder="Enter Tracking Number" className="w-full px-5 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:bg-white focus:border-orange-500 outline-none transition-all" />
              </div>
            </div>
            <div className="flex gap-3 mt-10">
              <button onClick={() => setTrackingModalOrder(null)} className="flex-1 py-3 bg-gray-100 text-gray-600 rounded-xl text-sm font-bold hover:bg-gray-200 transition-all" disabled={processingOrder !== null}>Cancel</button>
              <button 
                onClick={confirmShipment} 
                className="flex-1 py-3 bg-[#FF5C00] text-white rounded-xl text-sm font-bold shadow-lg shadow-orange-500/20 hover:bg-orange-600 transition-all disabled:opacity-50" 
                disabled={!courierName || !trackingNumber || processingOrder !== null}
              >
                {processingOrder !== null ? <i className="fas fa-spinner fa-spin mr-2"></i> : null}
                Confirm Dispatch
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ADD/EDIT MODAL */}
      {showAddModal && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-6 bg-gray-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-[32px] w-full max-w-4xl p-8 md:p-12 animate-slide-up max-h-[90vh] overflow-y-auto no-scrollbar shadow-2xl relative">
            <button onClick={() => setShowAddModal(false)} className="absolute top-8 right-8 w-10 h-10 bg-gray-50 rounded-full flex items-center justify-center text-gray-400 hover:text-red-500 transition-colors">
              <i className="fas fa-times"></i>
            </button>
            
            <div className="mb-10">
              <h2 className="text-2xl font-bold text-gray-900">{editingId ? 'Edit Product' : 'Add New Product'}</h2>
              <p className="text-sm text-gray-500 mt-1">Fill in the details below to list your product on the market.</p>
            </div>

            <div className="mb-10">
              <label className="text-xs font-bold text-gray-700 ml-1 block mb-3">Upload Product Image <span className="text-red-500">*</span></label>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="col-span-1 md:col-span-2">
                  <div className="aspect-video bg-gray-50 border-2 border-dashed border-gray-200 rounded-2xl flex flex-col items-center justify-center text-gray-400 overflow-hidden relative group">
                    {formData.images && formData.images.length > 0 ? (
                      <>
                        <img src={formData.images[0]} className="w-full h-full object-cover" alt="Preview" />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                          <p className="text-white text-[10px] font-bold uppercase tracking-widest">Change Image</p>
                        </div>
                      </>
                    ) : (
                      <>
                        <i className="fas fa-image text-3xl mb-2"></i>
                        <p className="text-[10px] font-medium">Click to upload product image</p>
                      </>
                    )}
                    <input 
                      type="file" 
                      accept="image/jpeg,image/png,image/webp" 
                      className="absolute inset-0 opacity-0 cursor-pointer" 
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          const reader = new FileReader();
                          reader.onloadend = () => {
                            setFormData(prev => ({ ...prev, images: [reader.result as string] }));
                          };
                          reader.readAsDataURL(file);
                        }
                      }}
                    />
                  </div>
                  <p className="text-[9px] text-gray-400 mt-2 uppercase tracking-wider font-bold">Supported: JPG, PNG, WEBP (Max 5MB)</p>
                </div>
                <div className="bg-orange-50 rounded-2xl p-6 border border-orange-100 flex flex-col justify-center">
                  <h4 className="text-xs font-bold text-[#FF5C00] mb-2 flex items-center gap-2">
                    <i className="fas fa-info-circle"></i>
                    Image Guidelines
                  </h4>
                  <ul className="text-[10px] text-gray-600 space-y-1.5 list-disc ml-4">
                    <li>Clear background preferred</li>
                    <li>Minimum resolution 800x800</li>
                    <li>Product should occupy 80% of frame</li>
                  </ul>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
               <div className="space-y-5">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-gray-700 ml-1">Product Name <span className="text-red-500">*</span></label>
                    <input value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} placeholder="e.g. Wireless Headphones" className="w-full px-5 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:bg-white focus:border-orange-500 outline-none transition-all" />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-gray-700 ml-1">Category <span className="text-red-500">*</span></label>
                      <select value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})} className="w-full px-5 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:bg-white focus:border-orange-500 outline-none transition-all">
                        {CATEGORIES.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
                      </select>
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-gray-700 ml-1">Brand</label>
                      <input value={formData.brand} onChange={e => setFormData({...formData, brand: e.target.value})} placeholder="e.g. Sony" className="w-full px-5 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:bg-white focus:border-orange-500 outline-none transition-all" />
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-gray-700 ml-1">Price (Rs.) <span className="text-red-500">*</span></label>
                      <input type="number" value={formData.price} onChange={e => setFormData({...formData, price: e.target.value})} placeholder="0.00" className="w-full px-5 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:bg-white focus:border-orange-500 outline-none transition-all" />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-gray-700 ml-1">Special Price</label>
                      <input type="number" value={formData.specialPrice} onChange={e => setFormData({...formData, specialPrice: e.target.value})} placeholder="0.00" className="w-full px-5 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:bg-white focus:border-orange-500 outline-none transition-all" />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-gray-700 ml-1">Discount %</label>
                      <input type="number" value={formData.discountPercentage} onChange={e => setFormData({...formData, discountPercentage: e.target.value})} placeholder="0" className="w-full px-5 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:bg-white focus:border-orange-500 outline-none transition-all" />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-gray-700 ml-1">Stock Quantity <span className="text-red-500">*</span></label>
                      <input type="number" value={formData.stock} onChange={e => setFormData({...formData, stock: e.target.value})} placeholder="0" className="w-full px-5 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:bg-white focus:border-orange-500 outline-none transition-all" />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-gray-700 ml-1">SKU (Optional)</label>
                      <input value={formData.sku} onChange={e => setFormData({...formData, sku: e.target.value})} placeholder="SKU-123" className="w-full px-5 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:bg-white focus:border-orange-500 outline-none transition-all" />
                    </div>
                  </div>
               </div>

               <div className="space-y-6">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-gray-700 ml-1">Package Details</label>
                    <div className="grid grid-cols-2 gap-4">
                      <input value={formData.weight} onChange={e => setFormData({...formData, weight: e.target.value})} placeholder="Weight (e.g. 0.5kg)" className="w-full px-5 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:bg-white focus:border-orange-500 outline-none transition-all" />
                      <input value={formData.dimensions} onChange={e => setFormData({...formData, dimensions: e.target.value})} placeholder="Dimensions (LxWxH)" className="w-full px-5 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:bg-white focus:border-orange-500 outline-none transition-all" />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-gray-700 ml-1">Description <span className="text-red-500">*</span></label>
                    <textarea value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} placeholder="Describe your product..." className="w-full px-5 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:bg-white focus:border-orange-500 outline-none transition-all h-32 resize-none" />
                  </div>

                  <div className="p-6 bg-orange-50 rounded-2xl border border-orange-100">
                    <h4 className="text-sm font-bold text-[#FF5C00] mb-2 flex items-center gap-2">
                      <i className="fas fa-magic"></i>
                      AI Assistant
                    </h4>
                    <p className="text-xs text-gray-600 leading-relaxed mb-4">Need help writing a description? Our AI can generate a professional description for you based on the product name.</p>
                    <button 
                      onClick={async () => {
                        if (!formData.name) return;
                        setIsGenerating(true);
                        const desc = await generateProductDescription(formData.name, formData.category);
                        setFormData(p => ({...p, description: desc || ''}));
                        setIsGenerating(false);
                      }} 
                      className="w-full py-2.5 bg-white text-[#FF5C00] border border-orange-200 rounded-xl text-xs font-bold hover:bg-orange-100 transition-all flex items-center justify-center gap-2"
                      disabled={isGenerating}
                    >
                      {isGenerating ? <i className="fas fa-spinner fa-spin"></i> : <i className="fas fa-pen-nib"></i>}
                      {isGenerating ? 'Generating...' : 'Auto-Generate Description'}
                    </button>
                  </div>
               </div>
            </div>

            <div className="mt-12 flex flex-col sm:flex-row gap-4">
               <button onClick={() => setShowAddModal(false)} className="flex-1 py-4 bg-gray-100 text-gray-600 rounded-xl text-sm font-bold hover:bg-gray-200 transition-all">Cancel</button>
               <button onClick={() => {
                 if (!formData.images || formData.images.length === 0) {
                   setNotification({ message: 'Product image is required', type: 'error' });
                   return;
                 }
                 const data = { 
                   ...formData, 
                   price: Number(formData.price), 
                   discountPrice: formData.specialPrice ? Number(formData.specialPrice) : undefined,
                   discountPercentage: formData.discountPercentage ? Number(formData.discountPercentage) : undefined,
                   stock: Number(formData.stock), 
                   sellerId: user.id, 
                   sellerName: sellerName, 
                   rating: 5, 
                   reviewsCount: 0, 
                   images: formData.images,
                   packageDetails: {
                     weight: formData.weight,
                     dimensions: formData.dimensions
                   },
                   createdAt: new Date().toISOString() 
                 };
                 if (editingId) onUpdateProduct(editingId, data as any);
                 else {
                   onAddProduct(data as any);
                   setNotification({ message: 'Product added successfully', type: 'success' });
                 }
                 setFormData({
                    name: '',
                    price: '',
                    specialPrice: '',
                    discountPercentage: '',
                    stock: '',
                    description: '',
                    category: 'Electronics',
                    brand: '',
                    sku: '',
                    weight: '',
                    dimensions: '',
                    images: []
                 });
                 setShowAddModal(false);
               }} className="flex-1 py-4 bg-[#FF5C00] text-white rounded-xl text-sm font-bold shadow-lg shadow-orange-500/20 hover:bg-orange-600 transition-all" disabled={!formData.name || !formData.price || !formData.description || !formData.images || formData.images.length === 0}>
                 {editingId ? 'Save Changes' : 'Add Product'}
               </button>
            </div>
          </div>
        </div>
      )}

      {/* STORE SETTINGS MODAL */}
      {showSettingsModal && (
        <div className="fixed inset-0 z-[500] flex items-center justify-center p-6 bg-gray-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-[32px] p-10 w-full max-w-md animate-slide-up shadow-2xl relative">
            <button onClick={() => setShowSettingsModal(false)} className="absolute top-8 right-8 text-gray-400 hover:text-red-500">
              <i className="fas fa-times"></i>
            </button>
            <div className="mb-8">
               <h3 className="text-2xl font-bold text-gray-900">Store Settings</h3>
               <p className="text-sm text-gray-500 mt-1">Update your public store identity</p>
            </div>
            <div className="space-y-5">
              <div className="space-y-1.5">
                 <label className="text-xs font-bold text-gray-700 ml-1">Store Name</label>
                 <input 
                  type="text" 
                  value={newStoreName} 
                  onChange={(e) => setNewStoreName(e.target.value)} 
                  placeholder="Enter Store Name" 
                  className="w-full px-5 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:bg-white focus:border-orange-500 outline-none transition-all" 
                />
              </div>
            </div>
            <div className="flex gap-3 mt-10">
              <button onClick={() => setShowSettingsModal(false)} className="flex-1 py-3 bg-gray-100 text-gray-600 rounded-xl text-sm font-bold hover:bg-gray-200 transition-all">Cancel</button>
              <button 
                onClick={handleUpdateStoreName} 
                className="flex-1 py-3 bg-[#FF5C00] text-white rounded-xl text-sm font-bold shadow-lg shadow-orange-500/20 hover:bg-orange-600 transition-all"
                disabled={!newStoreName}
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SellerDashboard;

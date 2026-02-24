
import React from 'react';
import { Order, OrderStatus } from '../types';

interface OrderHistoryProps {
  orders: Order[];
  onGoShopping: () => void;
  onCancelOrder: (id: string) => void;
}

const OrderHistory: React.FC<OrderHistoryProps> = ({ orders, onGoShopping, onCancelOrder }) => {
  const getStatusStyle = (status: OrderStatus) => {
    switch (status) {
      case 'PENDING': return 'bg-amber-50 text-amber-600 border-amber-100';
      case 'CONFIRMED': return 'bg-blue-50 text-blue-600 border-blue-100';
      case 'PICKED': return 'bg-purple-50 text-purple-600 border-purple-100';
      case 'PACKED': return 'bg-teal-50 text-teal-600 border-teal-100';
      case 'READY_TO_SHIP': return 'bg-indigo-50 text-indigo-600 border-indigo-100';
      case 'SHIPPED': return 'bg-emerald-50 text-emerald-600 border-emerald-100';
      case 'DELIVERED': return 'bg-green-100 text-green-800 border-green-200';
      case 'CANCELLED': return 'bg-red-50 text-red-600 border-red-100';
      default: return 'bg-gray-50 text-gray-600 border-gray-100';
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-12 animate-fade-in">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-10">
        <div>
          <h1 className="text-4xl font-black text-gray-900 tracking-tighter uppercase">Order Terminal</h1>
          <p className="text-gray-400 font-medium mt-1 text-sm">Track your acquisitions and logistic updates in real-time.</p>
        </div>
        <div className="flex gap-2">
          <button className="px-6 py-3 bg-white border rounded-2xl text-[10px] font-black uppercase tracking-widest text-gray-500 hover:bg-gray-50 transition-all">Export Archive</button>
        </div>
      </div>

      <div className="space-y-6">
        {orders.length === 0 ? (
          <div className="bg-white rounded-[50px] border border-gray-100 shadow-2xl shadow-gray-200/50 p-12 md:p-24 text-center">
            <div className="w-32 h-32 bg-orange-50 rounded-[40px] flex items-center justify-center mx-auto mb-10 shadow-inner">
              <i className="fas fa-box-open text-[#FF5C00] text-5xl opacity-40"></i>
            </div>
            <h3 className="text-3xl font-black text-gray-900 mb-4 uppercase tracking-tighter">No Active Invoices</h3>
            <p className="text-gray-400 text-sm max-w-md mx-auto mb-12 leading-relaxed font-medium">
              Your inventory terminal is empty. Browse our curated collections to start your first order protocol.
            </p>
            <button 
              onClick={onGoShopping}
              className="px-16 py-6 bg-[#FF5C00] text-white rounded-[32px] font-black text-xs uppercase tracking-[0.2em] shadow-2xl shadow-orange-100 hover:bg-orange-700 transition-all"
            >
              Start Discovery
            </button>
          </div>
        ) : (
          orders.map(order => (
            <div key={order.id} className="bg-white rounded-[40px] border border-gray-100 shadow-sm overflow-hidden hover:shadow-xl transition-all group">
              <div className="bg-gray-50/50 px-8 py-6 flex flex-wrap justify-between items-center gap-4 border-b">
                <div className="flex gap-10">
                  <div>
                    <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">ID Protocol</p>
                    <p className="text-sm font-black text-gray-900 uppercase">#{order.id}</p>
                  </div>
                  <div>
                    <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">Created</p>
                    <p className="text-sm font-bold text-gray-600">{new Date(order.createdAt).toLocaleDateString()}</p>
                  </div>
                  <div className="hidden sm:block">
                    <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">Settlement</p>
                    <p className="text-sm font-black text-[#FF5C00]">Rs. {order.total.toLocaleString()}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <span className={`px-4 py-2 rounded-2xl text-[9px] font-black uppercase tracking-widest border ${getStatusStyle(order.status)}`}>
                    {order.status.replace(/_/g, ' ')}
                  </span>
                  {order.status === 'PENDING' && (
                    <button 
                      onClick={() => onCancelOrder(order.id)}
                      className="px-4 py-2 bg-red-50 text-red-500 rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-red-500 hover:text-white transition-all"
                    >
                      Void Order
                    </button>
                  )}
                </div>
              </div>

              <div className="p-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                  <div className="space-y-6">
                    {order.items?.map((item, idx) => (
                      <div key={idx} className="flex gap-5">
                        <img src={item.image} className="w-16 h-16 rounded-2xl object-cover shadow-sm" />
                        <div>
                          <h4 className="font-black text-gray-900 text-xs uppercase tracking-tight line-clamp-1">{item.name}</h4>
                          <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-1">Units: {item.quantity}</p>
                          <p className="text-sm font-black text-[#FF5C00] mt-1">Rs. {item.price.toLocaleString()}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  <div className="bg-gray-50/50 rounded-[32px] p-8 border border-gray-100 space-y-6">
                    <div className="flex justify-between items-start">
                      <h5 className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Shipping Metadata</h5>
                      {order.trackingNumber && (
                        <div className="text-right">
                           <span className="block text-[9px] font-black text-gray-400 uppercase">{order.courierName}</span>
                           <span className="text-[9px] font-black bg-blue-100 text-blue-600 px-2 py-1 rounded-lg uppercase tracking-wider">{order.trackingNumber}</span>
                        </div>
                      )}
                    </div>
                    <div className="space-y-2">
                      <p className="text-sm font-black text-gray-800">{order.shippingAddress?.fullName}</p>
                      <p className="text-xs text-gray-500 leading-relaxed">
                        {order.shippingAddress?.address}, {order.shippingAddress?.city}, {order.shippingAddress?.province}
                      </p>
                      <p className="text-xs font-bold text-gray-400 mt-2 flex items-center gap-2">
                        <i className="fas fa-phone text-[#FF5C00]"></i>
                        {order.shippingAddress?.phone}
                      </p>
                    </div>
                    <div className="pt-4 border-t flex justify-between items-center">
                       <p className="text-[10px] font-black text-gray-400 uppercase">Payment: <span className="text-gray-900">{order.paymentMethod}</span></p>
                       <span className={`text-[9px] font-black uppercase ${order.paymentStatus === 'PAID' ? 'text-green-500' : 'text-orange-500'}`}>[{order.paymentStatus}]</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default OrderHistory;

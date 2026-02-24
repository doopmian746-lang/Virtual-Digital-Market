
import React from 'react';
import { CartItem } from '../types';

interface CartModalProps {
  items: CartItem[];
  isOpen: boolean;
  onClose: () => void;
  onUpdateQuantity: (id: string, delta: number) => void;
  onRemove: (id: string) => void;
  onCheckout: () => void;
}

const CartModal: React.FC<CartModalProps> = ({ items, isOpen, onClose, onUpdateQuantity, onRemove, onCheckout }) => {
  if (!isOpen) return null;

  const subtotal = items.reduce((sum, item) => sum + (item.discountPrice || item.price) * item.quantity, 0);
  const shipping = items.length > 0 ? 250 : 0;
  const total = subtotal + shipping;

  return (
    <div className="fixed inset-0 z-[100] flex justify-end">
      <div className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm animate-fade-in" onClick={onClose}></div>
      <div className="relative w-full max-w-md bg-white h-full shadow-2xl flex flex-col animate-slide-left border-l border-white/20">
        <div className="p-8 border-b flex items-center justify-between bg-white shrink-0">
          <div>
            <h2 className="text-2xl font-black text-gray-900 uppercase tracking-tighter">My Cart</h2>
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-1">{items.length} Unique Items</p>
          </div>
          <button onClick={onClose} className="w-10 h-10 flex items-center justify-center bg-gray-50 text-gray-400 hover:text-gray-900 rounded-2xl transition-all">
            <i className="fas fa-times"></i>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-8 space-y-6 no-scrollbar">
          {items.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-gray-400 space-y-6">
              <div className="w-24 h-24 bg-gray-50 rounded-full flex items-center justify-center">
                <i className="fas fa-shopping-basket text-4xl opacity-20"></i>
              </div>
              <div className="text-center">
                <p className="font-black uppercase text-xs tracking-widest text-gray-900 mb-1">Your cart is empty</p>
                <p className="text-sm font-medium">Add some items to get started!</p>
              </div>
              <button onClick={onClose} className="text-[10px] font-black text-[#f85606] bg-orange-50 px-6 py-3 rounded-xl uppercase tracking-widest hover:bg-[#f85606] hover:text-white transition-all">Explore Marketplace</button>
            </div>
          ) : (
            items.map((item) => (
              <div key={item.id} className="flex gap-5 group">
                <div className="relative shrink-0">
                  <img src={item.images[0]} className="w-20 h-20 object-cover rounded-2xl shadow-sm ring-1 ring-gray-100" />
                </div>
                <div className="flex-1 min-w-0 flex flex-col">
                  <h4 className="text-sm font-black text-gray-900 line-clamp-1 group-hover:text-[#f85606] transition-colors uppercase tracking-tight">{item.name}</h4>
                  <p className="text-[#f85606] font-black text-sm mt-1">Rs. {(item.discountPrice || item.price).toLocaleString()}</p>
                  
                  <div className="flex items-center justify-between mt-auto">
                    <div className="flex items-center bg-gray-50 rounded-xl p-1">
                      <button 
                        onClick={() => onUpdateQuantity(item.id, -1)}
                        className="w-8 h-8 flex items-center justify-center hover:bg-white hover:shadow-sm rounded-lg transition-all disabled:opacity-30"
                        disabled={item.quantity <= 1}
                      >
                        <i className="fas fa-minus text-[10px]"></i>
                      </button>
                      <span className="px-4 text-xs font-black">{item.quantity}</span>
                      <button 
                        onClick={() => onUpdateQuantity(item.id, 1)}
                        className="w-8 h-8 flex items-center justify-center hover:bg-white hover:shadow-sm rounded-lg transition-all"
                      >
                        <i className="fas fa-plus text-[10px]"></i>
                      </button>
                    </div>
                    <button onClick={() => onRemove(item.id)} className="w-8 h-8 text-gray-300 hover:text-red-500 transition-colors">
                      <i className="fas fa-trash-alt text-sm"></i>
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {items.length > 0 && (
          <div className="p-8 border-t bg-gray-50/50 space-y-6">
            <div className="space-y-3">
              <div className="flex justify-between text-xs font-black uppercase tracking-widest text-gray-400">
                <span>Market Subtotal</span>
                <span className="text-gray-900">Rs. {subtotal.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-xs font-black uppercase tracking-widest text-gray-400">
                <span>Shipping Estimation</span>
                <span className="text-gray-900">Rs. {shipping}</span>
              </div>
              <div className="pt-4 flex justify-between items-end border-t border-gray-100">
                <span className="text-lg font-black uppercase tracking-tighter text-gray-900">Grand Total</span>
                <div className="text-right">
                  <p className="text-2xl font-black text-[#f85606]">Rs. {total.toLocaleString()}</p>
                  <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-0.5">Inclusive of taxes</p>
                </div>
              </div>
            </div>
            <button 
              onClick={onCheckout}
              className="w-full bg-[#f85606] text-white py-6 rounded-3xl font-black text-xs uppercase tracking-widest shadow-2xl shadow-orange-100 hover:bg-orange-700 transition-all active:scale-95 flex items-center justify-center gap-3"
            >
              Secure Checkout
              <i className="fas fa-arrow-right"></i>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default CartModal;
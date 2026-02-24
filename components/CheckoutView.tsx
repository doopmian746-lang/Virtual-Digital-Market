
import React, { useState } from 'react';
import { CartItem, ShippingAddress } from '../types';

interface CheckoutViewProps {
  items: CartItem[];
  onPlaceOrder: (address: ShippingAddress, method: 'COD' | 'STRIPE') => void;
  onCancel: () => void;
}

const CheckoutView: React.FC<CheckoutViewProps> = ({ items, onPlaceOrder, onCancel }) => {
  const [step, setStep] = useState(1);
  const [address, setAddress] = useState<ShippingAddress>({
    fullName: '',
    phone: '',
    address: '',
    city: '',
    province: 'Punjab',
    postalCode: '',
    landmark: ''
  });
  const [paymentMethod, setPaymentMethod] = useState<'COD' | 'STRIPE'>('COD');

  const subtotal = items.reduce((sum, item) => sum + (item.discountPrice || item.price) * item.quantity, 0);
  const shipping = 250;
  const total = subtotal + shipping;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (step === 1) {
      setStep(2);
      window.scrollTo(0, 0);
    } else {
      onPlaceOrder(address, paymentMethod);
    }
  };

  if (items.length === 0) {
    return (
      <div className="max-w-xl mx-auto py-32 text-center animate-fade-in">
        <h2 className="text-3xl font-black uppercase tracking-tighter mb-4">Terminal Empty</h2>
        <p className="text-gray-400 font-medium mb-10 uppercase tracking-widest text-[10px]">No active inventory for checkout</p>
        <button onClick={onCancel} className="px-10 py-5 bg-[#FF5C00] text-white rounded-[24px] font-black text-[10px] uppercase tracking-widest shadow-xl">Go Home</button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-12 animate-fade-in">
      <div className="flex items-center gap-4 mb-12">
        <button onClick={() => step === 2 ? setStep(1) : onCancel()} className="w-12 h-12 rounded-2xl border flex items-center justify-center text-gray-400 hover:text-gray-900 transition-all">
          <i className="fas fa-arrow-left"></i>
        </button>
        <div>
          <h1 className="text-3xl font-black uppercase tracking-tighter text-gray-900">Checkout Protocol</h1>
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Step {step} of 2</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        <div className="lg:col-span-2 space-y-8">
          <form onSubmit={handleSubmit} className="bg-white p-10 rounded-[40px] border border-gray-100 shadow-xl space-y-8">
            {step === 1 ? (
              <div className="space-y-8">
                <h3 className="text-lg font-black uppercase border-l-4 border-orange-500 pl-4 tracking-tight">Fulfillment Metadata</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-3">
                    <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Customer Identity</label>
                    <input required value={address.fullName} onChange={e => setAddress({...address, fullName: e.target.value})} className="w-full px-8 py-5 bg-gray-50 rounded-[24px] text-sm font-bold border-2 border-transparent focus:border-[#FF5C00] outline-none transition-all" placeholder="Full Name" />
                  </div>
                  <div className="space-y-3">
                    <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Contact Node</label>
                    <input required type="tel" value={address.phone} onChange={e => setAddress({...address, phone: e.target.value})} className="w-full px-8 py-5 bg-gray-50 rounded-[24px] text-sm font-bold border-2 border-transparent focus:border-[#FF5C00] outline-none transition-all" placeholder="Phone Number" />
                  </div>
                </div>
                <div className="space-y-3">
                  <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Logistics Hub</label>
                  <input required value={address.address} onChange={e => setAddress({...address, address: e.target.value})} className="w-full px-8 py-5 bg-gray-50 rounded-[24px] text-sm font-bold border-2 border-transparent focus:border-[#FF5C00] outline-none transition-all" placeholder="Street Address" />
                </div>
                <div className="grid grid-cols-2 gap-8">
                   <div className="space-y-3">
                      <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest">City Node</label>
                      <input required value={address.city} onChange={e => setAddress({...address, city: e.target.value})} className="w-full px-8 py-5 bg-gray-50 rounded-[24px] text-sm font-bold border-2 border-transparent focus:border-[#FF5C00] outline-none transition-all" placeholder="City" />
                   </div>
                   <div className="space-y-3">
                      <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Regional Zone</label>
                      <select value={address.province} onChange={e => setAddress({...address, province: e.target.value})} className="w-full px-8 py-5 bg-gray-50 rounded-[24px] text-sm font-black border-2 border-transparent focus:border-[#FF5C00] outline-none transition-all">
                        <option>Punjab</option><option>Sindh</option><option>KPK</option><option>Balochistan</option><option>Islamabad</option>
                      </select>
                   </div>
                </div>
                <div className="grid grid-cols-2 gap-8">
                   <div className="space-y-3">
                      <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Postal Code</label>
                      <input value={address.postalCode} onChange={e => setAddress({...address, postalCode: e.target.value})} className="w-full px-8 py-5 bg-gray-50 rounded-[24px] text-sm font-bold border-2 border-transparent focus:border-[#FF5C00] outline-none transition-all" placeholder="Postal Code (Optional)" />
                   </div>
                   <div className="space-y-3">
                      <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Landmark</label>
                      <input value={address.landmark} onChange={e => setAddress({...address, landmark: e.target.value})} className="w-full px-8 py-5 bg-gray-50 rounded-[24px] text-sm font-bold border-2 border-transparent focus:border-[#FF5C00] outline-none transition-all" placeholder="Famous Landmark (Optional)" />
                   </div>
                </div>
              </div>
            ) : (
              <div className="space-y-8">
                <h3 className="text-lg font-black uppercase border-l-4 border-blue-500 pl-4 tracking-tight">Settlement Logic</h3>
                <div className="grid grid-cols-1 gap-4">
                  <div onClick={() => setPaymentMethod('COD')} className={`p-6 rounded-[32px] border-2 cursor-pointer transition-all flex items-center justify-between ${paymentMethod === 'COD' ? 'border-[#FF5C00] bg-orange-50' : 'border-gray-100'}`}>
                    <div className="flex items-center gap-6"><div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-orange-500 border"><i className="fas fa-money-bill-wave"></i></div><div><p className="font-black text-sm uppercase">Cash On Delivery</p><p className="text-[9px] text-gray-400 uppercase">Pay at logistics arrival</p></div></div>
                    {paymentMethod === 'COD' && <i className="fas fa-check-circle text-[#FF5C00]"></i>}
                  </div>
                  <div onClick={() => setPaymentMethod('STRIPE')} className={`p-6 rounded-[32px] border-2 cursor-pointer transition-all flex items-center justify-between ${paymentMethod === 'STRIPE' ? 'border-[#FF5C00] bg-orange-50' : 'border-gray-100'}`}>
                    <div className="flex items-center gap-6"><div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-blue-500 border"><i className="fab fa-stripe-s"></i></div><div><p className="font-black text-sm uppercase">Digital Vault (Stripe)</p><p className="text-[9px] text-gray-400 uppercase">Instant secure protocol</p></div></div>
                    {paymentMethod === 'STRIPE' && <i className="fas fa-check-circle text-[#FF5C00]"></i>}
                  </div>
                </div>
              </div>
            )}
            <button type="submit" className="w-full py-6 bg-[#FF5C00] text-white rounded-[32px] font-black text-xs uppercase tracking-widest shadow-xl shadow-orange-500/20 active:scale-95 transition-all">
              {step === 1 ? 'Verify Metadata' : `Authorize Settlement - Rs. ${total.toLocaleString()}`}
            </button>
          </form>
        </div>

        <div className="space-y-6">
          <div className="bg-white p-8 rounded-[40px] border border-gray-100 shadow-sm space-y-8">
            <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Inventory Manifest</h3>
            <div className="space-y-4 max-h-[300px] overflow-y-auto no-scrollbar">
              {items.map(item => (
                <div key={item.id} className="flex gap-4 items-center">
                  <img src={item.images[0]} className="w-12 h-12 rounded-xl object-cover shadow-sm" />
                  <div className="flex-1 min-w-0">
                    <p className="text-[10px] font-black text-gray-800 line-clamp-1 uppercase">{item.name}</p>
                    <p className="text-[10px] text-gray-400 font-bold uppercase">Qty: {item.quantity} | Rs. {item.price.toLocaleString()}</p>
                  </div>
                </div>
              ))}
            </div>
            <div className="pt-6 border-t space-y-2">
              <div className="flex justify-between text-[10px] font-black uppercase text-gray-400"><span>Subtotal</span><span>Rs. {subtotal.toLocaleString()}</span></div>
              <div className="flex justify-between text-[10px] font-black uppercase text-gray-400"><span>Logistics</span><span>Rs. {shipping}</span></div>
              <div className="pt-4 flex justify-between items-end border-t">
                <span className="text-lg font-black uppercase tracking-tighter">Total</span>
                <span className="text-2xl font-black text-[#FF5C00]">Rs. {total.toLocaleString()}</span>
              </div>
            </div>
          </div>
          <div className="bg-gray-900 p-8 rounded-[32px] text-white">
             <div className="flex gap-4 items-start"><i className="fas fa-shield-alt text-orange-400 text-xl"></i><div><p className="text-[10px] font-black uppercase tracking-widest mb-1">Escrow Protected</p><p className="text-[9px] text-white/50 leading-relaxed uppercase">Funds held until logistics verification protocol completion.</p></div></div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CheckoutView;

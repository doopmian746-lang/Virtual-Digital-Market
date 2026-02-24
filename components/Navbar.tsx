
import React, { useState } from 'react';
import { Role, User } from '../types';
import Logo from './Logo';

interface NavbarProps {
  user: User | null;
  onLogout: () => void;
  onSearch: (query: string) => void;
  cartCount: number;
  onViewCart: () => void;
  onOpenAuth: (role: Role) => void;
  onGoHome: () => void;
  onViewOrders: () => void;
  onGoSellerCenter: () => void;
  onViewSection?: (view: string, category?: string) => void;
  hideCategories?: boolean; // New prop to control category strip visibility
}

const Navbar: React.FC<NavbarProps> = ({ 
  user, onLogout, onSearch, cartCount, onViewCart, onOpenAuth, onGoHome, onViewOrders, onGoSellerCenter, onViewSection, hideCategories 
}) => {
  const [query, setQuery] = useState('');

  const menuItems = [
    { label: 'New Arrivals', view: 'new_arrivals' },
    { label: 'Daily Deals', view: 'daily_deals' },
    { label: 'Flash Sale', view: 'flash_sale' },
    { label: 'Fashion', view: 'category', cat: 'Fashion' },
    { label: 'Electronics', view: 'category', cat: 'Electronics' },
    { label: 'Home & Living', view: 'category', cat: 'Home & Living' },
    { label: 'Beauty', view: 'category', cat: 'Health & Beauty' },
    { label: 'Sports', view: 'category', cat: 'Sports' },
  ];

  return (
    <header className="fixed top-0 left-0 right-0 z-[100] bg-white border-b border-gray-200">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-8 h-20 flex items-center justify-between gap-4 md:gap-8">
        {/* Logo */}
        <div className="flex items-center shrink-0">
          <Logo onClick={onGoHome} textSize="text-xl hidden md:block" iconSize="w-9 h-9" />
          <Logo onClick={onGoHome} textSize="hidden" iconSize="w-9 h-9 md:hidden" />
        </div>

        {/* Search Bar - Pill Shaped */}
        <div className="flex-1 max-w-3xl relative group">
          <div className="relative flex items-center">
            <input
              type="text"
              placeholder="Search for anything"
              className="w-full bg-gray-100 border-2 border-transparent rounded-full py-2.5 pl-6 pr-12 text-sm focus:bg-white focus:border-gray-300 transition-all outline-none"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && onSearch(query)}
            />
            <button 
              onClick={() => onSearch(query)}
              className="absolute right-2 w-10 h-10 flex items-center justify-center text-gray-600 hover:bg-gray-200 rounded-full transition-all"
            >
              <i className="fas fa-search"></i>
            </button>
          </div>
        </div>

        {/* Icons & User Actions */}
        <div className="flex items-center gap-2 md:gap-4 shrink-0">
          {!user ? (
            <button onClick={() => onOpenAuth('BUYER')} className="text-sm font-medium hover:bg-gray-100 px-3 py-2 rounded-full transition-all">
              Sign in
            </button>
          ) : (
            <div className="group relative">
              <button className="w-10 h-10 rounded-full hover:bg-gray-100 flex items-center justify-center transition-all">
                <i className="far fa-user text-xl text-gray-700"></i>
              </button>
              <div className="absolute right-0 top-full mt-2 w-48 bg-white rounded-xl shadow-xl border border-gray-100 py-2 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all">
                <div className="px-4 py-2 border-b border-gray-50 mb-1">
                  <p className="text-xs font-bold text-gray-900 truncate">{user.name}</p>
                </div>
                <button onClick={onViewOrders} className="w-full text-left px-4 py-2 text-sm hover:bg-gray-50">Purchases and reviews</button>
                <button onClick={onLogout} className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50">Sign out</button>
              </div>
            </div>
          )}

          <button className="w-10 h-10 flex items-center justify-center hover:bg-gray-100 rounded-full text-gray-700 transition-all">
            <i className="far fa-heart text-xl"></i>
          </button>

          <button onClick={onGoSellerCenter} className="w-10 h-10 flex items-center justify-center hover:bg-gray-100 rounded-full text-gray-700 transition-all" title="Shop Manager">
            <i className="fas fa-store text-xl"></i>
          </button>

          <button onClick={onViewCart} className="relative w-10 h-10 flex items-center justify-center hover:bg-gray-100 rounded-full text-gray-700 transition-all">
            <i className="fas fa-shopping-cart text-xl"></i>
            {cartCount > 0 && (
              <span className="absolute top-0 right-0 bg-[#F1641E] text-white text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center border-2 border-white">
                {cartCount}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Category Menu */}
      {!hideCategories && (
        <div className="max-w-[1400px] mx-auto px-4 sm:px-8 overflow-x-auto no-scrollbar">
          <div className="flex items-center justify-center gap-6 md:gap-10 py-3 whitespace-nowrap">
            {menuItems.map((item) => (
              <button 
                key={item.label} 
                onClick={() => onViewSection?.(item.view, item.cat)}
                className="text-sm font-medium text-gray-700 hover:underline underline-offset-8 decoration-2 decoration-gray-900 transition-all"
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>
      )}
    </header>
  );
};

export default Navbar;

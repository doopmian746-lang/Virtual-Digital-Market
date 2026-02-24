
import React, { useState, useMemo } from 'react';
import { Product } from '../types';
import ProductCard from './ProductCard';

interface ListingViewProps {
  title: string;
  products: Product[];
  onAddToCart: (p: Product) => void;
  onPlaceOrder: (p: Product) => void;
}

type SortOption = 'newest' | 'price_low' | 'price_high' | 'popularity';

const ListingView: React.FC<ListingViewProps> = ({ title, products, onAddToCart, onPlaceOrder }) => {
  const [sortBy, setSortBy] = useState<SortOption>('newest');
  const [priceRange, setPriceRange] = useState({ min: 0, max: 1000000 });
  const [selectedBrands, setSelectedBrands] = useState<string[]>([]);
  const [minRating, setMinRating] = useState<number>(0);

  const brands = useMemo(() => Array.from(new Set(products.map(p => p.brand).filter(Boolean))), [products]) as string[];

  const filteredAndSortedProducts = useMemo(() => {
    let result = products.filter(p => {
      const matchesPrice = p.price >= priceRange.min && p.price <= priceRange.max;
      const matchesBrand = selectedBrands.length === 0 || (p.brand && selectedBrands.includes(p.brand));
      const matchesRating = p.rating >= minRating;
      return matchesPrice && matchesBrand && matchesRating;
    });

    switch (sortBy) {
      case 'newest': result.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()); break;
      case 'price_low': result.sort((a, b) => (a.discountPrice || a.price) - (b.discountPrice || b.price)); break;
      case 'price_high': result.sort((a, b) => (b.discountPrice || b.price) - (a.discountPrice || a.price)); break;
      case 'popularity': result.sort((a, b) => (b.soldCount || 0) - (a.soldCount || 0)); break;
    }

    return result;
  }, [products, sortBy, priceRange, selectedBrands, minRating]);

  const toggleBrand = (brand: string) => {
    setSelectedBrands(prev => prev.includes(brand) ? prev.filter(b => b !== brand) : [...prev, brand]);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-12 flex flex-col lg:flex-row gap-12 animate-fade-in">
      {/* Sidebar Filters */}
      <aside className="w-full lg:w-[280px] shrink-0 space-y-10">
        <div className="bg-white border border-gray-100 rounded-[32px] p-8 space-y-8 shadow-sm">
          <h3 className="text-xs font-black uppercase tracking-[0.2em] text-gray-400">Filters</h3>
          
          {/* Price Range */}
          <div className="space-y-4">
            <p className="text-[10px] font-black uppercase tracking-widest text-gray-900">Price Protocol</p>
            <div className="flex gap-2">
              <input 
                type="number" placeholder="Min" 
                className="w-full bg-gray-50 border-none rounded-xl py-3 px-4 text-xs font-bold"
                value={priceRange.min || ''}
                onChange={e => setPriceRange({...priceRange, min: Number(e.target.value)})}
              />
              <input 
                type="number" placeholder="Max" 
                className="w-full bg-gray-50 border-none rounded-xl py-3 px-4 text-xs font-bold"
                value={priceRange.max || ''}
                onChange={e => setPriceRange({...priceRange, max: Number(e.target.value)})}
              />
            </div>
          </div>

          {/* Brands */}
          {brands.length > 0 && (
            <div className="space-y-4">
              <p className="text-[10px] font-black uppercase tracking-widest text-gray-900">Merchant Nodes</p>
              <div className="space-y-2">
                {brands.map(brand => (
                  <label key={brand} className="flex items-center gap-3 cursor-pointer group">
                    <input 
                      type="checkbox" 
                      className="w-4 h-4 rounded-md accent-[#FF5C00]"
                      checked={selectedBrands.includes(brand)}
                      onChange={() => toggleBrand(brand)}
                    />
                    <span className="text-xs font-bold text-gray-500 group-hover:text-gray-900 transition-colors uppercase tracking-tight">{brand}</span>
                  </label>
                ))}
              </div>
            </div>
          )}

          {/* Ratings */}
          <div className="space-y-4">
            <p className="text-[10px] font-black uppercase tracking-widest text-gray-900">Rating Threshold</p>
            <div className="space-y-2">
              {[4, 3, 2].map(r => (
                <label key={r} className="flex items-center gap-3 cursor-pointer group">
                  <input 
                    type="radio" 
                    name="rating"
                    className="w-4 h-4 rounded-full accent-[#FF5C00]"
                    checked={minRating === r}
                    onChange={() => setMinRating(r)}
                  />
                  <div className="flex items-center gap-1 text-xs font-bold text-gray-500 uppercase tracking-tight">
                    {r}+ Stars <i className="fas fa-star text-yellow-400 text-[10px] ml-1"></i>
                  </div>
                </label>
              ))}
              <button 
                onClick={() => setMinRating(0)}
                className="text-[9px] font-black uppercase text-[#FF5C00] pt-2"
              >Clear Threshold</button>
            </div>
          </div>
        </div>
      </aside>

      {/* Product Content */}
      <div className="flex-1 space-y-10">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          <div>
            <h2 className="text-3xl font-black text-gray-900 uppercase tracking-tighter">{title}</h2>
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-1">{filteredAndSortedProducts.length} Items Indexed</p>
          </div>
          
          <div className="flex items-center gap-4 bg-white border border-gray-100 rounded-2xl px-6 py-3 shadow-sm">
            <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Sort By</span>
            <select 
              className="bg-transparent text-[10px] font-black uppercase tracking-widest outline-none cursor-pointer text-gray-900"
              value={sortBy}
              onChange={e => setSortBy(e.target.value as SortOption)}
            >
              <option value="newest">Newest Terminal</option>
              <option value="popularity">Most Popular</option>
              <option value="price_low">Price: Low to High</option>
              <option value="price_high">Price: High to Low</option>
            </select>
          </div>
        </div>

        {filteredAndSortedProducts.length === 0 ? (
          <div className="bg-white rounded-[40px] border border-gray-100 p-24 text-center">
            <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-6 opacity-30">
              <i className="fas fa-search text-3xl"></i>
            </div>
            <p className="text-sm font-black text-gray-400 uppercase tracking-widest">No matching results in current node</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-8">
            {filteredAndSortedProducts.map(p => (
              <ProductCard 
                key={p.id} 
                product={p} 
                onClick={() => {}} 
                onAddToCart={(e) => { e.stopPropagation(); onAddToCart(p); }} 
                onPlaceOrder={(e) => { e.stopPropagation(); onPlaceOrder(p); }}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ListingView;

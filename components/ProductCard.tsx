
import React from 'react';
import { Product } from '../types';

interface ProductCardProps {
  product: Product;
  onClick: () => void;
  onAddToCart: (e: React.MouseEvent) => void;
  onPlaceOrder: (e: React.MouseEvent) => void;
}

const ProductCard: React.FC<ProductCardProps> = ({ product, onClick, onAddToCart, onPlaceOrder }) => {
  return (
    <div 
      className="bg-white transition-all duration-300 cursor-pointer group flex flex-col h-full border border-transparent hover:border-gray-100 rounded-lg p-2"
      onClick={onClick}
    >
      <div className="aspect-square overflow-hidden relative rounded-lg bg-gray-50">
        <img 
          src={product.images[0]} 
          alt={product.name} 
          className="w-full h-full object-cover group-hover:opacity-90 transition-opacity duration-300"
        />

        {product.discountPercentage && (
          <div className="absolute top-3 left-3 bg-[#FF5C00] text-white text-[10px] font-black px-2 py-1 rounded-md shadow-sm">
            -{product.discountPercentage}%
          </div>
        )}
        
        {/* Wishlist Button */}
        <button 
          onClick={(e) => { e.stopPropagation(); }}
          className="absolute top-3 right-3 w-8 h-8 rounded-full bg-white/90 shadow-sm flex items-center justify-center text-gray-600 hover:text-red-500 transition-all opacity-0 group-hover:opacity-100"
        >
          <i className="far fa-heart text-xs"></i>
        </button>
      </div>
      
      <div className="pt-3 flex flex-col flex-1">
        <h3 className="text-sm font-normal text-gray-900 line-clamp-2 leading-snug mb-1 group-hover:underline">
          {product.name}
        </h3>
        
        <div className="mt-auto">
          <div className="flex items-center gap-2">
            <span className="text-base font-bold text-gray-900">
              Rs. {(product.discountPrice || product.price).toLocaleString()}
            </span>
            {product.discountPrice && (
              <span className="text-xs text-gray-500 line-through">
                Rs. {product.price.toLocaleString()}
              </span>
            )}
          </div>
          
          {product.rating && (
            <div className="flex items-center gap-1 mt-1">
              <i className="fas fa-star text-gray-900 text-[10px]"></i>
              <span className="text-xs text-gray-600">{product.rating}</span>
            </div>
          )}

          <div className="mt-4 space-y-2">
            <button 
              onClick={onPlaceOrder}
              className="w-full py-2 bg-[#FF5C00] text-white text-[10px] font-black uppercase tracking-widest rounded-lg hover:bg-orange-600 transition-all shadow-sm shadow-orange-100"
            >
              Place Order
            </button>
            <button 
              onClick={onAddToCart}
              className="w-full py-2 bg-gray-50 text-gray-700 text-[10px] font-black uppercase tracking-widest rounded-lg hover:bg-gray-200 transition-all"
            >
              Add to Cart
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductCard;


import React from 'react';

interface LogoProps {
  className?: string;
  iconSize?: string;
  textSize?: string;
  onClick?: () => void;
}

const Logo: React.FC<LogoProps> = ({ className = "", iconSize = "w-10 h-10", textSize = "text-2xl text-gray-900", onClick }) => {
  return (
    <div 
      className={`flex items-center gap-3 cursor-pointer group ${className}`} 
      onClick={onClick}
    >
      <div className={`${iconSize} bg-[#F1641E] rounded-[12px] flex items-center justify-center text-white shadow-lg shadow-orange-500/20 group-hover:scale-105 transition-transform duration-300`}>
        <i className="fas fa-shopping-bag"></i>
      </div>
      <span className={`${textSize} font-black tracking-tighter uppercase leading-none`}>
        Virtual <span className="text-[#F1641E]">Digital</span> Market
      </span>
    </div>
  );
};

export default Logo;

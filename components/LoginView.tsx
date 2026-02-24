
import React, { useState } from 'react';
import { Role, User } from '../types';
import { api } from '../services/api';

interface LoginViewProps {
  onLoginSuccess: (user: User) => void;
  onCancel: () => void;
}

const LoginView: React.FC<LoginViewProps> = ({ onLoginSuccess, onCancel }) => {
  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [role, setRole] = useState<Role>('BUYER');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      if (isRegister) {
        const user = await api.register({ name, email, password, role });
        if (user.role === 'SELLER') {
          localStorage.setItem('sellerName', user.name);
        }
        onLoginSuccess(user);
      } else {
        const user = await api.login(email, password);
        if (user.role === 'SELLER') {
          localStorage.setItem('sellerName', user.name);
        }
        onLoginSuccess(user);
      }
    } catch (err: any) {
      setError(err.message || 'Authentication failed');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-12 animate-fade-in">
      <div className="max-w-md w-full bg-white rounded-[32px] shadow-2xl border border-gray-100 p-10 relative overflow-hidden">
        {/* Decorative background elements */}
        <div className="absolute -top-24 -right-24 w-48 h-48 bg-orange-50 rounded-full blur-3xl opacity-50"></div>
        <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-orange-50 rounded-full blur-3xl opacity-50"></div>

        <div className="relative z-10">
          <div className="text-center mb-10">
            <div className="w-16 h-16 bg-[#FF5C00] rounded-2xl flex items-center justify-center text-white mx-auto mb-6 shadow-lg shadow-orange-500/20">
              <i className={`fas ${isRegister ? 'fa-user-plus' : 'fa-lock'} text-2xl`}></i>
            </div>
            <h2 className="text-3xl font-black text-gray-900 tracking-tight">
              {isRegister ? 'Create Account' : 'Welcome Back'}
            </h2>
            <p className="text-sm text-gray-500 mt-2 font-medium">
              {isRegister ? 'Join the market protocol today' : 'Enter your credentials to access your terminal'}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {isRegister && (
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">Full Name</label>
                <div className="relative">
                  <i className="far fa-user absolute left-5 top-1/2 -translate-y-1/2 text-gray-400"></i>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="John Doe"
                    className="w-full pl-12 pr-6 py-4 bg-gray-50 border border-gray-100 rounded-2xl text-sm focus:bg-white focus:border-[#FF5C00] outline-none transition-all"
                  />
                </div>
              </div>
            )}

            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">Email Address</label>
              <div className="relative">
                <i className="far fa-envelope absolute left-5 top-1/2 -translate-y-1/2 text-gray-400"></i>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@gmail.com"
                  className="w-full pl-12 pr-6 py-4 bg-gray-50 border border-gray-100 rounded-2xl text-sm focus:bg-white focus:border-[#FF5C00] outline-none transition-all"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">Secure Password</label>
              <div className="relative">
                <i className="fas fa-shield-alt absolute left-5 top-1/2 -translate-y-1/2 text-gray-400"></i>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-12 pr-6 py-4 bg-gray-50 border border-gray-100 rounded-2xl text-sm focus:bg-white focus:border-[#FF5C00] outline-none transition-all"
                />
              </div>
            </div>

            {isRegister && (
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">Account Type</label>
                <div className="grid grid-cols-2 gap-4">
                  <button
                    type="button"
                    onClick={() => setRole('BUYER')}
                    className={`py-4 rounded-2xl text-xs font-black uppercase tracking-widest transition-all border-2 ${
                      role === 'BUYER' ? 'border-[#FF5C00] bg-orange-50 text-[#FF5C00]' : 'border-gray-100 bg-gray-50 text-gray-400'
                    }`}
                  >
                    Buyer
                  </button>
                  <button
                    type="button"
                    onClick={() => setRole('SELLER')}
                    className={`py-4 rounded-2xl text-xs font-black uppercase tracking-widest transition-all border-2 ${
                      role === 'SELLER' ? 'border-[#FF5C00] bg-orange-50 text-[#FF5C00]' : 'border-gray-100 bg-gray-50 text-gray-400'
                    }`}
                  >
                    Seller
                  </button>
                </div>
              </div>
            )}

            {error && (
              <div className="bg-red-50 border border-red-100 text-red-600 text-[11px] font-bold p-4 rounded-xl flex items-center gap-3 animate-shake">
                <i className="fas fa-exclamation-circle"></i>
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 bg-gray-900 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-[#FF5C00] hover:shadow-xl hover:shadow-orange-500/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3"
            >
              {loading ? (
                <i className="fas fa-spinner fa-spin"></i>
              ) : (
                <>
                  {isRegister ? 'Create Account' : 'Authenticate'}
                  <i className="fas fa-arrow-right"></i>
                </>
              )}
            </button>
          </form>

          <div className="mt-8 text-center">
            <button
              onClick={() => setIsRegister(!isRegister)}
              className="text-xs font-bold text-[#FF5C00] hover:underline"
            >
              {isRegister ? 'Already have an account? Login' : "Don't have an account? Register"}
            </button>
          </div>

          <div className="mt-10 pt-8 border-t border-gray-50 text-center">
            <button 
              onClick={onCancel}
              className="text-xs font-bold text-gray-400 hover:text-gray-900 transition-colors"
            >
              Cancel and return to market
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginView;

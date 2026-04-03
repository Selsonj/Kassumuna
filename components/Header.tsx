
import React from 'react';
import { User } from '../types';

interface HeaderProps {
  user: User | null;
  onGoHome: () => void;
  onGoToDashboard: () => void;
  onLoginClick: () => void;
  onLogout: () => void;
  isDashboard?: boolean;
}

export const Header: React.FC<HeaderProps> = ({ user, onGoHome, onGoToDashboard, onLoginClick, onLogout, isDashboard }) => {
  return (
    <header className="sticky top-0 z-50 bg-zinc-950/80 backdrop-blur-md border-b border-zinc-800 px-4 py-4 flex items-center justify-between">
      <div 
        className="flex items-center gap-2 cursor-pointer" 
        onClick={onGoHome}
      >
        <span className="text-2xl font-black text-orange-500 tracking-tighter">KASSUMUNA</span>
      </div>
      
      <div className="flex items-center gap-3">
        {user ? (
          <div className="flex items-center gap-3">
            <button 
              onClick={isDashboard ? onGoHome : onGoToDashboard}
              className="hidden sm:block px-4 py-2 text-xs font-bold rounded-full border border-zinc-800 hover:bg-zinc-900 transition-colors"
            >
              {isDashboard ? 'Explorar' : (user.role === 'client' ? 'Meus Pedidos' : 'Painel')}
            </button>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-orange-500 flex items-center justify-center text-[10px] font-black">
                {user.name.charAt(0).toUpperCase()}
              </div>
              <button onClick={onLogout} className="text-zinc-500 hover:text-white">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
              </button>
            </div>
          </div>
        ) : (
          <button 
            onClick={onLoginClick}
            className="px-6 py-2 bg-zinc-900 text-white text-xs font-bold rounded-full border border-zinc-800 hover:bg-zinc-800 transition-colors"
          >
            LOGIN
          </button>
        )}
      </div>
    </header>
  );
};

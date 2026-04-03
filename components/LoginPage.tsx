
import React, { useState } from 'react';
import { User } from '../types';
import { StorageService } from '../services/storage';

interface LoginPageProps {
  onLogin: (user: User) => void;
  onBack: () => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({ onLogin, onBack }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGoogleLogin = async () => {
    setLoading(true);
    setError(null);
    try {
      const user = await StorageService.login();
      if (user) {
        onLogin(user);
      } else {
        // Se o login retornar null sem lançar erro (caso do catch no StorageService)
        // Mas vamos melhorar o StorageService para lançar o erro se quisermos capturar aqui
      }
    } catch (err: any) {
      if (err.code === 'auth/popup-closed-by-user') {
        setError('O login foi cancelado. Por favor, tenta novamente sem fechar a janela.');
      } else if (err.code === 'auth/blocked-at-interaction') {
        setError('O popup de login foi bloqueado pelo navegador.');
      } else {
        setError('Ocorreu um erro ao tentar entrar. Tenta novamente.');
      }
      console.error('Login error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-sm mx-auto pt-12 animate-in slide-in-from-bottom-4 duration-500">
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-black text-orange-500 tracking-tighter mb-2 uppercase italic">KASSUMUNA</h1>
        <p className="text-zinc-400">Entra para pedires vídeos aos teus ídolos.</p>
      </div>

      <div className="space-y-6 text-center">
        <div className="bg-zinc-900/50 border border-zinc-800 p-8 rounded-3xl space-y-6">
          <div className="w-16 h-16 bg-orange-500/10 rounded-full flex items-center justify-center mx-auto border border-orange-500/20">
            <svg className="w-8 h-8 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          
          <div className="space-y-2">
            <h2 className="text-xl font-bold text-white">Login Seguro</h2>
            <p className="text-sm text-zinc-500">Usa a tua conta Google para acederes à plataforma de forma rápida e segura.</p>
          </div>

          {error && (
            <div className="bg-red-500/10 border border-red-500/20 text-red-500 text-xs p-3 rounded-xl animate-in fade-in zoom-in duration-300">
              {error}
            </div>
          )}

          <button 
            onClick={handleGoogleLogin}
            disabled={loading}
            className="w-full bg-white text-black font-black py-4 rounded-2xl flex items-center justify-center gap-3 hover:bg-zinc-200 transition-all active:scale-95 disabled:opacity-50"
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-black/20 border-t-black rounded-full animate-spin" />
            ) : (
              <>
                <img src="https://www.google.com/favicon.ico" className="w-5 h-5" alt="Google" />
                CONTINUAR COM GOOGLE
              </>
            )}
          </button>
        </div>

        <button 
          onClick={onBack}
          className="text-xs text-zinc-600 hover:text-zinc-400 transition-colors uppercase font-bold tracking-widest"
        >
          Voltar para Explorar
        </button>
      </div>
    </div>
  );
};

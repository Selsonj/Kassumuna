
import React, { useState } from 'react';
import { BANK_DETAILS } from '../constants';
import { StorageService } from '../services/storage';

interface CheckoutPageProps {
  order: any;
  onConfirm: (proofUrl?: string) => void;
  onBack: () => void;
}

export const CheckoutPage: React.FC<CheckoutPageProps> = ({ order, onConfirm, onBack }) => {
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      setError('O ficheiro é muito grande. O limite é 5MB.');
      return;
    }

    setIsUploading(true);
    setError(null);
    try {
      const proofUrl = await StorageService.uploadProof(file);
      onConfirm(proofUrl);
    } catch (err: any) {
      console.error('Error uploading proof:', err);
      setError('Erro ao carregar comprovativo. Tente novamente.');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="p-4 max-w-lg mx-auto space-y-6 pt-8">
      <button onClick={onBack} className="flex items-center gap-2 text-zinc-400 hover:text-white mb-4">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
        </svg>
        Voltar
      </button>

      <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6 shadow-xl">
        <h2 className="text-2xl font-bold mb-6">Finalizar Pagamento</h2>
        
        <div className="space-y-4 mb-8">
          <div className="flex justify-between py-2 border-b border-zinc-800">
            <span className="text-zinc-400">Artista</span>
            <span className="font-medium text-white">{order.artistName}</span>
          </div>
          <div className="flex justify-between py-2 border-b border-zinc-800">
            <span className="text-zinc-400">Total a Pagar</span>
            <span className="font-bold text-orange-500 text-lg">{order.priceKz.toLocaleString('pt-AO')} Kz</span>
          </div>
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/20 text-red-500 text-xs p-3 rounded-xl mb-4">
            {error}
          </div>
        )}

        <div className="bg-zinc-950 p-5 rounded-2xl border border-orange-500/20 mb-8 space-y-4">
          <h3 className="text-xs font-bold text-orange-500 uppercase tracking-widest">Dados para Transferência (IBAN)</h3>
          
          <div>
            <p className="text-[10px] text-zinc-500 uppercase">Banco</p>
            <p className="text-sm font-medium">{BANK_DETAILS.bank}</p>
          </div>
          
          <div>
            <p className="text-[10px] text-zinc-500 uppercase">IBAN</p>
            <p className="text-sm font-mono break-all font-bold text-white tracking-wider">{BANK_DETAILS.iban}</p>
          </div>

          <div>
            <p className="text-[10px] text-zinc-500 uppercase">Referência Express</p>
            <p className="text-sm font-bold text-white">{BANK_DETAILS.expressReference}</p>
          </div>
        </div>

        <div className="space-y-4">
          <p className="text-xs text-zinc-400 text-center">
            Após transferir, carregue o comprovativo para validarmos o seu pedido.
          </p>
          
          <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-zinc-800 border-dashed rounded-2xl cursor-pointer hover:bg-zinc-800 transition-colors">
            <div className="flex flex-col items-center justify-center pt-5 pb-6">
              <svg className="w-8 h-8 mb-4 text-zinc-500" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 20 16">
                <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 13h3a3 3 0 0 0 0-6h-.025A5.56 5.56 0 0 0 16 6.5 5.5 5.5 0 0 0 5.207 5.021C5.137 5.017 5.071 5 5 5a4 4 0 0 0 0 8h2.167M10 15V6m0 0L8 8m2-2 2 2"/>
              </svg>
              <p className="text-sm text-zinc-400">Clicar para carregar comprovativo</p>
            </div>
            <input type="file" className="hidden" onChange={handleFileUpload} disabled={isUploading} />
          </label>

          {isUploading && (
            <div className="flex items-center justify-center gap-2 text-orange-500 text-sm font-medium">
              <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Validando comprovativo...
            </div>
          )}
        </div>
      </div>
    </div>
  );
};


import React, { useState } from 'react';
import { Artist } from '../types';
import { AIService } from '../services/ai';

interface OrderFormProps {
  artist: Artist;
  onSubmit: (formData: any) => void;
  onCancel: () => void;
}

export const OrderForm: React.FC<OrderFormProps> = ({ artist, onSubmit, onCancel }) => {
  const [formData, setFormData] = useState({
    from: '',
    to: '',
    occasion: 'Aniversário',
    instructions: '',
    contactEmail: '',
  });
  const [isEnhancing, setIsEnhancing] = useState(false);

  const handleEnhance = async () => {
    if (!formData.instructions) return;
    setIsEnhancing(true);
    const improved = await AIService.enhanceInstructions(formData.instructions, formData.occasion, artist.name);
    setFormData(prev => ({ ...prev, instructions: improved }));
    setIsEnhancing(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      ...formData,
      artistId: artist.id,
      artistName: artist.name,
      priceKz: artist.priceKz,
      createdAt: Date.now(),
      status: 'Pendente'
    });
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-zinc-900 w-full max-w-lg rounded-t-3xl sm:rounded-3xl overflow-hidden shadow-2xl border-t sm:border border-zinc-800">
        <div className="p-6 border-b border-zinc-800 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold">Pedir Vídeo</h2>
            <p className="text-sm text-zinc-400">para {artist.name}</p>
          </div>
          <button onClick={onCancel} className="p-2 hover:bg-zinc-800 rounded-full transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-zinc-500 mb-1 uppercase tracking-wider">De quem?</label>
              <input 
                required
                className="w-full bg-zinc-800 border border-zinc-700 rounded-xl p-3 text-white focus:outline-none focus:border-orange-500 transition-all"
                placeholder="Teu nome"
                value={formData.from}
                onChange={e => setFormData({...formData, from: e.target.value})}
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-zinc-500 mb-1 uppercase tracking-wider">Para quem?</label>
              <input 
                required
                className="w-full bg-zinc-800 border border-zinc-700 rounded-xl p-3 text-white focus:outline-none focus:border-orange-500 transition-all"
                placeholder="Nome do fã"
                value={formData.to}
                onChange={e => setFormData({...formData, to: e.target.value})}
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-zinc-500 mb-1 uppercase tracking-wider">Ocasião</label>
            <select 
              className="w-full bg-zinc-800 border border-zinc-700 rounded-xl p-3 text-white focus:outline-none focus:border-orange-500 appearance-none transition-all"
              value={formData.occasion}
              onChange={e => setFormData({...formData, occasion: e.target.value})}
            >
              <option>Aniversário</option>
              <option>Pedido de Namoro</option>
              <option>Saudação</option>
              <option>Casamento</option>
              <option>Outro</option>
            </select>
          </div>

          <div className="relative">
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs font-semibold text-zinc-500 uppercase tracking-wider">Instruções para o artista</label>
              <button 
                type="button"
                onClick={handleEnhance}
                disabled={isEnhancing || !formData.instructions}
                className="text-[10px] flex items-center gap-1 font-bold text-orange-500 hover:text-orange-400 disabled:text-zinc-600 transition-colors uppercase"
              >
                {isEnhancing ? (
                  <span className="flex items-center gap-1"><div className="animate-spin h-2 w-2 border border-orange-500 border-t-transparent rounded-full"/> Otimizando...</span>
                ) : (
                  <><span className="text-base">✨</span> Melhorar com IA</>
                )}
              </button>
            </div>
            <textarea 
              rows={3}
              required
              className="w-full bg-zinc-800 border border-zinc-700 rounded-xl p-3 text-white focus:outline-none focus:border-orange-500 transition-all"
              placeholder="Ex: Diz que ele é o melhor engenheiro do Cazenga..."
              value={formData.instructions}
              onChange={e => setFormData({...formData, instructions: e.target.value})}
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-zinc-500 mb-1 uppercase tracking-wider">Teu Email ou WhatsApp</label>
            <input 
              required
              className="w-full bg-zinc-800 border border-zinc-700 rounded-xl p-3 text-white focus:outline-none focus:border-orange-500 transition-all"
              placeholder="Para receberes o vídeo"
              value={formData.contactEmail}
              onChange={e => setFormData({...formData, contactEmail: e.target.value})}
            />
          </div>

          <div className="pt-4 sticky bottom-0 bg-zinc-900">
            <button 
              type="submit"
              className="w-full bg-orange-500 hover:bg-orange-600 text-white font-bold py-4 rounded-xl transition-all shadow-lg shadow-orange-500/20 active:scale-95"
            >
              Pagar {artist.priceKz.toLocaleString('pt-AO')} Kz
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

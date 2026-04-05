
import React, { useEffect, useState } from 'react';
import { Artist, User, Order } from '../types';
import { StorageService } from '../services/storage';
import { Play, Share2, Star, Zap, ChevronLeft, CheckCircle2, Info } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface ArtistProfileProps {
  artist: Artist;
  user: User | null;
  onBack: () => void;
  onBook: (type: 'personal' | 'business') => void;
}

export const ArtistProfile: React.FC<ArtistProfileProps> = ({ artist, user, onBack, onBook }) => {
  const [completedOrders, setCompletedOrders] = useState<Order[]>([]);
  const [isLoadingVideos, setIsLoadingVideos] = useState(true);
  const [selectedVideo, setSelectedVideo] = useState<string | null>(null);

  useEffect(() => {
    const fetchVideos = async () => {
      setIsLoadingVideos(true);
      try {
        const orders = await StorageService.getOrders(undefined, artist.id, 'Concluido');
        setCompletedOrders(orders.filter(o => o.videoUrl));
      } catch (err) {
        console.error('Error fetching artist videos:', err);
      } finally {
        setIsLoadingVideos(false);
      }
    };
    fetchVideos();
  }, [artist.id]);

  const occasions = [
    { emoji: '🎂', label: 'Aniversário' },
    { emoji: '🤩', label: 'Dar Força' },
    { emoji: '🔥', label: 'Fazer Roast' },
    { emoji: '💜', label: 'Conselho' },
    { emoji: '🙋‍♂️', label: 'Pergunta' },
    { emoji: '💬', label: 'Outro' }
  ];

  const handleShare = async (videoUrl: string, artistName: string) => {
    const shareData = {
      title: `Vídeo da Kassumuna - ${artistName}`,
      text: `Vê este vídeo incrível que recebi da Kassumuna!`,
      url: videoUrl,
    };

    try {
      if (navigator.share) {
        await navigator.share(shareData);
      } else {
        await navigator.clipboard.writeText(videoUrl);
        alert('Link copiado para a área de transferência!');
      }
    } catch (err) {
      if ((err as Error).name !== 'AbortError') {
        console.error('Error sharing:', err);
      }
    }
  };

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Top Bar */}
      <div className="sticky top-0 z-50 bg-black/80 backdrop-blur-md p-4 flex items-center justify-between border-b border-zinc-900">
        <button onClick={onBack} className="p-2 hover:bg-zinc-900 rounded-full transition-colors">
          <ChevronLeft className="h-6 w-6" />
        </button>
        <button className="p-2 hover:bg-zinc-900 rounded-full">
          <Share2 className="h-6 w-6" />
        </button>
      </div>

      {/* Artist Header */}
      <div className="p-6 flex items-center gap-4">
        <div className="relative">
          <img 
            src={artist.imageUrl} 
            className="w-20 h-20 rounded-full object-cover border-2 border-orange-500 p-0.5" 
            alt={artist.name} 
          />
          <div className="absolute bottom-0 right-0 w-5 h-5 bg-blue-500 rounded-full border-2 border-black flex items-center justify-center">
            <CheckCircle2 className="w-3 h-3 text-white" />
          </div>
        </div>
        <div>
          <h1 className="text-2xl font-black tracking-tight">{artist.name}</h1>
          <p className="text-zinc-500 text-sm font-medium">{artist.category} de Angola</p>
        </div>
      </div>

      {/* Video Reel */}
      <div className="px-6 pb-4">
        <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-4">Vídeos Gravados</h3>
        <div className="flex gap-3 overflow-x-auto no-scrollbar pb-2">
          {isLoadingVideos ? (
            Array(3).fill(0).map((_, i) => (
              <div key={i} className="flex-shrink-0 w-32 aspect-[9/16] bg-zinc-900 rounded-2xl animate-pulse" />
            ))
          ) : completedOrders.length > 0 ? (
            completedOrders.map((order) => (
              <motion.div 
                key={order.id}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setSelectedVideo(order.videoUrl || null)}
                className="flex-shrink-0 w-32 aspect-[9/16] bg-zinc-900 rounded-2xl relative overflow-hidden group cursor-pointer"
              >
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent z-10" />
                <video 
                  key={order.videoUrl}
                  src={order.videoUrl} 
                  className="w-full h-full object-cover opacity-60 group-hover:opacity-80 transition-opacity"
                  muted
                  playsInline
                />
                <div className="absolute inset-0 flex items-center justify-center z-20">
                  <div className="w-8 h-8 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center">
                    <Play className="w-4 h-4 text-white fill-current" />
                  </div>
                </div>
                <span className="absolute bottom-2 left-2 text-[10px] font-bold text-white/90 z-20 truncate w-[90%]">
                  {order.occasion}
                </span>
              </motion.div>
            ))
          ) : (
            <div className="w-full py-8 text-center text-zinc-600 text-sm italic border border-dashed border-zinc-900 rounded-2xl">
              Ainda sem vídeos públicos. Sê o primeiro!
            </div>
          )}
        </div>
      </div>

      {/* Video Modal */}
      <AnimatePresence>
        {selectedVideo && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black/95 flex items-center justify-center p-4"
            onClick={() => setSelectedVideo(null)}
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="relative w-full max-w-sm aspect-[9/16] bg-zinc-900 rounded-3xl overflow-hidden shadow-2xl"
              onClick={e => e.stopPropagation()}
            >
              <div className="relative w-full h-full">
                <video 
                  key={selectedVideo}
                  src={selectedVideo} 
                  className="w-full h-full object-contain"
                  controls
                  autoPlay
                  playsInline
                  preload="auto"
                />
              </div>
              <button 
                onClick={() => setSelectedVideo(null)}
                className="absolute top-4 right-4 p-2 bg-black/50 backdrop-blur-md rounded-full text-white z-50"
              >
                <ChevronLeft className="w-6 h-6 rotate-180" />
              </button>
              <button 
                onClick={() => handleShare(selectedVideo, artist.name)}
                className="absolute bottom-4 right-4 p-3 bg-orange-600 rounded-full text-white shadow-lg z-50"
              >
                <Share2 className="w-6 h-6" />
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Stats Grid */}
      <div className="grid grid-cols-3 gap-0 border-y border-zinc-900 mt-4 py-4 px-2">
        <div className="text-center border-r border-zinc-900">
          <p className="text-[10px] text-zinc-500 uppercase font-bold tracking-widest">Preço</p>
          <p className="text-sm font-bold mt-1 text-orange-500">{artist.priceKz.toLocaleString('pt-AO')} Kz</p>
        </div>
        <div className="text-center border-r border-zinc-900">
          <p className="text-[10px] text-zinc-500 uppercase font-bold tracking-widest">Entrega</p>
          <p className="text-sm font-bold mt-1 flex items-center justify-center gap-1">
            <Zap className="w-3 h-3 text-yellow-500 fill-current" /> {artist.deliveryTimeDays} dias
          </p>
        </div>
        <div className="text-center">
          <p className="text-[10px] text-zinc-500 uppercase font-bold tracking-widest">Reviews</p>
          <p className="text-sm font-bold mt-1 flex items-center justify-center gap-1">
            <Star className="w-3 h-3 text-orange-500 fill-current" /> {artist.rating} <span className="text-zinc-500 text-[10px]">(405)</span>
          </p>
        </div>
      </div>

      {/* Primary CTAs */}
      <div className="p-6 space-y-3">
        <button 
          onClick={() => onBook('personal')}
          className="w-full bg-orange-600 hover:bg-orange-500 text-white font-black py-4 rounded-full shadow-lg shadow-orange-600/20 flex items-center justify-center gap-2 transition-all active:scale-95"
        >
          <Play className="w-5 h-5 fill-current" />
          PEDIR VÍDEO PESSOAL
        </button>
        <button 
          onClick={() => onBook('business')}
          className="w-full bg-transparent border border-zinc-800 hover:bg-zinc-900 text-white font-bold py-4 rounded-full flex items-center justify-center gap-2 transition-all"
        >
          <Info className="w-5 h-5" />
          VÍDEO PARA EMPRESAS
        </button>
      </div>

      {/* Reason Chips */}
      <div className="px-6 space-y-3">
        <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-widest">RAZÕES PARA PEDIR</h3>
        <div className="flex flex-wrap gap-2">
          {occasions.map(occ => (
            <button key={occ.label} className="flex items-center gap-2 bg-zinc-900 border border-zinc-800 hover:border-zinc-700 px-4 py-2 rounded-full text-sm font-medium transition-all">
              <span>{occ.emoji}</span> {occ.label}
            </button>
          ))}
        </div>
      </div>

      {/* Description */}
      <div className="p-6 space-y-4">
        <p className="text-zinc-400 text-sm leading-relaxed">
          {artist.bio} Os vídeos personalizados para fãs cobrem uma vasta gama de ocasiões, desde celebrações de aniversário até mensagens motivadoras...
          <button className="text-white font-bold ml-1">Ler mais</button>
        </p>
        
        <div className="flex items-center gap-2 text-[10px] text-zinc-500">
          <span className="text-orange-500">✨</span> Escrito pela IA da Kassumuna baseado em exemplos reais
        </div>
      </div>

      {/* Info Stats */}
      <div className="px-6 py-4 border-t border-zinc-900 space-y-2">
        <div className="flex items-center gap-2 text-xs text-zinc-400">
          <span>✸</span> Duração média do vídeo: <b>00:35</b>
        </div>
        <div className="flex items-center gap-2 text-xs text-zinc-400">
          <span>✸</span> Último vídeo entregue: <b>hoje às 14:20</b>
        </div>
      </div>

      {/* What to Expect */}
      <div className="p-6 bg-zinc-950 mt-4 space-y-6 rounded-t-[32px]">
        <h3 className="font-black text-xl">O QUE ESPERAR</h3>
        <div className="space-y-6">
          <div className="flex gap-4">
            <div className="w-10 h-10 bg-zinc-900 rounded-xl flex items-center justify-center flex-shrink-0">
              <Star className="w-5 h-5 text-zinc-400" />
            </div>
            <div>
              <p className="font-bold text-sm">Escreve as instruções</p>
              <p className="text-xs text-zinc-500">Diz ao artista o que ele deve dizer ou fazer.</p>
            </div>
          </div>
          <div className="flex gap-4">
            <div className="w-10 h-10 bg-zinc-900 rounded-xl flex items-center justify-center flex-shrink-0">
              <Play className="w-5 h-5 text-zinc-400" />
            </div>
            <div>
              <p className="font-bold text-sm">Recebe o teu vídeo</p>
              <p className="text-xs text-zinc-500">O vídeo chegará no teu email ou WhatsApp.</p>
            </div>
          </div>
        </div>
        
        <div className="pt-8 pb-12 flex justify-center gap-4 opacity-30 grayscale">
          <span className="font-black text-xs">MULTICAIXA</span>
          <span className="font-black text-xs">VISA</span>
          <span className="font-black text-xs">BFA</span>
        </div>
      </div>
    </div>
  );
};

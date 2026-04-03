import React, { useEffect, useState } from 'react';
import { Order, User } from '../types';
import { StorageService } from '../services/storage';
import { ChevronLeft, Download, Clock, CheckCircle2, AlertCircle, Play, XCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface CustomerOrdersProps {
  user: User;
  onBack: () => void;
}

export const CustomerOrders: React.FC<CustomerOrdersProps> = ({ user, onBack }) => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedVideo, setSelectedVideo] = useState<string | null>(null);

  useEffect(() => {
    setIsLoading(true);
    const unsubscribe = StorageService.subscribeToOrders((updatedOrders) => {
      setOrders(updatedOrders);
      setIsLoading(false);
    }, user.id);

    return () => unsubscribe();
  }, [user.id]);

  const getStatusColor = (status: Order['status']) => {
    switch (status) {
      case 'Pendente': return 'text-yellow-500 bg-yellow-500/10 border-yellow-500/20';
      case 'Pago': return 'text-blue-500 bg-blue-500/10 border-blue-500/20';
      case 'Concluido': return 'text-green-500 bg-green-500/10 border-green-500/20';
      case 'Cancelado': return 'text-red-500 bg-red-500/10 border-red-500/20';
      default: return 'text-zinc-500 bg-zinc-500/10 border-zinc-500/20';
    }
  };

  const getStatusIcon = (status: Order['status']) => {
    switch (status) {
      case 'Pendente': return <Clock className="w-3 h-3" />;
      case 'Pago': return <CheckCircle2 className="w-3 h-3" />;
      case 'Concluido': return <CheckCircle2 className="w-3 h-3" />;
      case 'Cancelado': return <XCircle className="w-3 h-3" />;
      default: return <AlertCircle className="w-3 h-3" />;
    }
  };

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Top Bar */}
      <div className="sticky top-0 z-50 bg-black/80 backdrop-blur-md p-4 flex items-center gap-4 border-b border-zinc-900">
        <button onClick={onBack} className="p-2 hover:bg-zinc-900 rounded-full transition-colors">
          <ChevronLeft className="h-6 w-6" />
        </button>
        <h1 className="text-xl font-black tracking-tight">MEUS PEDIDOS</h1>
      </div>

      <div className="p-6">
        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-32 bg-zinc-900 rounded-2xl animate-pulse" />
            ))}
          </div>
        ) : orders.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center space-y-4">
            <div className="w-20 h-20 bg-zinc-900 rounded-full flex items-center justify-center">
              <Play className="w-10 h-10 text-zinc-700" />
            </div>
            <div>
              <h3 className="text-lg font-bold">Ainda não tens pedidos</h3>
              <p className="text-zinc-500 text-sm mt-1">Explora os artistas e pede o teu primeiro vídeo!</p>
            </div>
            <button 
              onClick={onBack}
              className="bg-orange-600 text-white px-8 py-3 rounded-full font-bold text-sm"
            >
              VER ARTISTAS
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {orders.map((order) => (
              <motion.div 
                key={order.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-zinc-900/50 border border-zinc-800 rounded-2xl overflow-hidden"
              >
                <div className="p-4 flex items-start justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className={`text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full border ${getStatusColor(order.status)} flex items-center gap-1`}>
                        {getStatusIcon(order.status)}
                        {order.status}
                      </span>
                      <span className="text-[10px] text-zinc-500 font-mono">#{order.id.slice(0, 8)}</span>
                    </div>
                    <h3 className="font-bold text-lg">Para: {order.to}</h3>
                    <p className="text-xs text-zinc-400">Artista: <span className="text-white">{order.artistName}</span></p>
                    <p className="text-xs text-zinc-500">{new Date(order.createdAt).toLocaleDateString('pt-AO')}</p>
                  </div>
                  
                  {order.status === 'Concluido' && order.videoUrl && (
                    <button 
                      onClick={() => setSelectedVideo(order.videoUrl || null)}
                      className="w-12 h-12 bg-orange-600 rounded-full flex items-center justify-center shadow-lg shadow-orange-600/20 active:scale-95 transition-transform"
                    >
                      <Play className="w-6 h-6 text-white fill-current" />
                    </button>
                  )}
                </div>

                {order.status === 'Concluido' && order.videoUrl && (
                  <div className="px-4 pb-4">
                    <a 
                      href={order.videoUrl} 
                      download={`kassumuna_${order.id}.mp4`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full bg-zinc-800 hover:bg-zinc-700 text-white text-xs font-bold py-3 rounded-xl flex items-center justify-center gap-2 transition-colors"
                    >
                      <Download className="w-4 h-4" />
                      DESCARREGAR VÍDEO
                    </a>
                  </div>
                )}

                {order.status === 'Pendente' && (
                  <div className="px-4 pb-4">
                    <div className="bg-yellow-500/5 border border-yellow-500/10 p-3 rounded-xl flex gap-3">
                      <AlertCircle className="w-4 h-4 text-yellow-500 flex-shrink-0 mt-0.5" />
                      <p className="text-[10px] text-yellow-500/80 leading-relaxed">
                        O teu pedido está à espera de confirmação de pagamento. Se já pagaste, o Admin irá validar em breve.
                      </p>
                    </div>
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        )}
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
              <video 
                src={selectedVideo} 
                className="w-full h-full object-contain"
                controls
                autoPlay
              />
              <button 
                onClick={() => setSelectedVideo(null)}
                className="absolute top-4 right-4 p-2 bg-black/50 backdrop-blur-md rounded-full text-white"
              >
                <ChevronLeft className="w-6 h-6 rotate-180" />
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

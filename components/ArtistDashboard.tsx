
import React from 'react';
import { Order, User, Artist } from '../types';
import { StorageService } from '../services/storage';

interface ArtistDashboardProps {
  user: User;
  orders: Order[];
  artists?: Artist[];
  onCompleteOrder: (orderId: string) => void;
}

export const ArtistDashboard: React.FC<ArtistDashboardProps> = ({ user, orders, artists = [], onCompleteOrder }) => {
  const isAdmin = user.role === 'admin';
  const [isAddingArtist, setIsAddingArtist] = React.useState(false);
  const [editingArtistId, setEditingArtistId] = React.useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [uploadingOrderId, setUploadingOrderId] = React.useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = React.useState<number>(0);
  const [videoFiles, setVideoFiles] = React.useState<Record<string, string>>({});
  const [newArtist, setNewArtist] = React.useState({
    name: '',
    email: '',
    category: 'Música' as any,
    priceKz: 5000,
    imageUrl: '',
    bio: '',
    deliveryTimeDays: 3
  });

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2048 * 1024) { // 2MB limit for base64 in Firestore
        setError('A imagem é muito grande. Escolha uma imagem com menos de 2MB.');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setNewArtist({ ...newArtist, imageUrl: reader.result as string });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAddArtist = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newArtist.imageUrl) {
      setError('Por favor, adicione uma foto do artista.');
      return;
    }
    setIsSubmitting(true);
    setError(null);

    const artistData: Artist = {
      id: editingArtistId || Math.random().toString(36).substr(2, 9),
      ...newArtist,
      rating: 5.0
    };
    
    try {
      await StorageService.saveArtist(artistData);
      setIsAddingArtist(false);
      setEditingArtistId(null);
      setNewArtist({
        name: '',
        email: '',
        category: 'Música',
        priceKz: 5000,
        imageUrl: '',
        bio: '',
        deliveryTimeDays: 3
      });
    } catch (err: any) {
      console.error('Error adding artist:', err);
      setError('Erro ao salvar artista. Verifica a tua conexão ou permissões.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditArtist = (artist: Artist) => {
    setNewArtist({
      name: artist.name,
      email: artist.email,
      category: artist.category,
      priceKz: artist.priceKz,
      imageUrl: artist.imageUrl,
      bio: artist.bio,
      deliveryTimeDays: artist.deliveryTimeDays
    });
    setEditingArtistId(artist.id);
    setIsAddingArtist(true);
  };

  const [deletingArtistId, setDeletingArtistId] = React.useState<string | null>(null);

  const handleVideoChange = async (orderId: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 50 * 1024 * 1024) { // 50MB limit
        setError('O vídeo é muito grande. O limite é 50MB.');
        return;
      }
      setUploadingOrderId(orderId);
      setUploadProgress(0);
      setError(null);
      try {
        const downloadUrl = await StorageService.uploadVideo(orderId, file, (progress) => {
          setUploadProgress(Math.round(progress));
        });
        setVideoFiles(prev => ({ ...prev, [orderId]: downloadUrl }));
      } catch (err) {
        console.error('Error uploading video:', err);
        setError('Erro ao carregar o vídeo. Tenta novamente.');
      } finally {
        setUploadingOrderId(null);
        setUploadProgress(0);
      }
    }
  };

  const handleCompleteWithVideo = async (orderId: string) => {
    const videoUrl = videoFiles[orderId];
    if (!videoUrl) {
      setError('Por favor, carrega o vídeo antes de confirmar.');
      return;
    }
    setIsSubmitting(true);
    try {
      await StorageService.updateOrderVideo(orderId, videoUrl);
      // Remove from local state
      const newFiles = { ...videoFiles };
      delete newFiles[orderId];
      setVideoFiles(newFiles);
    } catch (err) {
      console.error('Error completing order:', err);
      setError('Erro ao completar pedido.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteArtist = async (artistId: string) => {
    setIsSubmitting(true);
    try {
      await StorageService.deleteArtist(artistId);
      setDeletingArtistId(null);
    } catch (err) {
      console.error('Error deleting artist:', err);
      setError('Erro ao remover artista. Verifica a tua conexão ou permissões.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="p-4 space-y-8">
      {/* Modal Confirmação de Exclusão */}
      {deletingArtistId && (
        <div className="fixed inset-0 z-[110] bg-black/90 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-zinc-900 border border-zinc-800 w-full max-w-xs rounded-[32px] p-8 space-y-6 animate-in zoom-in duration-300 text-center">
            <div className="w-16 h-16 bg-red-500/20 text-red-500 rounded-full flex items-center justify-center mx-auto">
              <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
            </div>
            <div className="space-y-2">
              <h3 className="text-xl font-bold">Tens a certeza?</h3>
              <p className="text-sm text-zinc-500">Esta ação não pode ser desfeita.</p>
            </div>
            {error && (
              <div className="bg-red-500/10 border border-red-500/20 text-red-500 text-[10px] p-2 rounded-lg">
                {error}
              </div>
            )}
            <div className="flex flex-col gap-2">
              <button 
                onClick={() => handleDeleteArtist(deletingArtistId)}
                disabled={isSubmitting}
                className="w-full bg-red-500 text-white font-bold py-3 rounded-xl hover:bg-red-600 transition-all disabled:opacity-50"
              >
                {isSubmitting ? 'REMOVENDO...' : 'SIM, REMOVER'}
              </button>
              <button 
                onClick={() => setDeletingArtistId(null)}
                disabled={isSubmitting}
                className="w-full bg-zinc-800 text-white font-bold py-3 rounded-xl hover:bg-zinc-700 transition-all disabled:opacity-50"
              >
                CANCELAR
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Novo Artista */}
      {isAddingArtist && (
        <div className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-zinc-900 border border-zinc-800 w-full max-w-md rounded-[32px] p-8 space-y-6 animate-in zoom-in duration-300">
            <div className="flex justify-between items-center">
              <h3 className="text-2xl font-black italic uppercase">{editingArtistId ? 'Editar Artista' : 'Novo Artista'}</h3>
              <button onClick={() => { setIsAddingArtist(false); setEditingArtistId(null); }} className="text-zinc-500 hover:text-white">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>

            <form onSubmit={handleAddArtist} className="space-y-4">
              {error && (
                <div className="bg-red-500/10 border border-red-500/20 text-red-500 text-xs p-3 rounded-xl">
                  {error}
                </div>
              )}

              <div className="flex flex-col items-center gap-4 py-2">
                <div className="w-24 h-24 rounded-full bg-zinc-950 border border-zinc-800 overflow-hidden flex items-center justify-center relative group">
                  {newArtist.imageUrl ? (
                    <img src={newArtist.imageUrl} className="w-full h-full object-cover" />
                  ) : (
                    <svg className="w-8 h-8 text-zinc-700" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                  )}
                  <label className="absolute inset-0 bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                    <span className="text-[10px] font-bold text-white uppercase tracking-widest">Trocar</span>
                    <input type="file" accept="image/*" className="hidden" onChange={handleImageChange} />
                  </label>
                </div>
                {!newArtist.imageUrl && <p className="text-[10px] text-zinc-500 uppercase font-bold tracking-widest">Adicionar Foto</p>}
              </div>
              <div>
                <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-1">Nome Artístico</label>
                <input 
                  required
                  disabled={isSubmitting}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-2xl p-4 text-sm focus:border-orange-500 outline-none transition-all disabled:opacity-50"
                  value={newArtist.name}
                  onChange={e => setNewArtist({...newArtist, name: e.target.value})}
                  placeholder="Ex: Anselmo Ralph"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-1">Email do Artista (para Login)</label>
                <input 
                  required
                  type="email"
                  disabled={isSubmitting}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-2xl p-4 text-sm focus:border-orange-500 outline-none transition-all disabled:opacity-50"
                  value={newArtist.email}
                  onChange={e => setNewArtist({...newArtist, email: e.target.value})}
                  placeholder="Ex: artista@gmail.com"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-1">Categoria</label>
                  <select 
                    disabled={isSubmitting}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-2xl p-4 text-sm focus:border-orange-500 outline-none transition-all disabled:opacity-50"
                    value={newArtist.category}
                    onChange={e => setNewArtist({...newArtist, category: e.target.value as any})}
                  >
                    <option>Música</option>
                    <option>Humor</option>
                    <option>TikTok</option>
                    <option>TV & Cinema</option>
                    <option>Influencer</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-1">Preço (Kz)</label>
                  <input 
                    required
                    type="number"
                    disabled={isSubmitting}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-2xl p-4 text-sm focus:border-orange-500 outline-none transition-all disabled:opacity-50"
                    value={newArtist.priceKz}
                    onChange={e => setNewArtist({...newArtist, priceKz: Number(e.target.value)})}
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-1">Bio / Descrição</label>
                <textarea 
                  required
                  disabled={isSubmitting}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-2xl p-4 text-sm focus:border-orange-500 outline-none transition-all h-24 resize-none disabled:opacity-50"
                  value={newArtist.bio}
                  onChange={e => setNewArtist({...newArtist, bio: e.target.value})}
                  placeholder="Breve descrição do artista..."
                />
              </div>

              <button 
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-orange-500 text-white font-black py-4 rounded-2xl hover:bg-orange-600 transition-all active:scale-95 shadow-lg shadow-orange-500/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isSubmitting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                    CADASTRANDO...
                  </>
                ) : (
                  editingArtistId ? 'ATUALIZAR ARTISTA' : 'CADASTRAR ARTISTA'
                )}
              </button>
            </form>
          </div>
        </div>
      )}

      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
        <h2 className="text-2xl font-bold mb-1">Olá, {user.name}</h2>
        <p className="text-zinc-400">
          {isAdmin 
            ? `Tens ${orders.length} pedidos pendentes no sistema.` 
            : `Tens ${orders.length} pedidos pendentes para gravar.`}
        </p>
      </div>

      {isAdmin && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold">Explorar Artistas</h3>
            <button 
              onClick={() => { setError(null); setIsAddingArtist(true); }}
              className="text-xs font-bold text-orange-500 bg-orange-500/10 px-4 py-2 rounded-full hover:bg-orange-500/20 transition-all"
            >
              + Novo Artista
            </button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {artists.map(artist => (
              <div key={artist.id} className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-12 h-12 rounded-full overflow-hidden flex-shrink-0 bg-zinc-800">
                    <img src={artist.imageUrl} className="w-full h-full object-cover" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-bold truncate">{artist.name}</p>
                    <p className="text-[10px] text-zinc-500">{artist.priceKz.toLocaleString('pt-AO')} Kz • {artist.category}</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button 
                    onClick={() => handleEditArtist(artist)}
                    className="p-2 text-zinc-500 hover:text-orange-500 hover:bg-orange-500/10 rounded-lg transition-all"
                    title="Editar"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                  </button>
                  <button 
                    onClick={() => { setError(null); setDeletingArtistId(artist.id); }}
                    className="p-2 text-zinc-500 hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-all"
                    title="Remover"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="space-y-4">
        <h3 className="text-lg font-bold">Pedidos de Vídeo</h3>
        {orders.length === 0 ? (
          <div className="bg-zinc-900 border border-dashed border-zinc-800 rounded-2xl p-12 text-center text-zinc-500">
            Ainda não recebeste pedidos. Partilha o teu perfil!
          </div>
        ) : (
          orders.map(order => (
            <div key={order.id} className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 flex flex-col gap-4">
              <div className="flex justify-between items-start">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-widest bg-zinc-800 text-zinc-400 px-2 py-0.5 rounded">
                    {order.occasion}
                  </span>
                  <h4 className="text-lg font-bold mt-2">Para: {order.to}</h4>
                  <p className="text-sm text-zinc-400">De: {order.from}</p>
                </div>
                <div className="text-right">
                  <span className="text-orange-500 font-bold">{order.priceKz.toLocaleString('pt-AO')} Kz</span>
                </div>
              </div>
              
              <div className="bg-zinc-950 p-4 rounded-xl border border-zinc-800 italic text-sm text-zinc-300">
                "{order.instructions}"
              </div>

              {order.status === 'Pago' && (
                <div className="space-y-3">
                  <label className="flex flex-col items-center justify-center w-full h-24 border-2 border-zinc-800 border-dashed rounded-xl cursor-pointer hover:bg-zinc-800 transition-colors">
                    <div className="flex flex-col items-center justify-center pt-5 pb-6">
                      {videoFiles[order.id] ? (
                        <div className="flex items-center gap-2 text-green-500 text-xs font-bold uppercase">
                          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>
                          Vídeo Carregado
                        </div>
                      ) : uploadingOrderId === order.id ? (
                        <div className="flex flex-col items-center gap-2 text-orange-500 text-xs font-bold uppercase">
                          <div className="relative w-10 h-10 flex items-center justify-center">
                            <div className="animate-spin absolute inset-0 border-2 border-orange-500 border-t-transparent rounded-full" />
                            <span className="text-[8px] font-black">{uploadProgress}%</span>
                          </div>
                          A carregar...
                        </div>
                      ) : (
                        <>
                          <svg className="w-6 h-6 mb-2 text-zinc-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
                          <p className="text-[10px] text-zinc-500 uppercase font-bold tracking-widest">Carregar Vídeo Gravado</p>
                        </>
                      )}
                    </div>
                    <input type="file" accept="video/*" className="hidden" onChange={(e) => handleVideoChange(order.id, e)} disabled={uploadingOrderId === order.id} />
                  </label>
                </div>
              )}

              <div className="flex gap-2">
                <button 
                  onClick={() => handleCompleteWithVideo(order.id)}
                  disabled={isSubmitting || uploadingOrderId === order.id || !videoFiles[order.id]}
                  className="flex-1 bg-green-600 hover:bg-green-700 disabled:bg-zinc-800 disabled:text-zinc-600 text-white font-bold py-3 rounded-xl text-sm transition-colors"
                >
                  {isSubmitting ? 'A PROCESSAR...' : 'Confirmar Entrega'}
                </button>
                <a 
                  href={order.proofUrl} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className={`px-4 py-3 bg-zinc-800 rounded-xl hover:bg-zinc-700 transition-colors flex items-center justify-center ${!order.proofUrl ? 'opacity-50 cursor-not-allowed pointer-events-none' : ''}`}
                  title="Ver Comprovativo"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                    <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
                  </svg>
                </a>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

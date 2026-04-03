
import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { ArtistCard } from './components/ArtistCard';
import { ArtistProfile } from './components/ArtistProfile';
import { OrderForm } from './components/OrderForm';
import { CheckoutPage } from './components/CheckoutPage';
import { ArtistDashboard } from './components/ArtistDashboard';
import { LoginPage } from './components/LoginPage';
import { CustomerOrders } from './components/CustomerOrders';
import { StorageService } from './services/storage';
import { auth, onAuthStateChanged } from './firebase';
import { ARTISTS, REVIEWS, CATEGORY_AVATARS } from './constants';
import { Artist, Order, Category, User } from './types';

const App: React.FC = () => {
  type View = 'home' | 'profile' | 'checkout' | 'dashboard' | 'success' | 'login';
  const [view, setView] = useState<View>('home');
  const [user, setUser] = useState<User | null>(null);
  const [selectedArtist, setSelectedArtist] = useState<Artist | null>(null);
  const [currentOrder, setCurrentOrder] = useState<any>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [artists, setArtists] = useState<Artist[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<Category | 'Todos'>('Todos');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        try {
          let userDoc = await StorageService.getUserDoc(firebaseUser.uid);
          
          // CRITICAL: Force admin role for the bootstrapped email if not set
          if (firebaseUser.email === 'upgradeangola@gmail.com' && (!userDoc || userDoc.role !== 'admin')) {
            const updatedData: User = {
              id: firebaseUser.uid,
              name: firebaseUser.displayName || 'Usuário',
              email: firebaseUser.email || '',
              role: 'admin'
            };
            
            try {
              if (!userDoc) {
                await StorageService.saveUser(updatedData);
              } else {
                await StorageService.updateUserRole(firebaseUser.uid, 'admin');
              }
              userDoc = updatedData;
            } catch (err) {
              console.error("Failed to force admin role:", err);
              // Fallback to local admin role if Firestore update fails
              userDoc = updatedData;
            }
          }

          if (userDoc) {
            setUser(userDoc);
          } else {
            setUser({
              id: firebaseUser.uid,
              name: firebaseUser.displayName || 'Usuário',
              email: firebaseUser.email || '',
              role: 'client'
            });
          }
        } catch (error) {
          console.error("Error fetching user doc:", error);
        }
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    const unsubscribeArtists = StorageService.subscribeToArtists(setArtists);
    
    return () => {
      unsubscribeAuth();
      unsubscribeArtists();
    };
  }, []);

  useEffect(() => {
    if (user) {
      let unsubscribeOrders;
      if (user.role === 'admin') {
        unsubscribeOrders = StorageService.subscribeToOrders(setOrders);
      } else if (user.role === 'artist' && user.artistId) {
        unsubscribeOrders = StorageService.subscribeToOrders(setOrders, undefined, user.artistId);
      } else {
        unsubscribeOrders = StorageService.subscribeToOrders(setOrders, user.id);
      }
      return () => unsubscribeOrders();
    } else {
      setOrders([]);
    }
  }, [user]);

  const handleArtistClick = (artist: Artist) => {
    setSelectedArtist(artist);
    setView('profile');
  };

  const handleLogin = (loggedUser: User) => {
    setUser(loggedUser);
    if (selectedArtist) setView('profile');
    else setView('home');
  };

  const handleLogout = async () => {
    await StorageService.logout();
    setUser(null);
    setView('home');
  };

  const handleOrderSubmit = (orderData: any) => {
    setCurrentOrder(orderData);
    setView('checkout');
  };

  const handlePaymentConfirm = async (proofUrl?: string) => {
    const newOrder: Order = {
      id: Math.random().toString(36).substr(2, 9),
      ...currentOrder,
      proofUrl,
      status: 'Pago',
      createdAt: Date.now()
    };
    await StorageService.saveOrder(newOrder);
    setView('success');
  };

  const handleCompleteOrder = async (orderId: string) => {
    await StorageService.updateOrderStatus(orderId, 'Concluido');
  };

  const filteredArtists = selectedCategory === 'Todos' 
    ? artists 
    : artists.filter(a => a.category.includes(selectedCategory as any) || a.category === selectedCategory);

  const top10 = filteredArtists.slice(0, 6);
  const instantArtists = filteredArtists.filter(a => a.deliveryTimeDays <= 2);
  const pendingOrders = orders.filter(o => o.status === 'Pago');

  // Helper component to render categories to avoid duplication in code
  const CategoriesSection = ({ title }: { title?: string }) => (
    <section className="px-4 space-y-4">
      {title && <h2 className="text-xl font-bold">{title}</h2>}
      <div className="flex gap-6 overflow-x-auto pb-4 no-scrollbar">
        {CATEGORY_AVATARS.map(cat => (
          <div 
            key={cat.label} 
            onClick={() => setSelectedCategory(cat.label as Category)}
            className="flex flex-col items-center gap-2 cursor-pointer group"
          >
            <div className={`w-16 h-16 rounded-full overflow-hidden border-2 transition-all ${selectedCategory === cat.label ? 'border-orange-500 ring-2 ring-orange-500/20' : 'border-zinc-800 group-hover:border-zinc-600'}`}>
              <img src={cat.img} className="w-full h-full object-cover" />
            </div>
            <span className={`text-[11px] font-bold transition-colors ${selectedCategory === cat.label ? 'text-white' : 'text-zinc-400 group-hover:text-zinc-200'}`}>
              {cat.label}
            </span>
          </div>
        ))}
        <div 
          onClick={() => setSelectedCategory('Todos')}
          className="flex flex-col items-center gap-2 cursor-pointer group"
        >
          <div className={`w-16 h-16 rounded-full border-2 flex items-center justify-center text-[10px] font-bold transition-all ${selectedCategory === 'Todos' ? 'border-orange-500 text-white bg-orange-500/10' : 'border-zinc-800 text-zinc-500 group-hover:border-zinc-600'}`}>
            Ver tudo
          </div>
          <span className={`text-[11px] font-bold transition-colors ${selectedCategory === 'Todos' ? 'text-white' : 'text-zinc-400 group-hover:text-zinc-200'}`}>
            Geral
          </span>
        </div>
      </div>
    </section>
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-orange-500/20 border-t-orange-500 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-24 max-w-2xl mx-auto border-x border-zinc-900 bg-black overflow-x-hidden">
      {(view === 'home' || view === 'dashboard') && (
        <Header 
          user={user}
          onGoHome={() => setView('home')} 
          onGoToDashboard={() => setView('dashboard')}
          onLoginClick={() => setView('login')}
          onLogout={handleLogout}
          isDashboard={view === 'dashboard'}
        />
      )}

      <main>
        {view === 'login' && (
          <LoginPage onLogin={handleLogin} onBack={() => setView('home')} />
        )}

        {view === 'home' && (
          <div className="space-y-12 animate-in fade-in duration-500">
            {/* Hero Section */}
            <section className="px-4 pt-8">
              <h1 className="text-4xl font-black text-white leading-tight tracking-tighter mb-2">
                Vídeos <span className="text-orange-500 uppercase italic">Kassumuna</span>
              </h1>
              <p className="text-zinc-400 text-lg">As estrelas de Angola ao teu alcance.</p>
            </section>

            {/* Categories (TOP POSITION) */}
            <CategoriesSection />

            {/* Top 10 Section */}
            <section className="space-y-4">
              <div className="flex items-center justify-between px-4">
                <h2 className="text-xl font-bold">Top 10 {selectedCategory !== 'Todos' ? `em ${selectedCategory}` : 'na Kassumuna'}</h2>
                <button className="text-zinc-400 text-sm font-bold">Ver tudo</button>
              </div>
              <div className="flex gap-3 overflow-x-auto px-4 no-scrollbar">
                {top10.length > 0 ? top10.map((artist, index) => (
                  <div 
                    key={artist.id} 
                    onClick={() => handleArtistClick(artist)}
                    className="flex-shrink-0 w-44 group cursor-pointer"
                  >
                    <div className="relative aspect-[3/4] rounded-2xl overflow-hidden mb-2">
                      <img src={artist.imageUrl} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                      <div className="absolute top-2 left-2 w-8 h-8 bg-black/60 backdrop-blur-md rounded-lg flex items-center justify-center border border-white/20">
                         <span className="text-sm font-black text-white">{index + 1}</span>
                      </div>
                      <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent" />
                      <div className="absolute bottom-2 left-2 right-2">
                         <p className="text-sm font-black text-white leading-tight uppercase">{artist.name.split(' ')[0]} <br/> {artist.name.split(' ')[1] || ''}</p>
                      </div>
                    </div>
                    <div className="flex items-center justify-between px-1">
                      <span className="text-[11px] font-bold text-orange-500">{artist.priceKz.toLocaleString('pt-AO')} Kz</span>
                      <span className="text-[11px] text-zinc-500">★ {artist.rating}</span>
                    </div>
                  </div>
                )) : (
                  <div className="w-full py-10 text-center text-zinc-500 text-sm font-medium">Nenhum artista nesta categoria por enquanto.</div>
                )}
              </div>
            </section>

            {/* Instant Delivery Section */}
            {instantArtists.length > 0 && (
              <section className="bg-zinc-950 py-10 px-4">
                <div className="mb-6">
                  <h2 className="text-2xl font-black text-white italic">VÍDEOS INSTANTÂNEOS</h2>
                  <p className="text-green-500 text-sm font-bold uppercase tracking-widest">Entrega de 0 a 60 minutos</p>
                </div>
                <div className="flex gap-4 overflow-x-auto no-scrollbar">
                  {instantArtists.map(artist => (
                    <div 
                      key={artist.id} 
                      onClick={() => handleArtistClick(artist)}
                      className="flex-shrink-0 w-40 cursor-pointer"
                    >
                      <div className="relative aspect-square rounded-2xl overflow-hidden mb-2 border-2 border-green-500/20">
                        <img src={artist.imageUrl} className="w-full h-full object-cover" />
                        <div className="absolute bottom-2 left-2 bg-green-500 text-black text-[9px] font-black px-2 py-1 rounded-full flex items-center gap-1">
                           <span className="animate-pulse">●</span> INSTANTÂNEO
                        </div>
                      </div>
                      <p className="text-sm font-bold truncate">{artist.name}</p>
                      <p className="text-[11px] text-zinc-500">A partir de {artist.priceKz.toLocaleString('pt-AO')} Kz</p>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* How it Works */}
            <section className="px-4 space-y-6">
              <h2 className="text-xl font-bold">Como funciona a Kassumuna</h2>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { icon: '🔍', title: 'Encontra a estrela', desc: 'Navega pelos talentos de Angola.' },
                  { icon: '✍️', title: 'Diz o que queres', desc: 'Escreve a tua mensagem personalizada.' },
                  { icon: '📩', title: 'Recebe o vídeo', desc: 'Em poucos dias no teu email ou zap.' },
                  { icon: '🎁', title: 'Surpreende!', desc: 'Partilha e guarda reações inestimáveis.' }
                ].map((step, i) => (
                  <div key={i} className="bg-zinc-900/50 p-4 rounded-2xl border border-zinc-800 space-y-2">
                    <span className="text-2xl">{step.icon}</span>
                    <h3 className="font-bold text-sm">{step.title}</h3>
                    <p className="text-[11px] text-zinc-500 leading-tight">{step.desc}</p>
                  </div>
                ))}
              </div>
            </section>

            {/* Recent Reviews */}
            <section className="px-4 space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold">Avaliações recentes</h2>
                <div className="flex gap-2">
                   <button className="w-8 h-8 rounded-full bg-zinc-900 flex items-center justify-center">←</button>
                   <button className="w-8 h-8 rounded-full bg-zinc-900 flex items-center justify-center">→</button>
                </div>
              </div>
              <div className="flex gap-4 overflow-x-auto no-scrollbar">
                {REVIEWS.map(rev => (
                  <div key={rev.id} className="flex-shrink-0 w-64 bg-zinc-900/30 border border-zinc-800 p-5 rounded-2xl space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex text-yellow-500 text-xs">{'★'.repeat(rev.star)}</div>
                      <span className="text-[10px] text-zinc-500 uppercase font-bold">{rev.name}</span>
                    </div>
                    <p className="text-xs font-bold text-orange-500 uppercase">{rev.context}</p>
                    <p className="text-xs text-zinc-400 italic leading-relaxed">"{rev.text}"</p>
                  </div>
                ))}
              </div>
            </section>

            {/* Categories (BOTTOM POSITION) */}
            <CategoriesSection title="Explorar Categorias" />

            {/* Footer / Value Props */}
            <section className="p-8 bg-zinc-950 space-y-8 border-t border-zinc-900">
               <div className="space-y-4">
                  <h3 className="font-black text-lg">ESTE É O KASSUMUNA</h3>
                  <div className="grid grid-cols-1 gap-6 text-zinc-400 text-sm">
                    <div>
                      <p className="text-white font-bold mb-1">Presentes únicos</p>
                      <p>Cada vídeo é personalizado para quem o recebe, criando ligações reais e mágicas.</p>
                    </div>
                    <div>
                      <p className="text-white font-bold mb-1">Perfeito para todas as ocasiões</p>
                      <p>Aniversários, feriados, pedidos de namoro ou só para dar uma força ao teu brada.</p>
                    </div>
                  </div>
               </div>
               <div className="text-center pt-8 border-t border-zinc-900 text-zinc-600 text-[10px] uppercase font-bold tracking-widest">
                  © 2024 Kassumuna Digital Lda - Angola
               </div>
            </section>
          </div>
        )}

        {view === 'profile' && selectedArtist && (
          <ArtistProfile 
            artist={selectedArtist}
            user={user}
            onBack={() => setView('home')}
            onBook={(type) => {
              if (!user) setView('login');
              else {
                document.getElementById('form-trigger')?.click();
              }
            }}
          />
        )}

        {view === 'checkout' && currentOrder && (
          <CheckoutPage 
            order={currentOrder} 
            onBack={() => setView('profile')} 
            onConfirm={handlePaymentConfirm} 
          />
        )}

        {view === 'dashboard' && user && (
          user.role === 'client' ? (
            <CustomerOrders 
              user={user} 
              onBack={() => setView('home')} 
            />
          ) : (
            <ArtistDashboard 
              user={user}
              orders={pendingOrders} 
              artists={artists}
              onCompleteOrder={handleCompleteOrder} 
            />
          )
        )}

        {view === 'success' && (
          <div className="p-8 text-center space-y-6 pt-20 animate-in zoom-in duration-300">
            <div className="w-24 h-24 bg-green-500/20 text-green-500 rounded-full flex items-center justify-center mx-auto ring-8 ring-green-500/5">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-3xl font-bold">Pedido Enviado!</h2>
            <p className="text-zinc-400">O comprovativo está em validação. O artista será notificado agora mesmo.</p>
            <button onClick={() => setView('home')} className="w-full bg-orange-500 text-white font-bold py-4 rounded-xl hover:bg-orange-600 transition-all shadow-lg">Voltar ao Início</button>
          </div>
        )}
      </main>

      {/* Modal Trigger & UI elements for Profile Flow */}
      {selectedArtist && user && view === 'profile' && (
        <div id="modal-container">
          <button 
            id="form-trigger" 
            className="hidden" 
            onClick={() => document.getElementById('order-form-modal')?.classList.remove('hidden')}
          />
          <div id="order-form-modal" className="hidden">
            <OrderForm 
              artist={selectedArtist} 
              onCancel={() => document.getElementById('order-form-modal')?.classList.add('hidden')}
              onSubmit={(data) => {
                document.getElementById('order-form-modal')?.classList.add('hidden');
                handleOrderSubmit(data);
              }}
            />
          </div>
        </div>
      )}

      {/* Navigation Bottom Bar */}
      {(view === 'home' || view === 'dashboard') && (
        <nav className="fixed bottom-0 left-0 right-0 max-w-2xl mx-auto bg-zinc-950/80 backdrop-blur-lg border-t border-zinc-900 p-3 flex justify-around items-center z-50">
          <button onClick={() => setView('home')} className={`flex flex-col items-center gap-1 transition-colors ${view === 'home' ? 'text-orange-500' : 'text-zinc-500'}`}>
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>
            <span className="text-[10px] font-bold">Explorar</span>
          </button>
          <button onClick={() => setView('dashboard')} className={`flex flex-col items-center gap-1 transition-colors ${view === 'dashboard' ? 'text-orange-500' : 'text-zinc-500'}`}>
            <div className="relative">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
              {pendingOrders.length > 0 && (
                <span className="absolute -top-1 -right-1 bg-orange-500 text-white text-[8px] font-black w-4 h-4 rounded-full flex items-center justify-center ring-2 ring-black">
                  {pendingOrders.length}
                </span>
              )}
            </div>
            <span className="text-[10px] font-bold">Painel</span>
          </button>
        </nav>
      )}
    </div>
  );
};

export default App;

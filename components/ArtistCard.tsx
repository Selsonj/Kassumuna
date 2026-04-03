
import React from 'react';
import { Artist } from '../types';

interface ArtistCardProps {
  artist: Artist;
  onClick: (artist: Artist) => void;
}

export const ArtistCard: React.FC<ArtistCardProps> = ({ artist, onClick }) => {
  return (
    <div 
      className="group relative overflow-hidden rounded-2xl bg-zinc-900 border border-zinc-800 hover:border-orange-500/50 transition-all cursor-pointer"
      onClick={() => onClick(artist)}
    >
      <div className="aspect-[3/4] overflow-hidden">
        <img 
          src={artist.imageUrl} 
          alt={artist.name}
          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-transparent to-transparent opacity-90" />
      </div>
      
      <div className="absolute bottom-0 left-0 right-0 p-4">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-[10px] font-bold uppercase tracking-widest bg-orange-600/20 text-orange-400 px-2 py-0.5 rounded">
            {artist.category}
          </span>
          <span className="text-zinc-400 text-xs font-medium">★ {artist.rating}</span>
        </div>
        <h3 className="text-lg font-bold text-white mb-0.5 leading-tight">{artist.name}</h3>
        <p className="text-orange-500 font-bold text-sm">
          {artist.priceKz.toLocaleString('pt-AO')} Kz
        </p>
      </div>
    </div>
  );
};

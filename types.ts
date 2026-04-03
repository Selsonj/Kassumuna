
export type Category = 'Música' | 'Humor' | 'TikTok' | 'TV & Cinema' | 'Influencer';

export type UserRole = 'client' | 'artist' | 'admin';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  artistId?: string; // Linked artist profile if role is 'artist'
}

export interface Artist {
  id: string;
  name: string;
  email: string; // Email used for login
  category: Category;
  priceKz: number;
  imageUrl: string;
  bio: string;
  rating: number;
  deliveryTimeDays: number;
}

export interface Order {
  id: string;
  artistId: string;
  artistName: string;
  from: string;
  to: string;
  occasion: string;
  instructions: string;
  contactEmail: string;
  status: 'Pendente' | 'Pago' | 'Concluido' | 'Cancelado';
  proofUrl?: string;
  videoUrl?: string;
  priceKz: number;
  createdAt: number;
  userId?: string;
}

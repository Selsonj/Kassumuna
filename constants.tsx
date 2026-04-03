
import { Artist } from './types';

export const ARTISTS: Artist[] = [
  {
    id: '1',
    name: 'Gilmário Vemba',
    email: 'gilmario@example.com',
    category: 'Humor',
    priceKz: 75000,
    imageUrl: 'https://picsum.photos/seed/gilmario/400/600',
    bio: 'Humorista Angolano, membro dos Tunezas e fenómeno da comédia lusófona.',
    rating: 4.9,
    deliveryTimeDays: 3
  },
  {
    id: '2',
    name: 'Gerilson Insrael',
    email: 'gerilson@example.com',
    category: 'Música',
    priceKz: 120000,
    imageUrl: 'https://picsum.photos/seed/gerilson/400/600',
    bio: 'A voz romântica de Angola. Autor de grandes sucessos como Minha Bêbada.',
    rating: 4.8,
    deliveryTimeDays: 5
  },
  {
    id: '3',
    name: 'Jandira Padre',
    email: 'jandira@example.com',
    category: 'TikTok',
    priceKz: 25000,
    imageUrl: 'https://picsum.photos/seed/jandira/400/600',
    bio: 'Criadora de conteúdos e rainha das tendências no TikTok Angola.',
    rating: 4.7,
    deliveryTimeDays: 2
  },
  {
    id: '4',
    name: 'Anselmo Ralph',
    email: 'anselmo@example.com',
    category: 'Música',
    priceKz: 250000,
    imageUrl: 'https://picsum.photos/seed/anselmo/400/600',
    bio: 'O Cupido de Angola. Um dos maiores artistas da história da música moderna.',
    rating: 5.0,
    deliveryTimeDays: 7
  },
  {
    id: '5',
    name: 'Cilana Manjenje',
    email: 'cilana@example.com',
    category: 'Influencer',
    priceKz: 45000,
    imageUrl: 'https://picsum.photos/seed/cilana/400/600',
    bio: 'Influenciadora digital e empreendedora, focada em lifestyle e moda.',
    rating: 4.9,
    deliveryTimeDays: 4
  },
  {
    id: '6',
    name: 'Tigre Chieta',
    email: 'tigre@example.com',
    category: 'Humor',
    priceKz: 35000,
    imageUrl: 'https://picsum.photos/seed/tigre/400/600',
    bio: 'O rei da diversão e das histórias engraçadas de Angola.',
    rating: 4.85,
    deliveryTimeDays: 1
  },
  {
    id: '7',
    name: 'Pérola',
    email: 'perola@example.com',
    category: 'Música',
    priceKz: 150000,
    imageUrl: 'https://picsum.photos/seed/perola/400/600',
    bio: 'Diva da música angolana com uma voz inconfundível.',
    rating: 4.95,
    deliveryTimeDays: 3
  }
];

export const REVIEWS = [
  { id: 1, name: 'Sofia', star: 5, context: 'Aniversário de Joe', text: 'Não podemos agradecer o suficiente! O vídeo foi incrível e o artista foi super simpático.' },
  { id: 2, name: 'João', star: 5, context: 'Conselho do Alex', text: 'Surpreendi a minha melhor amiga com um discurso motivacional. Valeu cada kumbu!' },
  { id: 3, name: 'Eileen', star: 4, context: 'Piada do Max', text: 'Ele assistiu várias vezes, compartilhou com todos. Muito obrigada por alegrar o dia!' }
];

export const CATEGORY_AVATARS = [
  { label: 'Atores', img: 'https://picsum.photos/seed/actors/100/100' },
  { label: 'Cantores', img: 'https://picsum.photos/seed/singers/100/100' },
  { label: 'Atletas', img: 'https://picsum.photos/seed/sports/100/100' },
  { label: 'Humor', img: 'https://picsum.photos/seed/comedy/100/100' },
  { label: 'TikTok', img: 'https://picsum.photos/seed/social/100/100' },
  { label: 'TV', img: 'https://picsum.photos/seed/tv/100/100' }
];

export const BANK_DETAILS = {
  bank: 'BFA (Banco de Fomento Angola)',
  accountName: 'KASSUMUNA DIGITAL LDA',
  iban: 'AO06 0006 0000 1234 5678 9012 3',
  expressReference: '2024-004-99'
};

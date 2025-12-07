import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { loadWithFallback, saveValue } from '@/lib/storageHelpers';

export type Post = {
  id: string;
  title: string;
  priceXAF: number;
  caption: string;
  photos: string[];
  dealLinkEnabled: boolean;
  visibility: 'PRIVATE' | 'PUBLIC';
  seller: {
    id: string;
    name: string;
    verified?: boolean;
    city?: string;
  };
  category?: string;
  createdAt: string;
  updatedAt: string;
  aiHistory: string[];
};

type PostStoreContext = {
  posts: Post[];
  addPost: (post: Omit<Post, 'id' | 'createdAt' | 'updatedAt' | 'aiHistory'>) => Post;
  updatePost: (id: string, updates: Partial<Post>) => void;
  deletePost: (id: string) => void;
  getPost: (id: string) => Post | undefined;
  savedListings: string[];
  toggleSaved: (id: string) => void;
};

const PostStoreContext = createContext<PostStoreContext | null>(null);

const STORAGE_KEY = 'prolist_posts';

const SEED_POSTS: Post[] = [
  {
    id: 'p1',
    title: 'Premium Wireless Earbuds',
    priceXAF: 25000,
    caption: '🎧 Crystal clear sound quality! Limited stock available. DM for orders.',
    photos: ['/demo/download-2.jfif'],
    dealLinkEnabled: true,
    visibility: 'PUBLIC',
    seller: { id: 'seller1', name: 'TechHub CM', verified: true, city: 'Douala' },
    category: 'Electronics',
    createdAt: new Date(Date.now() - 86400000 * 2).toISOString(),
    updatedAt: new Date(Date.now() - 86400000 * 2).toISOString(),
    aiHistory: [],
  },
  {
    id: 'p2',
    title: 'Professional Hair Clippers',
    priceXAF: 18000,
    caption: 'Barber quality at home! 💈 Get yours today.',
    photos: ['/demo/download-3.jfif'],
    dealLinkEnabled: false,
    visibility: 'PUBLIC',
    seller: { id: 'seller2', name: 'BeautyPlus', verified: false, city: 'Yaoundé' },
    category: 'Beauty',
    createdAt: new Date(Date.now() - 86400000 * 5).toISOString(),
    updatedAt: new Date(Date.now() - 86400000 * 5).toISOString(),
    aiHistory: [],
  },
  {
    id: 'p3',
    title: 'Smart TV 32 Inch',
    priceXAF: 85000,
    caption: '📺 HD Smart TV, Netflix ready. Order now!',
    photos: ['/demo/td-systems-32in-smart-tv.jfif'],
    dealLinkEnabled: true,
    visibility: 'PUBLIC',
    seller: { id: 'seller3', name: 'Electronics Store', verified: true, city: 'Douala' },
    category: 'Electronics',
    createdAt: new Date(Date.now() - 86400000 * 1).toISOString(),
    updatedAt: new Date(Date.now() - 86400000 * 1).toISOString(),
    aiHistory: [],
  },
  {
    id: 'p4',
    title: 'Cordless Steam Iron',
    priceXAF: 15000,
    caption: 'Makes ironing easy and fast ⚡',
    photos: ['/demo/cordless-steam-iron.jfif'],
    dealLinkEnabled: false,
    visibility: 'PUBLIC',
    seller: { id: 'seller4', name: 'HomeGoods', verified: false, city: 'Yaoundé' },
    category: 'Home Appliances',
    createdAt: new Date(Date.now() - 86400000 * 3).toISOString(),
    updatedAt: new Date(Date.now() - 86400000 * 3).toISOString(),
    aiHistory: [],
  },
  {
    id: 'p5',
    title: 'Podcast Microphone Kit',
    priceXAF: 45000,
    caption: '🎙️ Professional sound for content creators',
    photos: ['/demo/maono-podcast-mic.jfif'],
    dealLinkEnabled: true,
    visibility: 'PUBLIC',
    seller: { id: 'seller5', name: 'Audio Pro', verified: true, city: 'Douala' },
    category: 'Electronics',
    createdAt: new Date(Date.now() - 86400000 * 4).toISOString(),
    updatedAt: new Date(Date.now() - 86400000 * 4).toISOString(),
    aiHistory: [],
  },
  {
    id: 'p6',
    title: 'LA Girl Pro Concealer',
    priceXAF: 3500,
    caption: 'Perfect coverage 💄 Multiple shades available',
    photos: ['/demo/la-girl-pro-conceal.jfif'],
    dealLinkEnabled: false,
    visibility: 'PUBLIC',
    seller: { id: 'seller2', name: 'BeautyPlus', verified: false, city: 'Yaoundé' },
    category: 'Beauty',
    createdAt: new Date(Date.now() - 86400000 * 6).toISOString(),
    updatedAt: new Date(Date.now() - 86400000 * 6).toISOString(),
    aiHistory: [],
  },
  {
    id: 'p7',
    title: 'Double Door Fridge',
    priceXAF: 195000,
    caption: '❄️ Large capacity, energy efficient',
    photos: ['/demo/scanfrost-double-door-fridge.jfif'],
    dealLinkEnabled: true,
    visibility: 'PUBLIC',
    seller: { id: 'seller3', name: 'Electronics Store', verified: true, city: 'Douala' },
    category: 'Home Appliances',
    createdAt: new Date(Date.now() - 86400000 * 7).toISOString(),
    updatedAt: new Date(Date.now() - 86400000 * 7).toISOString(),
    aiHistory: [],
  },
  {
    id: 'p8',
    title: 'Stand Mixer',
    priceXAF: 38000,
    caption: 'Perfect for baking! 🍰 5 speed settings',
    photos: ['/demo/silver-crest-stand-mixer.jfif'],
    dealLinkEnabled: false,
    visibility: 'PUBLIC',
    seller: { id: 'seller4', name: 'HomeGoods', verified: false, city: 'Yaoundé' },
    category: 'Home Appliances',
    createdAt: new Date(Date.now() - 86400000 * 8).toISOString(),
    updatedAt: new Date(Date.now() - 86400000 * 8).toISOString(),
    aiHistory: [],
  },
  {
    id: 'p9',
    title: 'Steam Press Center',
    priceXAF: 55000,
    caption: 'Professional garment care at home 👔',
    photos: ['/demo/steam-press-center.jfif'],
    dealLinkEnabled: true,
    visibility: 'PUBLIC',
    seller: { id: 'seller6', name: 'LaundryPro', verified: true, city: 'Douala' },
    category: 'Home Appliances',
    createdAt: new Date(Date.now() - 86400000 * 9).toISOString(),
    updatedAt: new Date(Date.now() - 86400000 * 9).toISOString(),
    aiHistory: [],
  },
  {
    id: 'p10',
    title: 'Wireless Lavalier Microphone',
    priceXAF: 22000,
    caption: '🎤 Perfect for interviews & vlogs',
    photos: ['/demo/wireless-lavalier-kit.jfif'],
    dealLinkEnabled: true,
    visibility: 'PUBLIC',
    seller: { id: 'seller5', name: 'Audio Pro', verified: true, city: 'Douala' },
    category: 'Electronics',
    createdAt: new Date(Date.now() - 86400000 * 10).toISOString(),
    updatedAt: new Date(Date.now() - 86400000 * 10).toISOString(),
    aiHistory: [],
  },
  {
    id: 'p11',
    title: 'Blue Air Force Shoes',
    priceXAF: 12000,
    caption: '👟 Fresh kicks! All sizes available',
    photos: ['/demo/blue-airforce-shoes.jfif'],
    dealLinkEnabled: false,
    visibility: 'PUBLIC',
    seller: { id: 'seller7', name: 'SneakerHub', verified: false, city: 'Yaoundé' },
    category: 'Fashion',
    createdAt: new Date(Date.now() - 86400000 * 11).toISOString(),
    updatedAt: new Date(Date.now() - 86400000 * 11).toISOString(),
    aiHistory: [],
  },
];

export const PostStoreProvider = ({ children }: { children: ReactNode }) => {
  const [posts, setPosts] = useState<Post[]>(() => {
    const { data, seeded } = loadWithFallback<Post[]>(STORAGE_KEY, SEED_POSTS);
    if (seeded) return SEED_POSTS;

    return (data ?? []).map(post => ({
      ...post,
      dealLinkEnabled: post.dealLinkEnabled ?? false,
      visibility: post.visibility ?? 'PRIVATE',
      seller: post.seller ?? { id: 'unknown', name: 'Unknown Seller' },
    }));
  });

  const [savedListings, setSavedListings] = useState<string[]>(() => {
    const { data } = loadWithFallback<string[]>('prolist_saved_listings', []);
    return data ?? [];
  });

  useEffect(() => {
    saveValue(STORAGE_KEY, posts);
  }, [posts]);

  useEffect(() => {
    saveValue('prolist_saved_listings', savedListings);
  }, [savedListings]);

  const toggleSaved = (id: string) => {
    setSavedListings(prev =>
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const addPost = (postData: Omit<Post, 'id' | 'createdAt' | 'updatedAt' | 'aiHistory'>): Post => {
    const newPost: Post = {
      ...postData,
      id: `p${Date.now()}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      aiHistory: [],
    };
    setPosts(prev => [newPost, ...prev]);
    return newPost;
  };

  const updatePost = (id: string, updates: Partial<Post>) => {
    setPosts(prev =>
      prev.map(p =>
        p.id === id
          ? { ...p, ...updates, updatedAt: new Date().toISOString() }
          : p
      )
    );
  };

  const deletePost = (id: string) => {
    setPosts(prev => prev.filter(p => p.id !== id));
  };

  const getPost = (id: string) => {
    return posts.find(p => p.id === id);
  };

  return (
    <PostStoreContext.Provider value={{ posts, addPost, updatePost, deletePost, getPost, savedListings, toggleSaved }}>
      {children}
    </PostStoreContext.Provider>
  );
};

export const usePostStore = () => {
  const context = useContext(PostStoreContext);
  if (!context) throw new Error('usePostStore must be used within PostStoreProvider');
  return context;
};

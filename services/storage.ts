
import { Order, Artist, User, UserRole } from '../types';
import { ARTISTS as MOCK_ARTISTS } from '../constants';
import { db, auth, googleProvider, signInWithPopup, signOut, storage } from '../firebase';
import { 
  collection, 
  doc, 
  setDoc, 
  getDoc, 
  getDocs, 
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  orderBy,
  onSnapshot
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL, uploadBytesResumable } from 'firebase/storage';

enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId: string | undefined;
    email: string | null | undefined;
    emailVerified: boolean | undefined;
    isAnonymous: boolean | undefined;
    tenantId: string | null | undefined;
    providerInfo: {
      providerId: string;
      displayName: string | null;
      email: string | null;
      photoUrl: string | null;
    }[];
  }
}

function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData.map(provider => ({
        providerId: provider.providerId,
        displayName: provider.displayName,
        email: provider.email,
        photoUrl: provider.photoURL
      })) || []
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

export const StorageService = {
  // Artists
  getArtists: async (): Promise<Artist[]> => {
    const path = 'artists';
    try {
      const snapshot = await getDocs(collection(db, path));
      if (snapshot.empty) {
        // Seed database if empty
        for (const artist of MOCK_ARTISTS) {
          await setDoc(doc(db, path, artist.id), artist);
        }
        return MOCK_ARTISTS;
      }
      return snapshot.docs.map(doc => doc.data() as Artist);
    } catch (error) {
      handleFirestoreError(error, OperationType.LIST, path);
      return [];
    }
  },

  subscribeToArtists: (callback: (artists: Artist[]) => void) => {
    const path = 'artists';
    return onSnapshot(collection(db, path), (snapshot) => {
      callback(snapshot.docs.map(doc => doc.data() as Artist));
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, path);
    });
  },

  // Orders
  getOrders: async (userId?: string, artistId?: string, status?: Order['status']): Promise<Order[]> => {
    const path = 'orders';
    try {
      let q = query(collection(db, path), orderBy('createdAt', 'desc'));
      if (userId) {
        q = query(collection(db, path), where('userId', '==', userId), orderBy('createdAt', 'desc'));
      } else if (artistId) {
        if (status) {
          q = query(collection(db, path), where('artistId', '==', artistId), where('status', '==', status), orderBy('createdAt', 'desc'));
        } else {
          q = query(collection(db, path), where('artistId', '==', artistId), orderBy('createdAt', 'desc'));
        }
      }
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => doc.data() as Order);
    } catch (error) {
      handleFirestoreError(error, OperationType.LIST, path);
      return [];
    }
  },

  subscribeToOrders: (callback: (orders: Order[]) => void, userId?: string, artistId?: string, status?: Order['status']) => {
    const path = 'orders';
    let q = query(collection(db, path), orderBy('createdAt', 'desc'));
    if (userId) {
      q = query(collection(db, path), where('userId', '==', userId), orderBy('createdAt', 'desc'));
    } else if (artistId) {
      if (status) {
        q = query(collection(db, path), where('artistId', '==', artistId), where('status', '==', status), orderBy('createdAt', 'desc'));
      } else {
        q = query(collection(db, path), where('artistId', '==', artistId), orderBy('createdAt', 'desc'));
      }
    }
    return onSnapshot(q, (snapshot) => {
      callback(snapshot.docs.map(doc => doc.data() as Order));
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, path);
    });
  },

  saveOrder: async (order: Order): Promise<void> => {
    const path = 'orders';
    try {
      const userId = auth.currentUser?.uid;
      const orderWithUser = { ...order, userId };
      await setDoc(doc(db, path, order.id), orderWithUser);
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, path);
    }
  },

  updateOrderStatus: async (orderId: string, status: Order['status']): Promise<void> => {
    const path = 'orders';
    try {
      await updateDoc(doc(db, path, orderId), { status });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, path);
    }
  },

  updateOrderVideo: async (orderId: string, videoUrl: string): Promise<void> => {
    const path = 'orders';
    try {
      await updateDoc(doc(db, path, orderId), { 
        videoUrl,
        status: 'Concluido'
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, path);
    }
  },

  uploadVideo: (
    orderId: string, 
    file: File, 
    onProgress?: (progress: number) => void
  ): Promise<string> => {
    return new Promise((resolve, reject) => {
      try {
        const storageRef = ref(storage, `orders/${orderId}/video_${Date.now()}`);
        console.log('Starting video upload for order:', orderId, 'File size:', file.size);
        
        const uploadTask = uploadBytesResumable(storageRef, file);

        uploadTask.on('state_changed', 
          (snapshot) => {
            const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
            console.log(`Upload progress: ${progress.toFixed(2)}%`);
            if (onProgress) onProgress(progress);
          }, 
          (error) => {
            console.error('Error uploading video:', error);
            if (error.code === 'storage/unauthorized') {
              reject(new Error('Sem permissão para carregar o vídeo. Verifique as regras de segurança do novo bucket.'));
            } else {
              reject(error);
            }
          }, 
          async () => {
            console.log('Upload complete, getting download URL...');
            const downloadUrl = await getDownloadURL(uploadTask.snapshot.ref);
            console.log('Download URL obtained:', downloadUrl);
            resolve(downloadUrl);
          }
        );
      } catch (error) {
        console.error('Error initializing video upload:', error);
        reject(error);
      }
    });
  },

  uploadProof: (orderId: string, file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      try {
        const storageRef = ref(storage, `orders/${orderId}/proof_${Date.now()}`);
        const uploadTask = uploadBytesResumable(storageRef, file);
        
        uploadTask.on('state_changed', 
          null,
          (error) => {
            console.error('Proof upload error:', error);
            reject(error);
          },
          async () => {
            const downloadUrl = await getDownloadURL(uploadTask.snapshot.ref);
            resolve(downloadUrl);
          }
        );
      } catch (error) {
        reject(error);
      }
    });
  },

  deleteOrder: async (orderId: string): Promise<void> => {
    const path = 'orders';
    try {
      await deleteDoc(doc(db, path, orderId));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, path);
    }
  },

  saveArtist: async (artist: Artist): Promise<void> => {
    const path = 'artists';
    try {
      await setDoc(doc(db, path, artist.id), artist);
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, path);
    }
  },

  deleteArtist: async (artistId: string): Promise<void> => {
    const path = 'artists';
    try {
      await deleteDoc(doc(db, path, artistId));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, path);
    }
  },

  saveUser: async (user: User): Promise<void> => {
    const path = 'users';
    try {
      await setDoc(doc(db, path, user.id), user);
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, path);
    }
  },

  // Auth Methods
  updateUserRole: async (userId: string, role: UserRole): Promise<void> => {
    const path = 'users';
    try {
      const userRef = doc(db, path, userId);
      const userDoc = await getDoc(userRef);
      if (userDoc.exists()) {
        await updateDoc(userRef, { role });
      } else {
        console.warn('Attempted to update role for non-existent user doc');
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, path);
    }
  },

  getUserDoc: async (userId: string): Promise<User | null> => {
    const path = 'users';
    try {
      const userDoc = await getDoc(doc(db, path, userId));
      return userDoc.exists() ? (userDoc.data() as User) : null;
    } catch (error) {
      handleFirestoreError(error, OperationType.GET, path);
      return null;
    }
  },

  getCurrentUser: (): User | null => {
    if (!auth.currentUser) return null;
    return {
      id: auth.currentUser.uid,
      name: auth.currentUser.displayName || 'Usuário',
      email: auth.currentUser.email || '',
      role: 'client' // Default role, will be updated from Firestore
    };
  },

  login: async (): Promise<User | null> => {
    const path = 'users';
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;
      
      // Check if user already exists in Firestore to preserve role
      try {
        const userDoc = await getDoc(doc(db, path, user.uid));
        let userData: User;

        if (userDoc.exists()) {
          userData = userDoc.data() as User;
          // If it's the bootstrapped admin but role is not admin, update it
          if (userData.email === 'upgradeangola@gmail.com' && userData.role !== 'admin') {
            userData.role = 'admin';
            await updateDoc(doc(db, path, user.uid), { role: 'admin' });
          }
        } else {
          // Check if this email belongs to an Artist profile
          const artistQuery = query(collection(db, 'artists'), where('email', '==', user.email));
          const artistDocs = await getDocs(artistQuery);
          const isArtist = !artistDocs.empty;
          const artistId = isArtist ? artistDocs.docs[0].id : null;

          userData = {
            id: user.uid,
            name: user.displayName || 'Usuário',
            email: user.email || '',
            role: user.email === 'upgradeangola@gmail.com' ? 'admin' : (isArtist ? 'artist' : 'client')
          };

          if (artistId) {
            userData.artistId = artistId;
          }

          await setDoc(doc(db, path, user.uid), userData);
        }
        
        return userData;
      } catch (firestoreError) {
        handleFirestoreError(firestoreError, OperationType.WRITE, path);
        return null;
      }
    } catch (authError: any) {
      // Don't use handleFirestoreError for Auth errors
      console.error('Auth Error during login:', authError);
      throw authError; // Re-throw so LoginPage can handle it
    }
  },

  logout: async (): Promise<void> => {
    await signOut(auth);
  }
};

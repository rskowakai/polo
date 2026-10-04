import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  auth,
  db,
  googleProvider,
  signInWithPopup,
  firebaseSignOut,
  onAuthStateChanged,
  doc,
  setDoc,
  getDocs,
  collection,
  query,
  where,
  type User,
  handleFirestoreError,
  OperationType,
} from '@/lib/firebase';
import { useToast } from '@/hooks/use-toast';

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  photoURL: string;
  role: 'admin' | 'operator' | 'guest';
}

interface AuthContextType {
  currentUser: User | null;
  userProfile: UserProfile | null;
  loading: boolean;
  signInWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
  switchRoleForDemo: (role: 'admin' | 'operator' | 'guest') => void;
}

const AuthContext = createContext<AuthContextType>({
  currentUser: null,
  userProfile: null,
  loading: true,
  signInWithGoogle: async () => {},
  logout: async () => {},
  switchRoleForDemo: () => {},
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      if (user) {
        // Bootstrapped Admin: rskowak@gmail.com
        const isAdminEmail = user.email === 'rskowak@gmail.com';
        const profile: UserProfile = {
          uid: user.uid,
          email: user.email || '',
          displayName: user.displayName || user.email?.split('@')[0] || 'Użytkownik',
          photoURL: user.photoURL || '',
          role: isAdminEmail ? 'admin' : 'operator',
        };
        setUserProfile(profile);

        // Sync user profile to Firestore
        try {
          await setDoc(
            doc(db, 'users', user.uid),
            {
              ...profile,
              updatedAt: new Date().toISOString(),
            },
            { merge: true }
          );
        } catch (err) {
          console.warn('Could not sync user to Firestore:', err);
        }
      } else {
        setUserProfile({
          uid: 'guest',
          email: 'gosc@smartgrid.pl',
          displayName: 'Gość (Tylko odczyt)',
          photoURL: '',
          role: 'guest',
        });
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const signInWithGoogle = async () => {
    try {
      const result = await signInWithPopup(auth, googleProvider);
      toast({
        title: 'Zalogowano pomyślnie',
        description: `Witaj, ${result.user.displayName || result.user.email}!`,
      });
    } catch (error: any) {
      console.error('Google Sign-In Error:', error);
      toast({
        title: 'Błąd logowania',
        description: error.message || 'Nie udało się zalogować przez Google.',
        variant: 'destructive',
      });
    }
  };

  const logout = async () => {
    try {
      await firebaseSignOut(auth);
      toast({
        title: 'Wylogowano',
        description: 'Zostałeś przełączony w tryb Gościa.',
      });
    } catch (error: any) {
      console.error('Logout error:', error);
    }
  };

  const switchRoleForDemo = (role: 'admin' | 'operator' | 'guest') => {
    if (userProfile) {
      setUserProfile({ ...userProfile, role });
      toast({
        title: 'Zmieniono rolę roboczą',
        description: `Aktywna rola: ${role.toUpperCase()}`,
      });
    }
  };

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        userProfile,
        loading,
        signInWithGoogle,
        logout,
        switchRoleForDemo,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);

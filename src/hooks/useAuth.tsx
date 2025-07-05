import { useState, useEffect, useContext, createContext, ReactNode } from 'react';
import { onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';
import { auth } from '../config/firebase';
import { authService } from '../services/authService';
import { User, AuthState } from '../types/auth';

interface AuthContextType extends AuthState {
  signUp: (data: any) => Promise<void>;
  signIn: (data: any) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
  sendPasswordReset: (email: string) => Promise<void>;
  updateProfile: (data: any) => Promise<void>;
  changePassword: (data: any) => Promise<void>;
  uploadProfilePicture: (file: File) => Promise<string>;
  deleteAccount: () => Promise<void>;
  resendEmailVerification: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [state, setState] = useState<AuthState>({
    user: null,
    loading: true,
    error: null
  });

  useEffect(() => {
    console.log('Setting up auth state listener...');
    
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser: FirebaseUser | null) => {
      console.log('Auth state changed:', firebaseUser ? 'User logged in' : 'User logged out');
      
      try {
        if (firebaseUser) {
          console.log('Firebase user detected, fetching user data...');
          
          // Refresh the token to ensure it's valid
          await firebaseUser.getIdToken(true);
          
          try {
            const userData = await authService.getUserData(firebaseUser.uid);
            console.log('User data fetched successfully:', userData.email);
            
            setState({
              user: {
                ...userData,
                emailVerified: firebaseUser.emailVerified // Use Firebase auth state for email verification
              },
              loading: false,
              error: null
            });
          } catch (error: any) {
            // If user data not found, create a new user document
            if (error.message === 'User data not found') {
              console.log('User document not found, creating new user document...');
              
              // Generate a unique username from email
              const username = firebaseUser.email?.split('@')[0] || `user_${firebaseUser.uid.slice(0, 8)}`;
              
              const newUserData = {
                email: firebaseUser.email || '',
                username: username,
                displayName: firebaseUser.displayName || username,
                photoURL: firebaseUser.photoURL || null,
                emailVerified: firebaseUser.emailVerified,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
              };
              
              // Create the user document in Firestore
              await authService.createUserDocument(firebaseUser.uid, newUserData);
              console.log('New user document created successfully');
              
              // Fetch the newly created user data
              const userData = await authService.getUserData(firebaseUser.uid);
              console.log('Newly created user data fetched:', userData.email);
              
              setState({
                user: {
                  ...userData,
                  emailVerified: firebaseUser.emailVerified
                },
                loading: false,
                error: null
              });
            } else {
              throw error; // Re-throw other errors
            }
          }
        } else {
          console.log('No user authenticated');
          setState({
            user: null,
            loading: false,
            error: null
          });
        }
      } catch (error: any) {
        console.error('Error in auth state listener:', error);
        setState({
          user: null,
          loading: false,
          error: error.message
        });
      }
    }, (error) => {
      console.error('Auth state listener error:', error);
      setState({
        user: null,
        loading: false,
        error: error.message
      });
    });

    return () => {
      console.log('Cleaning up auth state listener');
      unsubscribe();
    };
  }, []);

  const signUp = async (data: any) => {
    try {
      console.log('Starting sign up process...');
      setState(prev => ({ ...prev, loading: true, error: null }));
      await authService.signUp(data);
      console.log('Sign up successful');
      // User state will be updated by onAuthStateChanged
    } catch (error: any) {
      console.error('Sign up error:', error);
      setState(prev => ({ ...prev, loading: false, error: error.message }));
      throw error;
    }
  };

  const signIn = async (data: any) => {
    try {
      console.log('Starting sign in process...');
      setState(prev => ({ ...prev, loading: true, error: null }));
      await authService.signIn(data);
      console.log('Sign in successful');
      // User state will be updated by onAuthStateChanged
    } catch (error: any) {
      console.error('Sign in error:', error);
      setState(prev => ({ ...prev, loading: false, error: error.message }));
      throw error;
    }
  };

  const signInWithGoogle = async () => {
    try {
      console.log('Starting Google sign in...');
      setState(prev => ({ ...prev, loading: true, error: null }));
      await authService.signInWithGoogle();
      console.log('Google sign in successful');
      // User state will be updated by onAuthStateChanged
    } catch (error: any) {
      console.error('Google sign in error:', error);
      setState(prev => ({ ...prev, loading: false, error: error.message }));
      throw error;
    }
  };

  const signOut = async () => {
    try {
      console.log('Starting sign out...');
      setState(prev => ({ ...prev, loading: true, error: null }));
      await authService.signOut();
      console.log('Sign out successful');
      // User state will be updated by onAuthStateChanged
    } catch (error: any) {
      console.error('Sign out error:', error);
      setState(prev => ({ ...prev, loading: false, error: error.message }));
      throw error;
    }
  };

  const sendPasswordReset = async (email: string) => {
    try {
      setState(prev => ({ ...prev, error: null }));
      await authService.sendPasswordReset(email);
    } catch (error: any) {
      setState(prev => ({ ...prev, error: error.message }));
      throw error;
    }
  };

  const updateProfile = async (data: any) => {
    try {
      setState(prev => ({ ...prev, loading: true, error: null }));
      await authService.updateUserProfile(data);
      await refreshUser();
    } catch (error: any) {
      setState(prev => ({ ...prev, loading: false, error: error.message }));
      throw error;
    }
  };

  const changePassword = async (data: any) => {
    try {
      setState(prev => ({ ...prev, loading: true, error: null }));
      await authService.changePassword(data);
      setState(prev => ({ ...prev, loading: false }));
    } catch (error: any) {
      setState(prev => ({ ...prev, loading: false, error: error.message }));
      throw error;
    }
  };

  const uploadProfilePicture = async (file: File) => {
    try {
      setState(prev => ({ ...prev, loading: true, error: null }));
      const photoURL = await authService.uploadProfilePicture(file);
      await refreshUser();
      return photoURL;
    } catch (error: any) {
      setState(prev => ({ ...prev, loading: false, error: error.message }));
      throw error;
    }
  };

  const deleteAccount = async () => {
    try {
      setState(prev => ({ ...prev, loading: true, error: null }));
      await authService.deleteAccount();
      // User state will be updated by onAuthStateChanged
    } catch (error: any) {
      setState(prev => ({ ...prev, loading: false, error: error.message }));
      throw error;
    }
  };

  const resendEmailVerification = async () => {
    try {
      setState(prev => ({ ...prev, error: null }));
      await authService.resendEmailVerification();
    } catch (error: any) {
      setState(prev => ({ ...prev, error: error.message }));
      throw error;
    }
  };

  const refreshUser = async () => {
    try {
      if (auth.currentUser) {
        // Refresh the Firebase user first
        await auth.currentUser.reload();
        const userData = await authService.getUserData(auth.currentUser.uid);
        setState(prev => ({ 
          ...prev, 
          user: {
            ...userData,
            emailVerified: auth.currentUser!.emailVerified
          }, 
          loading: false 
        }));
      }
    } catch (error: any) {
      setState(prev => ({ ...prev, error: error.message, loading: false }));
    }
  };

  const contextValue: AuthContextType = {
    ...state,
    signUp,
    signIn,
    signInWithGoogle,
    signOut,
    sendPasswordReset,
    updateProfile,
    changePassword,
    uploadProfilePicture,
    deleteAccount,
    resendEmailVerification,
    refreshUser
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};
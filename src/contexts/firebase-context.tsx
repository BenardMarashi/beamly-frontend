import React from 'react';
    import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
    import { useAuthState } from 'react-firebase-hooks/auth';
    import { auth } from '../lib/firebase';
    
    // Create a client
    const queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          refetchOnWindowFocus: false,
          retry: false,
          staleTime: 5 * 60 * 1000, // 5 minutes
        },
      },
    });
    
    interface FirebaseContextType {
      user: any;
      loading: boolean;
      error: Error | undefined;
    }
    
    const FirebaseContext = React.createContext<FirebaseContextType>({
      user: null,
      loading: true,
      error: undefined,
    });
    
    export const useFirebase = () => React.useContext(FirebaseContext);
    
    interface FirebaseProviderProps {
      children: React.ReactNode;
    }
    
    export const FirebaseProvider: React.FC<FirebaseProviderProps> = ({ children }) => {
      // Add error handling for useAuthState
      let user = null;
      let loading = false;
      let error = undefined;
      
      try {
        // Only use auth hooks if auth is available
        if (auth) {
          const authState = useAuthState(auth, {
            onUserChanged: (user) => {
              if (user) {
                console.log("User authenticated:", user.uid);
              } else {
                console.log("No user authenticated");
              }
            },
          });
          [user, loading, error] = authState;
        } else {
          console.log("Auth not available, running in demo mode");
        }
      } catch (e) {
        console.error("Error initializing auth state:", e);
        error = e as Error;
      }
      
      // Log any auth errors
      React.useEffect(() => {
        if (error) {
          console.error("Firebase auth error:", error);
        }
      }, [error]);
      
      const value = React.useMemo(() => ({
        user,
        loading,
        error,
      }), [user, loading, error]);
      
      return (
        <QueryClientProvider client={queryClient}>
          <FirebaseContext.Provider value={value}>
            {children}
          </FirebaseContext.Provider>
        </QueryClientProvider>
      );
    };
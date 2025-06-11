import React from 'react';
    import { QueryClient, QueryClientProvider } from 'react-query';
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
      const [user, loading, error] = useAuthState(auth, {
        onUserChanged: (user) => {
          if (user) {
            console.log("User authenticated:", user.uid);
          } else {
            console.log("No user authenticated");
          }
        },
      });
      
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
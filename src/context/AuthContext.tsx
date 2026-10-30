import {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from "react";
import { User } from "@supabase/supabase-js";
import { supabase } from "../lib/supabase";

type AuthContextType = {
  user: User | null;
  loading: boolean;

  signIn: (
    email:string,
    password:string
   )=>Promise<any>;

  signUp: (
    email: string,
    password: string
  ) => Promise<void>;

  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadSession() {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      setUser(session?.user ?? null);

      setLoading(false);
    }

    loadSession();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  async function signIn(
    email:string,
    password:string
   ){
   
    const {data,error}=await supabase.auth.signInWithPassword({
      email,
      password
    });
   
    if(error) throw error;
   
    return data;
   
   }

  async function signUp(
    email: string,
    password: string
  ) {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    });

    if (error) throw error;

    if (!data.user) return;

    const { error: profileError } = await supabase
    .from("profiles")
    .insert({
        id: data.user.id,
        name: email.split("@")[0],
        username: email.split("@")[0],
        avatar: "",
        bio: "",
        followers: 0,
        following: 0,
    });

    if (profileError) throw profileError;
  }

  async function logout() {
    const { error } = await supabase.auth.signOut();

    if (error) throw error;
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        signIn,
        signUp,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used inside AuthProvider");
  }

  return context;
}
import { createContext, useContext, useState } from "react";

export interface User {
  name: string;
  email: string;
  avatar: string;
}

interface AuthCtx {
  user: User | null;
  signIn: (user: User) => void;
  signOut: () => void;
}

const AuthContext = createContext<AuthCtx>({ user: null, signIn: () => {}, signOut: () => {} });

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(() => {
    const raw = localStorage.getItem("debate_user");
    return raw ? (JSON.parse(raw) as User) : null;
  });

  const signIn = (u: User) => {
    setUser(u);
    localStorage.setItem("debate_user", JSON.stringify(u));
  };

  const signOut = () => {
    setUser(null);
    localStorage.removeItem("debate_user");
  };

  return <AuthContext.Provider value={{ user, signIn, signOut }}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}

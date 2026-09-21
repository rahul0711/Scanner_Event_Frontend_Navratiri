import { User } from '@/lib/types';
import { create } from 'zustand';



interface AuthState {
  user: User | null;
  companies: User[];
  isAuthenticated: boolean;
  setUser: (user: User | null) => void;
  setCompanies: (companies: User[]) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  companies: [],
  isAuthenticated: false,
  setUser: (user) => set({ user, isAuthenticated: !!user }),
  setCompanies: (companies) => set({ companies }),
  logout: () => set({ user: null, isAuthenticated: false }),
}));

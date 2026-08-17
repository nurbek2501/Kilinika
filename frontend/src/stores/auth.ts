import { create } from 'zustand';
import api from '@/lib/api';
import { tokenStore } from '@/lib/token';
import { User } from '@/types';

interface AuthState {
  user: User | null;
  isLoading: boolean;
  login: (phone: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  checkAuth: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isLoading: true,

  login: async (phone: string, password: string) => {
    const { data } = await api.post('/auth/login', { phone, password });
    if (data.success) {
      tokenStore.set(data.data.accessToken);
      set({ user: data.data.user, isLoading: false });
    } else {
      throw new Error(data.message);
    }
  },

  logout: async () => {
    try {
      await api.post('/auth/logout');
    } finally {
      tokenStore.remove();
      set({ user: null, isLoading: false });
    }
  },

  checkAuth: async () => {
    try {
      const token = tokenStore.get();
      if (!token) {
        set({ user: null, isLoading: false });
        return;
      }
      const { data } = await api.get('/auth/me');
      if (data.success) {
        set({ user: data.data, isLoading: false });
      } else {
        set({ user: null, isLoading: false });
      }
    } catch {
      tokenStore.remove();
      set({ user: null, isLoading: false });
    }
  },
}));

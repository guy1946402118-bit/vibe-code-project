import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { authApi, api, userApi, type User } from '../lib/api';

interface UserState {
  currentUser: User | null;
  isAdmin: boolean;
  isLoading: boolean;
  heartbeatTimer: number | null;
  refreshUser: () => Promise<void>;
  init: () => Promise<void>;
  adminLogin: (username: string, password: string) => Promise<void>;
  userLogin: (name: string, password?: string) => Promise<void>;
  userRegister: (name: string, password?: string, email?: string, phone?: string) => Promise<void>;
  logout: () => void;
  updateUser: (id: string, data: Partial<User>) => void;
  startHeartbeat: () => void;
  stopHeartbeat: () => void;
}

const startHeartbeatTimer = (refreshUser: () => Promise<void>) => {
  return window.setInterval(async () => {
    try {
      await userApi.heartbeat();
      await refreshUser();
    } catch { /* ignore */ }
  }, 20000);
};

export const useUserStore = create<UserState>()(
  persist(
    (set, get) => ({
      currentUser: null,
      isAdmin: false,
      isLoading: true,
      heartbeatTimer: null,
      refreshUser: async () => {
        try {
          const { user, isAdmin } = await authApi.getMe();
          const isUserAdmin = isAdmin || user.role === 'ADMIN';
          set({ currentUser: user, isAdmin: isUserAdmin });
        } catch { /* ignore */ }
      },
      init: async () => {
        try {
          const token = api.getToken();
          if (token) {
            const { user, isAdmin } = await authApi.getMe();
            const isUserAdmin = isAdmin || user.role === 'ADMIN';
            set({ currentUser: user, isAdmin: isUserAdmin, isLoading: false });
            get().startHeartbeat();
            return;
          }
        } catch {
          api.setToken(null);
        }
        set({ isLoading: false });
      },
      startHeartbeat: () => {
        const state = get();
        if (state.heartbeatTimer) {
          clearInterval(state.heartbeatTimer);
        }
        const timer = startHeartbeatTimer(get().refreshUser);
        set({ heartbeatTimer: timer });
      },
      stopHeartbeat: () => {
        const state = get();
        if (state.heartbeatTimer) {
          clearInterval(state.heartbeatTimer);
          set({ heartbeatTimer: null });
        }
      },
      adminLogin: async (username: string, password: string) => {
        const { token, user } = await authApi.login(username, password);
        api.setToken(token);
        set({ currentUser: user, isAdmin: true });
        get().startHeartbeat();
      },
      userLogin: async (name: string, password?: string) => {
        const { token, user } = await authApi.loginUser(name, password);
        api.setToken(token);
        const isUserAdmin = user.role === 'ADMIN';
        set({ currentUser: user, isAdmin: isUserAdmin });
        get().startHeartbeat();
      },
      userRegister: async (name: string, password?: string, email?: string, phone?: string) => {
        const { token, user } = await authApi.registerUser(name, password, email, phone);
        api.setToken(token);
        const isUserAdmin = user.role === 'ADMIN';
        set({ currentUser: user, isAdmin: isUserAdmin });
        get().startHeartbeat();
      },
      logout: () => {
        get().stopHeartbeat();
        api.setToken(null);
        const keysToRemove: string[] = [];
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (key && (key.startsWith('growth-') || key.includes('user'))) {
            keysToRemove.push(key);
          }
        }
        keysToRemove.forEach(key => localStorage.removeItem(key));
        set({ currentUser: null, isAdmin: false, heartbeatTimer: null });
        window.location.href = '/blog';
      },
      updateUser: (id: string, data: Partial<User>) => {
        set((state) => ({
          currentUser: state.currentUser?.id === id ? { ...state.currentUser, ...data } : state.currentUser
        }));
      },
    }),
    { name: 'growth-user' }
  )
);

import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import type { User, Team } from '@/types';
import { login as loginApi, getCurrentUser as getCurrentUserApi, logout as logoutApi } from '@/services/auth.service';

interface AuthState {
  currentUser: User | null;
  currentTeam: Team | null;
  teams: Team[];
  token: string | null;
  loading: boolean;
  error: string | null;
  setCurrentUser: (user: User) => void;
  setCurrentTeam: (team: Team | null) => void;
  setTeams: (teams: Team[]) => void;
  // Async actions
  loginAsync: (username: string, password: string) => Promise<void>;
  logoutAsync: () => Promise<void>;
  fetchCurrentUserAsync: () => Promise<void>;
}

export const useAuthStore = create<AuthState>()(
  devtools(
    (set) => ({
      currentUser: null,
      currentTeam: null,
      teams: [],
      token: null,
      loading: false,
      error: null,
      setCurrentUser: (user) => set({ currentUser: user }),
      setCurrentTeam: (team) => set({ currentTeam: team }),
      setTeams: (teams) => set({ teams }),
      // Async actions
      loginAsync: async (username, password) => {
        set({ loading: true, error: null });
        try {
          const res = await loginApi({ username, password });
          const data = res.data;
          localStorage.setItem('token', data.token);
          localStorage.setItem('refreshToken', data.refreshToken);
          const user: User = {
            id: data.userId,
            username: data.username,
            realName: data.realName,
            email: '',
            avatar: data.avatar,
            status: 1,
            roles: data.roles,
          };
          set({ currentUser: user, token: data.token, loading: false });
        } catch (err: any) {
          set({ error: err?.message || 'Login failed', loading: false });
        }
      },
      logoutAsync: async () => {
        try {
          await logoutApi();
        } catch {
          // Ignore API errors during logout
        }
        localStorage.removeItem('token');
        localStorage.removeItem('refreshToken');
        set({
          currentUser: null,
          token: null,
          loading: false,
          error: null,
        });
      },
      fetchCurrentUserAsync: async () => {
        set({ loading: true, error: null });
        try {
          const res = await getCurrentUserApi();
          const user = res.data;
          set({ currentUser: user, loading: false });
        } catch (err: any) {
          set({ error: err?.message || 'Failed to fetch current user', loading: false });
        }
      },
    }),
    { name: 'auth' }
  )
);

import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import type { User, Team } from '@/types';

interface AuthState {
  currentUser: User | null;
  currentTeam: Team | null;
  teams: Team[];
  setCurrentUser: (user: User) => void;
  setCurrentTeam: (team: Team) => void;
  setTeams: (teams: Team[]) => void;
  switchTeam: (teamId: string) => void;
}

export const useAuthStore = create<AuthState>()(
  devtools(
    (set) => ({
      currentUser: null,
      currentTeam: null,
      teams: [],
      setCurrentUser: (user) => set({ currentUser: user }),
      setCurrentTeam: (team) => set({ currentTeam: team }),
      setTeams: (teams) => set({ teams }),
      switchTeam: (teamId) =>
        set((state) => {
          const team = state.teams.find((t) => t.id === teamId);
          return team ? { currentTeam: team } : {};
        }),
    }),
    { name: 'auth' }
  )
);

import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import type { Department, Role, User } from '@/types';

interface ConfigState {
  departments: Department[];
  roles: Role[];
  members: User[];
  selectedDepartmentId: string | null;
  selectedRoleId: string | null;
  loading: boolean;
  setDepartments: (departments: Department[]) => void;
  setRoles: (roles: Role[]) => void;
  setMembers: (members: User[]) => void;
  selectDepartment: (id: string) => void;
  selectRole: (id: string | null) => void;
  setLoading: (loading: boolean) => void;
}

export const useConfigStore = create<ConfigState>()(
  devtools(
    (set) => ({
      departments: [],
      roles: [],
      members: [],
      selectedDepartmentId: null,
      selectedRoleId: null,
      loading: false,
      setDepartments: (departments) => set({ departments }),
      setRoles: (roles) => set({ roles }),
      setMembers: (members) => set({ members }),
      selectDepartment: (id) => set({ selectedDepartmentId: id, selectedRoleId: null }),
      selectRole: (id) => set({ selectedRoleId: id }),
      setLoading: (loading) => set({ loading }),
    }),
    { name: 'config' }
  )
);

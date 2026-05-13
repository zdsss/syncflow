import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { getBomsByProject, getBomStructure, submitForApproval, withdrawBomApproval } from '@/services/bom.service';
import type { BomVO, BomItemVO } from '@/services/bom.service';

interface BomState {
  boms: BomVO[];
  currentBom: BomVO | null;
  bomTree: BomItemVO[];
  loading: boolean;
  error: string | null;

  fetchBoms: (projectId: number | string) => Promise<void>;
  fetchBomStructure: (bomId: number | string) => Promise<void>;
  setCurrentBom: (bom: BomVO | null) => void;
  submitApproval: (bomId: number | string) => Promise<void>;
  withdrawApproval: (bomId: number | string) => Promise<void>;
  invalidate: () => void;
}

export const useBomStore = create<BomState>()(
  devtools(
    (set, get) => ({
      boms: [],
      currentBom: null,
      bomTree: [],
      loading: false,
      error: null,

      fetchBoms: async (projectId) => {
        set({ loading: true, error: null });
        try {
          const res = await getBomsByProject(projectId);
          const data = res?.data || [];
          set({ boms: data, loading: false });
        } catch (e: any) {
          set({ error: e?.message || '加载BOM列表失败', loading: false });
        }
      },

      fetchBomStructure: async (bomId) => {
        try {
          const res = await getBomStructure(bomId);
          set({ bomTree: res?.data || [] });
        } catch {
          set({ bomTree: [] });
        }
      },

      setCurrentBom: (bom) => set({ currentBom: bom }),

      submitApproval: async (bomId) => {
        await submitForApproval(bomId);
        const { currentBom, boms } = get();
        if (currentBom && currentBom.id === Number(bomId)) {
          set({ currentBom: { ...currentBom, status: 2 } });
        }
        set({
          boms: boms.map((b) =>
            b.id === Number(bomId) ? { ...b, status: 2 } : b
          ),
        });
      },

      withdrawApproval: async (bomId) => {
        await withdrawBomApproval(bomId);
        const { currentBom, boms } = get();
        if (currentBom && currentBom.id === Number(bomId)) {
          set({ currentBom: { ...currentBom, status: 1 } });
        }
        set({
          boms: boms.map((b) =>
            b.id === Number(bomId) ? { ...b, status: 1 } : b
          ),
        });
      },

      invalidate: () => set({ boms: [], currentBom: null, bomTree: [] }),
    }),
    { name: 'bom-store' },
  ),
);

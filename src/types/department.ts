export interface Department {
  id: number; // was string
  name: string;
  parentId?: number | null; // was string
  sortOrder?: number;
}

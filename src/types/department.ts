export interface Department {
  id: string;
  name: string;
  parentId?: string | null;
  sortOrder?: number;
}

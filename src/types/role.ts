export interface Role {
  id: number; // was string
  name: string;
  description?: string;
  permissions: string[];
}

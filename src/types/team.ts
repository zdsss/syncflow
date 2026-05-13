export interface Team {
  id: number; // was string
  name: string;
  description?: string;
  memberCount: number;
  leaderId: number; // was string
  createdAt: string;
  updatedAt: string;
}

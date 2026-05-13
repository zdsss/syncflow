export type FileType = 'folder' | 'document' | 'image' | 'code' | 'spreadsheet';

export interface FileRecord {
  id: number; // was string
  name: string;
  type: FileType;
  extension?: string;
  size: number;
  path: string;
  parentFolderId?: number | null; // was string
  uploaderId: number; // was string
  uploaderName?: string;
  version: number;
  projectId?: number | null; // was string
  downloadCount: number;
  isDeleted: boolean;
  createdAt: string;
  updatedAt: string;
}

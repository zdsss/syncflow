export type FileType = 'folder' | 'document' | 'image' | 'code' | 'spreadsheet';

export interface FileRecord {
  id: string;
  name: string;
  type: FileType;
  extension?: string;
  size: number;
  path: string;
  parentFolderId?: string | null;
  uploaderId: string;
  uploaderName?: string;
  version: number;
  projectId?: string | null;
  downloadCount: number;
  isDeleted: boolean;
  createdAt: string;
  updatedAt: string;
}

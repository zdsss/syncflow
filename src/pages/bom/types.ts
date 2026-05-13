export interface BomItem {
  id: number;
  bomId?: number;
  parentId?: number | null;
  name: string;
  materialCode?: string;
  specification?: string;
  drawingNo?: string;
  material?: string;
  surfaceTreatment?: string;
  sourceType?: string;
  quantity: number;
  weight?: number;
  totalWeight?: number;
  unitOfMeasure?: string;
  isVirtual?: boolean;
  storageLocation?: string;
  isOptional?: boolean;
  remark?: string;
  level?: number;
  levelNo?: string;
  seqNo?: number;
  children?: BomItem[];
}

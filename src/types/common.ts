export interface PaginationParams {
  page: number;
  pageSize: number;
}

export interface PageResult<T> {
  records: T[];
  total: number;
  pageNum: number;
  pageSize: number;
}

export interface ApiResult<T> {
  code: number;
  message: string;
  data: T;
}

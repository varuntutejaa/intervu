const DEFAULT_PAGE_SIZE = 20;
const MAX_PAGE_SIZE = 100;

export interface PaginationParams {
  page: number;
  pageSize: number;
  limit: number;
  offset: number;
}

// Shared by every list repository — reads `page`/`pageSize` off whatever
// query object the controller hands it, clamped to sane bounds so a bad or
// malicious value can't force an unbounded `SELECT *`.
export function parsePagination(query: Record<string, unknown>): PaginationParams {
  const rawPage = Number(query.page);
  const rawPageSize = Number(query.pageSize);
  const page = Number.isFinite(rawPage) && rawPage > 0 ? Math.floor(rawPage) : 1;
  const pageSize =
    Number.isFinite(rawPageSize) && rawPageSize > 0
      ? Math.min(MAX_PAGE_SIZE, Math.floor(rawPageSize))
      : DEFAULT_PAGE_SIZE;
  return { page, pageSize, limit: pageSize, offset: (page - 1) * pageSize };
}

export interface Paginated<T> {
  items: T[];
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

export function buildPaginated<T>(items: T[], total: number, page: number, pageSize: number): Paginated<T> {
  return { items, page, pageSize, total, totalPages: Math.max(1, Math.ceil(total / pageSize)) };
}

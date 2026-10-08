export const PAGE_SIZE = 20;

export type PageParams = { limit?: number; offset?: number };

export type Pagination = { total: number; limit: number; offset: number };

export type Paginated<T> = { data: T[]; pagination: Pagination };

export const okResponse = (data: any) => ({ data, status: 'OK' });

export const paginatedResponse = (data: any[], total: number, limit: number, offset: number) => ({
  data,
  status: 'OK',
  pagination: { total, limit, offset },
});

export const errorResponse = (error: string, data?: any) => ({ error, status: 'ERROR', data });

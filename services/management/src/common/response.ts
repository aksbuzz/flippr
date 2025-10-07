export const okResponse = (data: any) => ({ data, status: 'OK' });
export const errorResponse = (error: string, data?: any) => ({ error, status: 'ERROR', data });
